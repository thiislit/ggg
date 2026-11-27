import { CONFIG } from '../../data/config.js';
import { LAYOUT } from '../../data/Layout.js';
import { GAME_STATE } from '../../constants/game.js';
import { ASSET_KEYS } from '../../constants/AssetKeys.js';
import { AudioManager } from '../../managers/AudioManager.js';
import { createOnlineChannel } from '../../managers/OnlineChannel.js';
import { OnlineMatch } from '../../managers/OnlineMatch.js';
import { EmojiReactions, REACTION_EMOJIS } from '../../ui/components/EmojiReactions.js';
import { buildRivalOpponent } from '../../ui/components/CombatParticipants.js';
import { DialogueBox } from '../../ui/components/DialogueBox.js';

const RETURN_TO_LOBBY_MS = 3000;
/** Tiempo que se espera a un rival desconectado antes de dar la partida por terminada. */
export const RIVAL_GRACE_MS = 20000;
/** Tiempo que la sala sigue abierta tras el final por si al rival le falta la última jugada. */
export const LINGER_MS = 15000;

/**
 * Al acabar la partida, quien ve el resultado primero pasa a GAME OVER en unos segundos.
 * Si en ese momento al rival se le había perdido nuestra última jugada (microcorte de red),
 * cerrar la sala lo dejaría en "WAITING FOR RIVAL..." sin forma de recuperarla.
 * Por eso la sala sigue abierta LINGER_MS en segundo plano (sin escena) y OnlineMatch
 * responde a sus reintentos. No se cierra antes aunque el rival "salga" de la sala:
 * ese mismo microcorte suele hacer desaparecer su presencia un momento.
 */
function lingerThenClose(match, channel, ms = LINGER_MS) {
    match.silence();
    setTimeout(() => {
        match.destroy();
        channel.close();
    }, ms);
}

/**
 * Todo lo específico de Online Versus dentro de GameScene:
 * canal con el rival, panel de emojis, sincronización de rondas y desconexión.
 *
 * GameScene solo le avisa de eventos de juego (elegí, pulsé NEXT, cambié de lado...)
 * y el controlador decide qué hacer. Así Quick Play y Story no dependen del online.
 *
 * - Con `channel` (venido de OnlineLobbyScene): partida real contra otra persona.
 * - Sin `channel`: práctica (PRACTICE) contra la IA con un rival de emojis simulado.
 */
export class OnlineVersusController {
    constructor(scene, { channel = null, rival = null } = {}) {
        this.scene = scene;
        this.rival = rival;
        this.isRealMatch = Boolean(channel);
        this.channel = channel || createOnlineChannel({ emojis: REACTION_EMOJIS });
        this.match = null;
        this.emojiReactions = null;
        this.statusText = null;
        this.alertText = null;
        this.rivalGraceTimer = null;
        this.connectionLost = false;
        this.destroyed = false;
        this.unsubscribers = [];
    }

    /** Oponente que debe mostrar la escena (el otro jugador), o null para usar la CPU. */
    getOpponent() {
        return this.isRealMatch && this.rival ? buildRivalOpponent(this.rival) : null;
    }

    /** true si las rondas las coordina la red en vez de la IA local. */
    get controlsRounds() {
        return Boolean(this.match);
    }

