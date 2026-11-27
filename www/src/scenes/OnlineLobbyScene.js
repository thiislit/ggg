import { CONFIG } from '../data/config.js';
import { DataManager } from '../managers/DataManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { CampaignManager } from '../managers/CampaignManager.js';
import { RetroButton } from '../ui/components/RetroButton.js';
import { ASSET_KEYS } from '../constants/AssetKeys.js';
import {
    SupabaseOnlineChannel,
    getSupabaseClient,
    generateRoomCode,
    createPlayerProfile,
    ROOM_CODE_LENGTH,
    MAX_PLAYERS,
} from '../managers/SupabaseOnlineChannel.js';

const MAX_CREATE_ATTEMPTS = 3;
const MATCH_START_DELAY_MS = 1200;

/**
 * Sala del modo Online Versus: crear una sala (muestra un código) o unirse
 * escribiendo el código del amigo. Cuando hay 2 jugadores arranca GameScene
 * entregándole el canal ya conectado.
 */
export class OnlineLobbyScene extends Phaser.Scene {
    constructor() {
        super('OnlineLobbyScene');
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

        this.channel = null;
        this.channelListeners = [];
        this.handedOver = false;
        this.viewObjects = [];
        this.flowId = 0;
        this.enteredCode = '';
        this.matchTimer = null;

        this.add
            .text(width / 2, height * 0.12, 'ONLINE VERSUS', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: '28px',
                color: CONFIG.THEME.primaryStr,
            })
            .setOrigin(0.5);

