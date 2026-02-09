import { CONFIG } from '../data/config.js';
import { FatalityManager } from '../managers/FatalityManager.js';
import { OpponentAI } from '../managers/OpponentAI.js';
import { AudioManager } from '../managers/AudioManager.js';
import { DIALOGUES } from '../managers/DialogueManager.js';
import { OPPONENTS } from '../data/Opponents.js';
import { DataManager } from '../managers/DataManager.js';
import { CampaignManager } from '../managers/CampaignManager.js';
import { CombatUI } from '../ui/CombatUI.js';
import { CombatManager } from '../managers/CombatManager.js';
import { DialogueBox } from '../ui/components/DialogueBox.js';
import { LAYOUT } from '../data/Layout.js';
import { ASSET_KEYS } from '../constants/AssetKeys.js';
import { TutorialManager } from '../managers/TutorialManager.js'; // Import TutorialManager

// --- MÁQUINA DE ESTADOS FINITA ---
const GAME_STATE = {
    IDLE: 'IDLE',           // Esperando input (Menú o Siguiente Ronda)
    COUNTDOWN: 'COUNTDOWN', // Ronda activa, tiempo corriendo
    LOCKED: 'LOCKED',       // Jugador eligió (o tiempo fuera), procesando
    RESULT: 'RESULT',       // Mostrando resultado (Win/Lose)
    FATALITY: 'FATALITY',   // Secuencia final
    GAME_OVER: 'GAME_OVER'  // Pantalla de fin
};

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        // Inicialización de datos básicos
        this.p1Health = 3;
        this.p2Health = 3;
        this.playerStats = [0, 0, 0];
        this.playerName = 'PLAYER 1';
        this.dialogueDecks = { P1: {}, CPU: {} };
        
        // Estado Inicial
        this.currentState = GAME_STATE.IDLE;
        this.isPlayerRight = false; // Se carga en create

        this.currentOpponent = null; // Almacena el oponente actual para diálogos, etc.
        this.shakeEvent = null; // Evento de temporizador para el shake continuo
    }

    // --- GESTIÓN DE ESTADO ---
    setState(newState) {
        this.currentState = newState;
    }

    // --- MANEJO DE VIBRACIÓN CONTINUA ---
    startContinuousShake() {
        if (this.shakeEvent) return; // Already shaking

        // Iniciar un evento repetido que agite la cámara
        this.shakeEvent = this.time.addEvent({
            delay: 300, // Duración de cada sacudida individual
            callback: () => {
                this.cameras.main.shake(300, 0.02);
            },
            loop: true
        });
    }

    stopContinuousShake() {
        if (this.shakeEvent) {
            this.shakeEvent.destroy();
            this.shakeEvent = null;
        }
        this.cameras.main.shakeEffect.reset(); // Asegurarse de detener cualquier sacudida en progreso
    }

    async create() {
        let enemy = OPPONENTS.ZORG; // Initialize with a default valid enemy

        // Cargar Datos
        this.playerName = DataManager.getName();
        this.playerSpecies = DataManager.getSpecies();
        this.playerPlanet = DataManager.getPlanet();
        this.playerAvatar = DataManager.getAvatar();
        
        this.isPlayerRight = DataManager.isPlayerRight();
        
        // --- CONFIGURACIÓN DE MODO DE JUEGO ---
        if (CampaignManager.isActive()) {
            const levelConfig = CampaignManager.getCurrentConfig();
            this.difficulty = levelConfig.difficulty;
            this.cpuName = levelConfig.name; // Ej: "OUTER RIM"
            enemy = OPPONENTS.ZORG; // Campaign mode always fights Zorg
            this.p2Health = 3; // For campaign, health is always 3
            
            // Cambiar fondo según nivel
            const bgScene = this.scene.get('BackgroundScene');
            if (bgScene) {
                bgScene.changeBackground(levelConfig.bg);
            }
        } else {
            // MODO RÁPIDO (Estándar)
            this.difficulty = DataManager.getDifficulty();
            
            let availableOpponents = [...OPPONENTS.QUICK_PLAY_POOL];

            if (DataManager.hasCompletedStory()) {
                availableOpponents.push(OPPONENTS.ZORG); // Add Zorg if story is completed
            }

            // Seleccionar un enemigo aleatorio del pool de Quick Play
            const randomEnemyIndex = Phaser.Math.Between(0, availableOpponents.length - 1);
            enemy = availableOpponents[randomEnemyIndex];
            
            this.p2Health = enemy.stats.health;
            this.cpuName = enemy.name;

            // Lógica de backgrounds para Quick Play
            let quickPlayBackgroundPool = ['bg_purple']; // Fondo base para Quick Play

            if (DataManager.hasCompletedStory()) {
                quickPlayBackgroundPool.push('bg_campaign_easy', 'bg_campaign_medium', 'bg_campaign_hard');
            }

            const randomBgIndex = Phaser.Math.Between(0, quickPlayBackgroundPool.length - 1);
            const selectedBg = quickPlayBackgroundPool[randomBgIndex];

            const bgScene = this.scene.get('BackgroundScene');
            if (bgScene) bgScene.changeBackground(selectedBg);
        }

        this.ui = new CombatUI(this, enemy); // Pass enemy here!
        this.currentOpponent = enemy; // Store the determined enemy for later use, e.g., dialogues

        // Reset de Partida
        this.p1Health = 3;
        this.playerStats = [0, 0, 0];
        this.activeBubbles = [];

        this.fatalityManager = new FatalityManager(this);
        this.ui.resetAIIndicator(); // Asegurar que el indicador esté en rojo al inicio

        // Asegurar música de batalla
        AudioManager.playMusic(this, ASSET_KEYS.AUDIO.MUSIC_BGM, { volume: 0.5 });

        // Construir Escena
        this.buildGame();
        this.applyTheme(); 
        
        // Iniciar en IDLE esperando al usuario
        this.setState(GAME_STATE.IDLE);
        
        // Botón inicial de "PLAY"
        this.nextRondaBtn = this.ui.createNextRondaBtn("PLAY", this.barY);
        this.setupNextRoundBtnListeners();

        this.tutorialManager = new TutorialManager(this); // Instantiate TutorialManager
        this.tutorialManager.checkTutorial(); // Call checkTutorial through the manager
    }

    buildGame() {
        const { width, height } = this.scale;
        const safeTop = this.game.registry.get('safeTop') || 0;
        const SAFE_TOP = Math.max(safeTop, 40); 
        const CENTER_X = width / 2;
        const FOOT_Y = LAYOUT.getGridBottom(height);
        this.barY = FOOT_Y + LAYOUT.COMBAT.TIMER_BAR_OFFSET; 

        // 1. Márgenes y Grilla
        this.ui.updateMainMargins(width, height);
        this.ui.drawGrid();

        const HUD_BASE_Y = SAFE_TOP + LAYOUT.HUD.OFFSET_Y; 
        const HEARTS_Y = LAYOUT.getHeartsY(height); 

        const p1X = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2X = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        // 2. HUD y Avatares
        this.ui.initHUD(p1X, p2X, HUD_BASE_Y, HEARTS_Y);
        this.ui.initAvatars(p1X, p2X, LAYOUT.getAvatarY(height));

        // 3. Emojis y Barras de Tiempo
        this.ui.initRoundElements(p1X, p2X, LAYOUT.getEmojiY(height));
        this.ui.initTimerBars(width, this.barY);
        this.ui.updateBarPositions(this.isPlayerRight, width);

        // 4. Botones y Controles
        this.createResponsiveButtons(width, height, FOOT_Y);
        this.ui.initControls(width, height, 20);

        // Posicionar el indicador de la IA inicialmente
        let indicatorBtnRef; // Referencia al botón (mute o config)
        if (!this.isPlayerRight) { // Máquina a la derecha
            indicatorBtnRef = this.ui.elements.muteBtn;
        } else { // Máquina a la izquierda
            indicatorBtnRef = this.ui.elements.configBtn;
        }
        // Posicionar encima del centro del botón, con offset vertical para que esté "arriba"
        const indicatorX_initial = indicatorBtnRef.getBounds().centerX;
        const indicatorY_initial = indicatorBtnRef.getBounds().top - 10; // 10px por encima del borde superior real del botón
        
        this.ui.elements.aiIndicator.setPosition(indicatorX_initial, indicatorY_initial);

        // Referencias para animaciones (Legacy support para FatalityManager si las usa directo)
        // Idealmente FatalityManager debería usar la UI, pero por ahora mantenemos referencias
        this.p1Emoji = this.ui.elements.p1Emoji;
        this.p2Emoji = this.ui.elements.p2Emoji;
        this.p1Status = this.ui.elements.p1NameTxt;
        this.p2Status = this.ui.elements.p2NameTxt;
        this.timeText1 = this.ui.elements.timeText1;
        this.timeText2 = this.ui.elements.timeText2;

        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
    }

    // --- GAMEPLAY LOOP ---

    startRound() {
        // Limpieza previa
        if (this.nextRoundTimer) { this.nextRoundTimer.remove(false); this.nextRoundTimer = null; }
        if (this.nextRondaBtn) { this.nextRondaBtn.destroy(); this.nextRondaBtn = null; }
        if (this.activeBubbles) { this.activeBubbles.forEach(b => { if (b && b.destroy) b.destroy(); }); this.activeBubbles = []; }

        this.ui.stopTimer();
        this.ui.hideResultText();
        this.resetButtonColors();
        this.ui.resetAIIndicator(); // Reiniciar el indicador de la IA a rojo

        // La IA elige su movimiento en los primeros segundos (hasta 3 segundos)
        this.time.delayedCall(Phaser.Math.Between(100, 3000), () => { // Retraso aleatorio entre 0.1 y 3 segundos
            this.cpuChoiceThisRound = this.getCpuChoice(); // La IA hace su elección
            this.ui.updateAIIndicator(CONFIG.COLORS.AI_READY_GREEN); // Cambiar el indicador a verde
        });

        // Cambio de Estado -> COUNTDOWN
        this.setState(GAME_STATE.COUNTDOWN);
        
        // Animación visual de inicio
        this.ui.animateRoundStart(this.isPlayerRight, CONFIG.TIMING.ROUND_DURATION, () => {});

        // Iniciar Timer Lógico
        this.ui.runTimer(CONFIG.TIMING.ROUND_DURATION, () => {
            // Callback si se acaba el tiempo
            if (this.currentState === GAME_STATE.COUNTDOWN) {
                this.resolveRound(-1);
            }
        });
    }

    handleInput(index) {
        // SOLO permitir input durante la cuenta atrás
        if (this.currentState !== GAME_STATE.COUNTDOWN) return;

        // Bloquear input inmediato
        this.setState(GAME_STATE.LOCKED);
        this.ui.stopTimer(); // Detener el reloj visual

        // Lógica visual del botón seleccionado
        this.playerStats[index]++;
        AudioManager.playSFX(this, [ASSET_KEYS.AUDIO.SFX_ROCK, ASSET_KEYS.AUDIO.SFX_PAPER, ASSET_KEYS.AUDIO.SFX_SCISSORS][index]);
        if (navigator.vibrate) navigator.vibrate(20);

        // Feedback visual en el botón
        const btn = this.p1Buttons[index];
        if (btn) {
            this.tweens.add({ targets: btn, scale: 0.9, duration: CONFIG.TIMING.BUTTON_BOUNCE, yoyo: true });
            const bg = btn.list[0];
            const txt = btn.list[3];
            if (bg) bg.setFillStyle(0xFFFFFF); 
            if (txt) txt.setFill('#000000'); 
        }

        // Pequeño delay dramático antes de resolver
        this.time.delayedCall(800, () => this.resolveRound(index));
    }

    resolveRound(playerChoice) {
        // Aseguramos estado bloqueado (por si viene del timer)
        this.setState(GAME_STATE.LOCKED);
        this.ui.stopTimer();
        
        const cpuChoice = this.cpuChoiceThisRound; // Usar la elección de la IA ya almacenada
        
        // Animación "Rock, Paper, Scissors... Shoot!"
        this.ui.animateResolutionShake(this.isPlayerRight, () => {
            this.showResults(playerChoice, cpuChoice);
        });
    }

    showResults(p1, p2) {
        this.setState(GAME_STATE.RESULT);

        const outcome = CombatManager.getRoundResult(p1, p2);

        this.p1Health += outcome.playerHealthChange;
        this.p2Health += outcome.cpuHealthChange;

        // Ejecutar efectos
        AudioManager.playSFX(this, outcome.sound);
        this.ui.playImpactEffect(outcome.color, outcome.result === 'WIN' ? 1.0 : 0.8);

        // Actualizar UI
        this.ui.showRoundResult(p1, p2, outcome.result, this.p1Health, this.p2Health, outcome.text, outcome.color, () => {
            // --- EFECTO DE VIBRACIÓN CONTINUA PARA NIVEL 3 DESPUÉS DE LA PRIMERA RONDA ---
            if (outcome.result === 'WIN' && CampaignManager.isActive() && CampaignManager.state.currentLevel === 3 && CampaignManager.state.winsInRow === 1) {

                this.startContinuousShake();
            }
            
            // Decidir siguiente paso (Fatality o Nueva Ronda)
            if (this.p2Health <= 0) {
                this.time.delayedCall(500, () => this.triggerFatality(p1, this.p2Emoji, this.p1Emoji, true));
            }
            else if (this.p1Health <= 0) {
                this.time.delayedCall(500, () => this.triggerFatality(p2, this.p1Emoji, this.p2Emoji, false));
            }
            else {
                // Esperar un poco y mostrar botón NEXT
                this.nextRoundTimer = this.time.delayedCall(800, () => {
                    this.setState(GAME_STATE.IDLE); // Volvemos a IDLE
                    this.nextRondaBtn = this.ui.createNextRondaBtn("NEXT", this.barY);
                    this.setupNextRoundBtnListeners();
                });
            }
        });
    }

    triggerFatality(choiceIndex, target, attacker, isPlayerWin) {
        this.setState(GAME_STATE.FATALITY);
        
        // Ocultar HUD para el fatality
        this.tweens.add({ targets: [this.p1Status, this.p2Status, this.ui.elements.p1Hearts, this.ui.elements.p2Hearts, this.timeText1, this.timeText2], alpha: 0, duration: 200 });
        
        this.fatalityManager.play(choiceIndex, target, attacker, isPlayerWin, (winState) => this.finishGame(winState));
    }

    async finishGame(isPlayerWin) {
        this.setState(GAME_STATE.GAME_OVER);
        this.stopContinuousShake(); // Asegurarse de detener la vibración al finalizar el juego

        let campaignStatus = null;

        // --- LÓGICA DE CAMPAÑA ---
        if (CampaignManager.isActive()) {
            if (isPlayerWin) {
                const result = CampaignManager.registerWin();
                campaignStatus = result.status;
            } else {
                const lossResult = CampaignManager.registerLoss();
            campaignStatus = lossResult ? lossResult.status : null;
            }
        }

        // --- LÓGICA ESTÁNDAR (Racha) ---
        const winnerName = isPlayerWin ? this.playerName : this.cpuName;
        let streakData = { streak: 0, isNewRecord: false };

        if (!CampaignManager.isActive()) { // Solo contar racha en Quick Play
            if (isPlayerWin) {
                streakData = await DataManager.registerQuickPlayWin();
            } else {
                await DataManager.registerQuickPlayLoss();
            }
        }
        
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: CONFIG.TIMING.FADE_DURATION,
            onComplete: () => {
                if (campaignStatus === 'CAMPAIGN_COMPLETE') {
                    this.scene.start('EpilogueScene');
                } else if (campaignStatus === 'CONTINUE_LEVEL') {
                    this.scene.restart(); 
                } else {
                    this.scene.start('GameOverScene', { 
                        winner: winnerName, 
                        streak: streakData.streak,
                        isNewRecord: streakData.isNewRecord,
                        campaignStatus: campaignStatus,
                        isCampaign: CampaignManager.isActive()
                    });
                }
            }
        });
    }

    // --- UI HELPERS & INPUTS ---

    createResponsiveButtons(width, height, footerTop) {
        this.p1Buttons = []; this.p2Buttons = [];
        const choices = ['ROCK', 'PAPER', 'SCISSORS'];
        const emojis = ['✊', '✋', '✌️'];
        
        const startY = footerTop || LAYOUT.getGridBottom(height);
        
        const p1X = LAYOUT.getColumnX(width, this.isPlayerRight);
        const p2X = LAYOUT.getColumnX(width, !this.isPlayerRight);
        
        choices.forEach((name, i) => {
            const yPos = startY + LAYOUT.BUTTONS.START_OFFSET + (i * LAYOUT.BUTTONS.SPACING);
            this.p1Buttons[i] = this.makeSingleBtn(p1X, yPos, name, emojis[i], true, i);
            this.p2Buttons[i] = this.makeSingleBtn(p2X, yPos, name, emojis[i], false, i);
        });
    }

    makeSingleBtn(x, y, name, emoji, isP1, index) {
        let container = this.add.container(x, y).setDepth(500); 
        const borderColor = CONFIG.THEME.primary;
        const bg = this.add.circle(0, 0, 38, 0x000000, 0.1).setStrokeStyle(CONFIG.UI.BORDER_WIDTH, borderColor);
        
        const emo = this.add.text(0, 0, emoji, { fontSize: CONFIG.FONTS.SIZES.EMOJI, padding: { x: 10, y: 10 } }).setOrigin(0.5);
        const filter = this.add.circle(0, 0, 38, 0x000000, 0.4);
        const txt = this.add.text(0, 50, name, { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.SMALL, fill: CONFIG.THEME.primaryStr }).setOrigin(0.5);
        
        container.add([bg, emo, filter, txt]);
        
        if (isP1) {
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
                this.handleInput(index);
            });
        }
        return container;
    }

    setupNextRoundBtnListeners() {
        if (!this.nextRondaBtn) return;
        this.nextRondaBtn.on('pointerdown', () => { 
            AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_BUTTON);
            this.nextRondaBtn.setScale(0.9); 
            if (navigator.vibrate) navigator.vibrate(20); 
        });
        
        this.nextRondaBtn.on('pointerup', () => { 
            // Solo actuar si estamos en IDLE (prevención de doble click)
            if (this.currentState === GAME_STATE.IDLE) {
                this.startRound(); 
            }
        });
    }

    switchSides() {
        // Solo permitir cambio de lado si no estamos jugando activamente
        if (this.currentState !== GAME_STATE.IDLE) return;
        
        this.isPlayerRight = !this.isPlayerRight;
        DataManager.setIsPlayerRight(this.isPlayerRight); 
        this.ui.drawGrid();

        const { width, height } = this.scale; 
        this.ui.updateMainMargins(width, height);
        
        const CENTER_X = width * LAYOUT.COLUMNS.CENTER;
        const p1X = LAYOUT.getColumnX(width, this.isPlayerRight);
        const p2X = LAYOUT.getColumnX(width, !this.isPlayerRight);
        
        const p1TargetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2TargetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        // Animación de cambio (UI Moves)
        this.tweens.add({ targets: [this.ui.elements.p1Profile, this.ui.elements.p1Avatar, this.ui.elements.p1Hearts, this.ui.elements.p1Emoji, this.ui.elements.p1X], x: p1TargetX, duration: 400, ease: 'Power2' });
        
        let indicatorBtnRef; // Referencia al botón (mute o config)
        // Si la máquina está a la derecha (!this.isPlayerRight), el indicador va encima del muteBtn
        if (!this.isPlayerRight) {
            indicatorBtnRef = this.ui.elements.muteBtn;
        } else { // La máquina está a la izquierda (this.isPlayerRight), el indicador va encima del configBtn
            indicatorBtnRef = this.ui.elements.configBtn;
        }
        // Posicionar encima del centro del botón, con offset vertical para que esté "arriba"
        const aiIndicatorTargetX = indicatorBtnRef.getBounds().centerX;
        const aiIndicatorTargetY = indicatorBtnRef.getBounds().top - 10; // 10px por encima del borde superior real del botón
        
        this.tweens.add({ targets: [this.ui.elements.p2Profile, this.ui.elements.p2Avatar, this.ui.elements.p2Hearts, this.ui.elements.p2Emoji, this.ui.elements.p2X], x: p2TargetX, duration: 400, ease: 'Power2' });
        this.tweens.add({ targets: this.ui.elements.aiIndicator, x: aiIndicatorTargetX, y: aiIndicatorTargetY, duration: 400, ease: 'Power2' }); // Mover también en Y

        this.p1Emoji.setFlipX(!this.isPlayerRight);
        this.p2Emoji.setFlipX(this.isPlayerRight);
        
        // Mover botones y textos
        this.p1Buttons.forEach(btn => { if (btn) this.tweens.add({ targets: btn, x: p1X, duration: 400, ease: 'Back.easeOut' }); });
        this.p2Buttons.forEach(btn => { if (btn) this.tweens.add({ targets: btn, x: p2X, duration: 400, ease: 'Back.easeOut' }); });
        this.tweens.add({ targets: this.timeText1, x: LAYOUT.getColumnX(width, true), duration: 400, ease: 'Power2' });
        this.tweens.add({ targets: this.timeText2, x: LAYOUT.getColumnX(width, false), duration: 400, ease: 'Power2' });

        this.ui.updateBarPositions(this.isPlayerRight, width);
    }

    resetButtonColors() {
        const textMain = CONFIG.THEME.primaryStr;
        [this.p1Buttons, this.p2Buttons].forEach(group => {
            if (group) {
                group.forEach(btn => {
                    if (btn) {
                        const bg = btn.list[0];
                        const txt = btn.list[3];
                        if (bg) bg.setFillStyle(0x000000, 0.1);
                        if (txt) txt.setFill(textMain);
                    }
                });
            }
        });
    }

    // --- UTILIDADES ---

    getCpuChoice() { return OpponentAI.getChoice(this.difficulty, this.playerStats); }

    getDialoguePhrase(speaker, type) {
        if (speaker === 'CPU') {
            // Usar el oponente actualmente cargado en la escena
            const enemy = this.currentOpponent; 
            const typeKey = type.toLowerCase();
            if (enemy.dialogues && enemy.dialogues[typeKey]) {
                return enemy.dialogues[typeKey];
            }
        }
        
        if (!this.dialogueDecks[speaker][type] || this.dialogueDecks[speaker][type].length === 0) {
            this.dialogueDecks[speaker][type] = Phaser.Utils.Array.Shuffle([...DIALOGUES[speaker][type]]);
        }
        return this.dialogueDecks[speaker][type].pop();
    }

    showDialogue(isP1, type) {
        const speakerKey = isP1 ? 'P1' : 'CPU';
        const text = this.getDialoguePhrase(speakerKey, type);
        
        const { width, height } = this.scale;
        const CENTER_X = width / 2;
        let targetX = isP1 ? (this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5) : (this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5);
        const targetY = LAYOUT.getAvatarY(height) + 140;

        const color = isP1 ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;
        
        const bubble = new DialogueBox(this, targetX, targetY, text, color);
        if (!this.activeBubbles) this.activeBubbles = [];
        this.activeBubbles.push(bubble);
    }

    applyTheme() {
        const theme = CONFIG.THEME; 
        const bgDim = DataManager.isBgDim();
        const bgScene = this.scene.get('BackgroundScene');
        if (bgScene && bgScene.applyDim) {
            bgScene.applyDim(bgDim);
        }
        
        this.ui.applyTheme();
        
        this.p1Buttons.forEach(btn => {
            if (btn) {
                const bg = btn.list[0]; // Assuming the background is the first element in the container
                if (bg) bg.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, theme.PRIMARY);
            }
        });
        this.p2Buttons.forEach(btn => {
            if (btn) {
                const bg = btn.list[0]; // Assuming the background is the first element in the container
                if (bg) bg.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, theme.SECONDARY);
            }
        });
        
        this.updateMuteIcon();
    }

    updateMuteIcon() {
        if (this.ui.elements.muteBtn) {
            this.ui.elements.muteBtn.setText(this.sound.mute ? '🔇' : '🔊');
        }
    }

    pauseGame() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.sound.pauseAll();
        if (this.currentState === GAME_STATE.COUNTDOWN || this.currentState === GAME_STATE.LOCKED) {
            this.tweens.pauseAll();
            // Nota: El timer de CombatUI también usa tweens, así que se pausará
        }
        
        const { width, height } = this.scale;
        this.pauseOverlay = this.add.container(0, 0).setDepth(4000);
        const bg = this.add.rectangle(0, 0, width, height, CONFIG.COLORS.BG_DARK, 0.7).setOrigin(0).setInteractive();
        const txt = this.add.text(width/2, height/2, "PAUSED", { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.TITLE, fill: CONFIG.COLORS.TEXT_MAIN }).setOrigin(0.5);
        const subTxt = this.add.text(width/2, height/2 + 60, "TAP TO RESUME", { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.NORMAL, fill: CONFIG.COLORS.P1_BLUE }).setOrigin(0.5);
        this.pauseOverlay.add([bg, txt, subTxt]);
        
        bg.on('pointerdown', () => this.resumeGame());
    }

    resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.sound.resumeAll();
        if (this.currentState === GAME_STATE.COUNTDOWN || this.currentState === GAME_STATE.LOCKED) {
            this.tweens.resumeAll();
        }
        if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    }


}