    /** Crea el panel de emojis y engancha los mensajes del rival. Llamar tras crear los controles. */
    build({ width, footerTop, isPlayerRight }) {
        const scene = this.scene;

        this.emojiReactions = new EmojiReactions(scene, {
            emojis: REACTION_EMOJIS,
            onSend: (emoji) => {
                AudioManager.playSFX(scene, ASSET_KEYS.AUDIO.SFX_BUTTON);
                this.channel?.send('emoji', { emoji });
            },
        });
        this.emojiReactions.create(
            LAYOUT.getOnlinePanelX(width, isPlayerRight),
            LAYOUT.getOnlineDisplayY(footerTop),
            LAYOUT.getEmojiBarY(footerTop)
        );

        this.unsubscribers = [
            // Los emojis del rival aparecen en su contenedor (el mismo que revela su jugada)
            this.channel.on('emoji', ({ emoji }) => {
                this.emojiReactions?.showInDisplay(scene.choiceControls?.onlineRivalDisplay, emoji);
            }),
            this.channel.on('rival-left', () => this.onRivalLeft()),
            this.channel.on('rival-joined', (rival) => this.onRivalRejoined(rival)),
            this.channel.on('connection', ({ connected }) => this.onConnectionChange(connected)),
        ];

        if (this.isRealMatch) {
            this.match = new OnlineMatch(this.channel, {
                roundDurationMs: CONFIG.TIMING.ROUND_DURATION,
                // Respaldo si el temporizador visual se congeló (app en segundo plano)
                onLocalTimeout: () => {
                    if (scene.currentState === GAME_STATE.COUNTDOWN) this.lockChoice(-1);
                },
                onRivalReady: () => {
                    // Aviso visual: el rival ya pulsó PLAY/NEXT
                    if (scene.currentState === GAME_STATE.IDLE) {
                        scene.ui.updateAIIndicator(CONFIG.COLORS.AI_READY_GREEN);
                    }
                },
                onRoundStart: () => scene.startRound(),
                onRivalLocked: () => scene.ui.updateAIIndicator(CONFIG.COLORS.AI_READY_GREEN),
                onRoundResolved: (myChoice, rivalChoice) => {
                    this.hideStatus();
                    scene.resolveRound(myChoice, rivalChoice);
                },
            });
        }
    }

    // --- EVENTOS QUE AVISA GameScene ---

    /** PLAY/NEXT pulsado: avisar al rival y esperar a que él también esté listo. */
    requestRound() {
        if (!this.match || this.match.meReady) return;
        const scene = this.scene;
        if (scene.nextRondaBtn) {
            scene.nextRondaBtn.destroy();
            scene.nextRondaBtn = null;
        }
        this.showStatus('WAITING FOR RIVAL...');
        this.match.markReady(); // Si el rival ya estaba listo, la ronda empieza aquí mismo
    }

    onRoundStarted() {
        this.hideStatus();
    }

    /** El jugador eligió (o se le acabó el tiempo: -1). Se resuelve al llegar ambas jugadas. */
    lockChoice(choice) {
        // Puede llegar dos veces (botón + tiempo límite): solo vale la primera
        if (!this.match || this.match.myChoice !== undefined) return;
        const scene = this.scene;
        scene.setState(GAME_STATE.LOCKED);
        scene.ui.stopTimer();
        this.match.lock(choice);
        if (!this.match.resolved) this.showStatus('WAITING FOR RIVAL...');
    }

    /** Vuelta a IDLE tras una ronda: el indicador vuelve a rojo hasta que el rival pulse NEXT. */
    onBackToIdle() {
        if (this.match && !this.match.rivalReady) this.scene.ui.resetAIIndicator();
    }

    onSwitchSides(width, isPlayerRight) {
        this.emojiReactions?.move(LAYOUT.getOnlinePanelX(width, isPlayerRight));
    }

    applyTheme() {
        this.emojiReactions?.applyTheme();
    }

    // --- INTERNOS ---

    showStatus(text) {
        const scene = this.scene;
        if (!this.statusText) {
            const { width } = scene.scale;
            this.statusText = scene.add
                .text(width / 2, scene.barY - 40, '', {
                    fontFamily: CONFIG.FONTS.MAIN,
                    fontSize: CONFIG.FONTS.SIZES.NORMAL,
                    color: CONFIG.THEME.primaryStr,
                    backgroundColor: '#000000',
                    padding: { x: 12, y: 8 },
                })
                .setOrigin(0.5)
                .setDepth(2100);
            scene.tweens.add({
                targets: this.statusText,
                alpha: 0.4,
                duration: 600,
                yoyo: true,
                repeat: -1,
            });
        }
        this.statusText.setText(text).setVisible(true);
    }

    hideStatus() {
        this.statusText?.setVisible(false);
    }