        this.statusText = this.add
            .text(width / 2, height * 0.22, '', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.NORMAL,
                color: CONFIG.THEME.secondaryStr,
                align: 'center',
                lineSpacing: 10,
                wordWrap: { width: width * 0.85 },
            })
            .setOrigin(0.5);

        this.events.once('shutdown', () => this.cleanup());
        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.showMenu();
    }

    // --- VISTAS ---

    showMenu(message = '') {
        this.resetFlow();
        const { width, height } = this.scale;
        const isConfigured = Boolean(getSupabaseClient());

        this.setStatus(
            message ||
                (isConfigured
                    ? 'PLAY WITH A FRIEND\nUSING A ROOM CODE'
                    : 'ONLINE NOT CONFIGURED YET\nYOU CAN PRACTICE VS A SIMULATED RIVAL'),
            message ? CONFIG.COLORS.CPU_RED : null
        );

        let y = height * 0.4;
        const gap = height * 0.11;
        if (isConfigured) {
            this.addButton(width / 2, y, 'CREATE ROOM', CONFIG.THEME.PRIMARY, () =>
                this.createRoom()
            );
            y += gap;
            this.addButton(width / 2, y, 'JOIN ROOM', CONFIG.THEME.PRIMARY, () => this.showJoin());
            y += gap;
        }
        this.addButton(width / 2, y, 'PRACTICE', CONFIG.THEME.ACCENT || 0x00ff00, () =>
            this.startGame({ channel: null, rival: null })
        );
        this.addButton(width / 2, height * 0.88, 'BACK', CONFIG.THEME.SECONDARY, () =>
            this.scene.start('MainMenuScene')
        );
    }

    showWaiting(code) {
        this.clearView();
        const { width, height } = this.scale;
        this.setStatus('SHARE THIS CODE\nWITH YOUR FRIEND');
        this.addCodeDisplay(code);
        this.waitingText = this.track(
            this.add
                .text(width / 2, height * 0.52, 'WAITING FOR RIVAL...', {
                    fontFamily: CONFIG.FONTS.MAIN,
                    fontSize: CONFIG.FONTS.SIZES.NORMAL,
                    color: CONFIG.THEME.primaryStr,
                })
                .setOrigin(0.5)
        );
        this.tweens.add({
            targets: this.waitingText,
            alpha: 0.3,
            duration: 700,
            yoyo: true,
            repeat: -1,
        });
        this.addButton(width / 2, height * 0.88, 'CANCEL', CONFIG.THEME.SECONDARY, () =>
            this.showMenu()
        );
    }

    showJoin(message = '') {
        this.resetFlow();
        const { width, height } = this.scale;
        this.enteredCode = '';
        this.setStatus(
            message || "ENTER YOUR FRIEND'S\nROOM CODE",
            message ? CONFIG.COLORS.CPU_RED : null
        );
        this.codeText = this.addCodeDisplay(this.formatCode(''));

        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'];
        const keyW = 150;
        const keyH = 90;
        const gapX = 20;
        const gapY = 18;
        const startX = width / 2 - keyW - gapX;
        const startY = height * 0.45;
        keys.forEach((key, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            this.addKey(
                startX + col * (keyW + gapX),
                startY + row * (keyH + gapY),
                keyW,
                keyH,
                key,
                () => this.onKey(key)
            );
        });

        this.addButton(width / 2, height * 0.88, 'BACK', CONFIG.THEME.SECONDARY, () =>
            this.showMenu()
        );
    }

    showConnecting(text) {
        this.clearView();
        this.setStatus(text);
        const { width, height } = this.scale;
        this.addButton(width / 2, height * 0.88, 'CANCEL', CONFIG.THEME.SECONDARY, () =>
            this.showMenu()
        );
    }

    // --- FLUJOS ---

    async createRoom() {
        const flow = this.resetFlow();
        this.showConnecting('CREATING ROOM...');
        try {
            for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
                const code = generateRoomCode();
                const channel = this.newChannel(code);
                const others = await channel.connect();
                if (flow !== this.flowId) return channel.close();
                if (others.length > 0) {
                    channel.close(); // Código en uso: probar otro
                    continue;
                }
                this.useChannel(channel);
                await channel.enter();
                if (flow !== this.flowId) return;
                this.showWaiting(code);
                return;
            }
            this.showMenu('COULD NOT CREATE A ROOM.\nTRY AGAIN');
        } catch (error) {
            if (flow !== this.flowId) return;
            console.warn('[Online] createRoom failed', error);
            this.showMenu('CONNECTION ERROR.\nCHECK YOUR INTERNET');
        }
    }

    async joinRoom(code) {
        const flow = this.resetFlow();
        this.showConnecting(`JOINING ROOM ${code}...`);
        try {
            const channel = this.newChannel(code);
            const others = await channel.connect();
            if (flow !== this.flowId) return channel.close();
            if (others.length === 0) {
                channel.close();
                return this.showJoin('ROOM NOT FOUND');
            }
            if (others.length >= MAX_PLAYERS) {
                channel.close();
                return this.showJoin('ROOM IS FULL');
            }
            this.useChannel(channel);
            await channel.enter();
        } catch (error) {
            if (flow !== this.flowId) return;
            console.warn('[Online] joinRoom failed', error);
            this.showJoin('CONNECTION ERROR.\nCHECK YOUR INTERNET');
        }
    }

    onKey(key) {
        AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_BUTTON);
        if (key === '⌫') {
            this.enteredCode = this.enteredCode.slice(0, -1);
        } else if (key === 'OK') {
            if (this.enteredCode.length === ROOM_CODE_LENGTH) this.joinRoom(this.enteredCode);
            return;
        } else if (this.enteredCode.length < ROOM_CODE_LENGTH) {
            this.enteredCode += key;
        }
        this.codeText?.setText(this.formatCode(this.enteredCode));
    }

    onRivalJoined(rival) {
        this.clearView();
        this.setStatus(`RIVAL FOUND!\n\n${rival.name}`);
        AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_REVEAL);
        this.matchTimer?.remove(false);
        this.matchTimer = this.time.delayedCall(MATCH_START_DELAY_MS, () => {
            this.matchTimer = null;
            const currentRival = this.channel?.rival;
            if (!currentRival) return; // Se fue durante la espera: onRivalLeft ya actualizó la vista
            this.startGame({ channel: this.channel, rival: currentRival });
        });
    }

    onRivalLeft() {
        this.matchTimer?.remove(false);
        this.matchTimer = null;
        if (this.channel) this.showWaiting(this.channel.roomCode);
    }

    startGame({ channel, rival }) {
        if (this.handedOver) return;
        this.handedOver = true;
        this.detachChannelListeners();
        CampaignManager.stopCampaign();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { isOnline: true, channel, rival });
        });
    }

    // --- CANAL ---

    newChannel(code) {
        return new SupabaseOnlineChannel({
            client: getSupabaseClient(),
            roomCode: code,
            profile: createPlayerProfile({
                name: DataManager.getName(),
                avatar: DataManager.getAvatar(),
                species: DataManager.getSpecies(),
                planet: DataManager.getPlanet(),
            }),
        });
    }

    useChannel(channel) {
        this.channel = channel;
        this.channelListeners = [
            channel.on('rival-joined', (rival) => this.onRivalJoined(rival)),
            channel.on('rival-left', () => this.onRivalLeft()),
            channel.on('room-full', () => this.showJoin('ROOM IS FULL')),
        ];
    }

    detachChannelListeners() {
        this.channelListeners.forEach((off) => off());
        this.channelListeners = [];
    }

    /** Cancela lo que estuviera en curso (sala, conexión) y devuelve el id del nuevo flujo. */
    resetFlow() {
        this.flowId += 1;
        this.matchTimer?.remove(false);
        this.matchTimer = null;
        this.detachChannelListeners();
        this.channel?.close();
        this.channel = null;
        this.clearView();
        return this.flowId;
    }

    cleanup() {
        this.flowId += 1;
        this.detachChannelListeners();
        if (!this.handedOver) this.channel?.close();
        this.channel = null;
    }

    // --- UI HELPERS ---

    setStatus(text, color = null) {
        this.statusText.setText(text);
        this.statusText.setFill(
            color != null ? this.toColorString(color) : CONFIG.THEME.secondaryStr
        );
    }

    toColorString(color) {
        return typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color;
    }

    formatCode(code) {
        return code.padEnd(ROOM_CODE_LENGTH, '_').split('').join(' ');
    }

    addCodeDisplay(text) {
        const { width, height } = this.scale;
        const bg = this.track(this.add.graphics());
        bg.fillStyle(0x000000, 0.7);
        bg.fillRoundedRect(width / 2 - 220, height * 0.32 - 50, 440, 100, CONFIG.UI.BUTTON_RADIUS);
        bg.lineStyle(3, CONFIG.THEME.primary);
        bg.strokeRoundedRect(
            width / 2 - 220,
            height * 0.32 - 50,
            440,
            100,
            CONFIG.UI.BUTTON_RADIUS
        );
        return this.track(
            this.add
                .text(width / 2, height * 0.32, text, {
                    fontFamily: CONFIG.FONTS.MAIN,
                    fontSize: '40px',
                    color: CONFIG.THEME.primaryStr,
                })
                .setOrigin(0.5)
        );
    }

    addKey(x, y, w, h, label, onPress) {
        const container = this.track(this.add.container(x, y));
        const bg = this.add.graphics();
        const draw = (alpha) => {
            bg.clear();
            bg.fillStyle(0x000000, alpha);
            bg.fillRoundedRect(-w / 2, -h / 2, w, h, CONFIG.UI.BUTTON_RADIUS);
            bg.lineStyle(3, CONFIG.THEME.primary);
            bg.strokeRoundedRect(-w / 2, -h / 2, w, h, CONFIG.UI.BUTTON_RADIUS);
        };
        draw(0.6);
        const text = this.add
            .text(0, 0, label, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: label === '⌫' ? '32px' : '24px',
                color: CONFIG.THEME.primaryStr,
            })
            .setOrigin(0.5);
        container.add([bg, text]);
        container.setSize(w, h).setInteractive({ useHandCursor: true });
        container.on('pointerdown', () => {
            draw(0.9);
            onPress();
        });
        container.on('pointerup', () => draw(0.6));
        container.on('pointerout', () => draw(0.6));
    }

    addButton(x, y, label, color, onClick) {
        return this.track(new RetroButton(this, x, y, label, color, onClick));
    }

    track(object) {
        this.viewObjects.push(object);
        return object;
    }

    clearView() {
        this.viewObjects.forEach((object) => {
            this.tweens.killTweensOf(object);
            object?.destroy?.();
        });
        this.viewObjects = [];
        this.waitingText = null;
        this.codeText = null;
    }
}