    /** Aviso grande en el centro (conexión propia o del rival). */
    showAlert(text) {
        const scene = this.scene;
        if (!this.alertText) {
            const { width, height } = scene.scale;
            this.alertText = scene.add
                .text(width / 2, height / 2, '', {
                    fontFamily: CONFIG.FONTS.MAIN,
                    fontSize: CONFIG.FONTS.SIZES.NORMAL,
                    color: CONFIG.THEME.secondaryStr,
                    backgroundColor: '#000000',
                    align: 'center',
                    lineSpacing: 10,
                    padding: { x: 16, y: 12 },
                })
                .setOrigin(0.5)
                .setDepth(3500);
        }
        this.alertText.setText(text).setVisible(true);
    }

    hideAlert() {
        this.alertText?.setVisible(false);
    }

    /** Muestra el aviso más importante que siga vigente (o ninguno). */
    refreshAlert() {
        if (this.connectionLost) this.showAlert('CONNECTION LOST\nRECONNECTING...');
        else if (this.rivalGraceTimer) this.showAlert('RIVAL DISCONNECTED\nWAITING FOR THEM...');
        else this.hideAlert();
    }

    isMatchOver() {
        return [GAME_STATE.FATALITY, GAME_STATE.GAME_OVER].includes(this.scene.currentState);
    }

    onConnectionChange(connected) {
        if (!this.isRealMatch || this.isMatchOver()) return;
        this.connectionLost = !connected;
        this.refreshAlert();
    }

    /**
     * El rival desapareció de la sala. Puede ser un corte breve (túnel, cambio de red,
     * app en segundo plano): se le da RIVAL_GRACE_MS para volver antes de terminar.
     */
    onRivalLeft() {
        // Al terminar la partida ambos salen de la sala: eso no es un abandono
        if (this.isMatchOver()) return;
        if (!this.isRealMatch) return this.endMatchRivalGone();
        if (this.rivalGraceTimer) return;
        this.rivalGraceTimer = this.scene.time.delayedCall(RIVAL_GRACE_MS, () => {
            this.rivalGraceTimer = null;
            this.endMatchRivalGone();
        });
        this.refreshAlert();
    }

    /** El rival volvió dentro del periodo de gracia: la partida sigue donde estaba. */
    onRivalRejoined(rival) {
        if (!this.rivalGraceTimer) return;
        if (this.rival?.id && rival?.id && rival.id !== this.rival.id) return; // otra persona
        this.rivalGraceTimer.remove(false);
        this.rivalGraceTimer = null;
        this.refreshAlert();
        // Los reenvíos de OnlineMatch recuperan cualquier mensaje perdido durante el corte
    }

    endMatchRivalGone() {
        const scene = this.scene;
        if (this.isMatchOver()) return;
        this.hideAlert();

        const { width, height } = scene.scale;
        const notice = new DialogueBox(
            scene,
            width / 2,
            height / 2,
            'YOUR RIVAL LEFT THE ROOM',
            CONFIG.COLORS.CPU_RED
        );
        if (!scene.activeBubbles) scene.activeBubbles = [];
        scene.activeBubbles.push(notice);

        if (this.isRealMatch) {
            this.match?.destroy();
            this.match = null;
            this.hideStatus();
            scene.setState(GAME_STATE.GAME_OVER);
            scene.time.delayedCall(RETURN_TO_LOBBY_MS, () => scene.scene.start('OnlineLobbyScene'));
        }
    }

    /**
     * Cierra la sala y libera todo. GameScene lo llama al apagarse.
     * Si la partida terminó normalmente, la sala sigue abierta un rato en segundo plano
     * (ver `lingerThenClose`); si se abandona a mitad, se cierra ya para que el rival lo sepa.
     */
    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.rivalGraceTimer?.remove(false);
        this.rivalGraceTimer = null;
        this.unsubscribers.forEach((off) => off());
        this.unsubscribers = [];
        if (this.match && this.channel && this.isRealMatch && this.isMatchOver()) {
            lingerThenClose(this.match, this.channel);
        } else {
            this.match?.destroy();
            this.channel?.close();
        }
        this.match = null;
        this.statusText = null;
        this.alertText = null;
        this.channel = null;
        this.emojiReactions?.destroy();
        this.emojiReactions = null;
    }
}
