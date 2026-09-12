import { CONFIG } from '../data/config.js';
import { DataManager } from '../managers/DataManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { RetroButton } from './components/RetroButton.js';
import { LAYOUT } from '../data/Layout.js';
import { CombatParticipants } from './components/CombatParticipants.js';
import { CombatTimer } from './components/CombatTimer.js';

export class CombatUI {
    constructor(scene, enemy) {
        // Add enemy parameter
        this.scene = scene;
        this.enemy = enemy; // Store enemy
        this.elements = {}; // Almacén para referencias de Phaser
        this.participants = new CombatParticipants(scene, enemy, this.elements);
        this.timer = new CombatTimer(scene, this.elements);
    }

    // --- MÁRGENES Y GRILLA ---
    updateMainMargins(width, height) {
        if (!this.elements.mainMargin) {
            this.elements.mainMargin = this.scene.add.graphics().setDepth(1000);
        }
        this.elements.mainMargin.clear();
        const BORDER_W = 10;
        const borderColor = CONFIG.THEME.primary;
        this.elements.mainMargin.lineStyle(BORDER_W, borderColor, 1);
        this.elements.mainMargin.beginPath();
        this.elements.mainMargin.strokeRect(
            BORDER_W / 2,
            BORDER_W / 2,
            width - BORDER_W,
            height - BORDER_W
        );
        this.elements.mainMargin.strokePath();
    }

    drawGrid() {
        if (!this.elements.gridGraphics) {
            this.elements.gridGraphics = this.scene.add.graphics().setDepth(900);
        }
        this.elements.gridGraphics.clear();
        const { width, height } = this.scene.scale;
        const CENTER_X = width / 2;
        const gridColor = CONFIG.THEME.primary;

        // 1. Línea Vertical Central
        this.elements.gridGraphics.lineStyle(4, 0xffffff, 0.3);
        this.elements.gridGraphics.beginPath();
        this.elements.gridGraphics.lineBetween(CENTER_X, 0, CENTER_X, height);
        this.elements.gridGraphics.strokePath();

        // 2. Líneas Horizontales
        this.elements.gridGraphics.lineStyle(4, gridColor, 1);
        const topY = LAYOUT.getGridTop(height);
        this.elements.gridGraphics.beginPath();
        this.elements.gridGraphics.lineBetween(0, topY, width, topY);
        const bottomY = LAYOUT.getGridBottom(height);
        this.elements.gridGraphics.lineBetween(0, bottomY, width, bottomY);
        this.elements.gridGraphics.strokePath();
    }

    // --- HUD (CARTAS DE PERFIL Y CORAZONES) ---
    initHUD(p1X, p2X, baseY, heartsY) {
        this.participants.initHUD(p1X, p2X, baseY, heartsY);
    }

    updateHeartsUI(container, lives) {
        this.participants.updateHearts(container, lives);
    }

    // --- AVATARES ---
    initAvatars(p1X, p2X, y) {
        this.participants.initAvatars(p1X, p2X, y);
    }

    // --- BARRAS DE TIEMPO ---
    initTimerBars(width, barY) {
        this.timer.init(width, barY);
    }

    updateBarPositions(isPlayerRight, width) {
        this.timer.updatePositions(isPlayerRight, width);
    }

    // --- CONTROLES (BOTONES DE ABAJO) ---
    initControls(width, height, _safeBottom) {
        // const SAFE_BOTTOM = Math.max(safeBottom, 20); // Removed as unused
        const BTN_Y = height - LAYOUT.CONTROLS.BTN_Y_OFFSET;

        // Config
        this.elements.configBtn = this.scene.add
            .text(45, BTN_Y, '⚙️', { fontSize: '32px', padding: { x: 10, y: 10 } })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(5000);

        this.elements.configBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            AudioManager.playSFX(this.scene, 'sfx_button');
            this.scene.tweens.add({
                targets: this.elements.configBtn,
                scale: 1.2,
                duration: 100,
                yoyo: true,
            });
            this.scene.scene.launch('SettingsScene');
            this.scene.scene.get('SettingsScene').events.once('settings-closed', () => {
                this.scene.applyTheme();
            });
        });

        // Mute
        this.elements.muteBtn = this.scene.add
            .text(width - 45, BTN_Y, this.scene.sound.mute ? '🔇' : '🔊', {
                fontFamily: 'Arial, "Segoe UI Emoji", "Apple Color Emoji"',
                fontSize: '32px',
                padding: { x: 10, y: 10 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(5000);

        this.elements.muteBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            const nextState = !this.scene.sound.mute;
            this.scene.sound.mute = nextState;
            this.elements.muteBtn.setText(nextState ? '🔇' : '🔊');
            this.scene.tweens.add({
                targets: this.elements.muteBtn,
                scale: 1.4,
                duration: 100,
                yoyo: true,
            });
            DataManager.setIsMuted(nextState);
        });

        // Indicador de la IA (posición inicial arbitraria, GameScene lo posicionará)
        this.elements.aiIndicator = this.scene.add
            .circle(0, 0, 10, CONFIG.COLORS.AI_THINKING_RED)
            .setDepth(5000)
            .setOrigin(0.5);

        // Switch
        this.elements.switchBtn = this.scene.add
            .text(width / 2, height - LAYOUT.CONTROLS.SWITCH_Y_OFFSET, '⇄', {
                fontFamily: 'Arial, "Segoe UI Emoji", "Apple Color Emoji"',
                fontSize: '40px',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(5000);

        this.elements.switchBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            if (this.scene.isPlayingRound || this.scene.isSwitchingSide) return;
            AudioManager.playSFX(this.scene, 'sfx_button');
            this.scene.switchSides();
            this.scene.tweens.add({
                targets: this.elements.switchBtn,
                scale: 1.2,
                duration: 100,
                yoyo: true,
            });
        });

        this.elements.switchBtn.on('pointerover', () => {
            this.scene.tweens.add({ targets: this.elements.switchBtn, scale: 1.1, duration: 200 });
        });

        this.elements.switchBtn.on('pointerout', () => {
            this.scene.tweens.add({ targets: this.elements.switchBtn, scale: 1.0, duration: 200 });
        });

        // Quit (Reducido a escala 0.65 para que no choque)
        this.elements.quitBtn = this.createQuitButton(width / 2, BTN_Y);
        this.elements.quitBtn.setScale(0.65);
        this.elements.quitBtn.setDepth(5000);
    }

    createQuitButton(x, y) {
        return new RetroButton(this.scene, x, y, 'QUIT GAME', CONFIG.COLORS.CPU_RED, () => {
            this.scene.tweens.add({
                targets: this.scene.cameras.main,
                alpha: 0,
                duration: 300,
                onComplete: () => this.scene.scene.start('MainMenuScene'),
            });
        });
    }

    // --- ELEMENTOS DE RONDA (EMOJIS) ---
    initRoundElements(p1X, p2X, emojiY) {
        const style = { fontSize: '100px', padding: { x: 20, y: 20 } };
        this.elements.p1Emoji = this.scene.add
            .text(p1X, emojiY, '✊', style)
            .setOrigin(0.5)
            .setScale(0);
        this.elements.p2Emoji = this.scene.add
            .text(p2X, emojiY, '✊', style)
            .setOrigin(0.5)
            .setScale(0);
        this.elements.p1X = this.scene.add
            .text(p1X, emojiY, '❌', style)
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(10);
        this.elements.p2X = this.scene.add
            .text(p2X, emojiY, '❌', style)
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(10);
    }

    createNextRondaBtn(label, barY) {
        const { width } = this.scene.scale;
        const container = this.scene.add.container(width / 2, barY - 40).setDepth(2000);
        const circle = this.scene.add
            .circle(0, 0, 75, CONFIG.THEME.secondary)
            .setStrokeStyle(4, CONFIG.THEME.primary);
        const text = this.scene.add
            .text(0, 0, label, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: label.length > 5 ? '18px' : '24px',
                fill: '#ffffff',
            })
            .setOrigin(0.5);

        container.add([circle, text]).setScale(0);
        container.setInteractive(new Phaser.Geom.Circle(0, 0, 75), Phaser.Geom.Circle.Contains);
        this.scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut',
        });

        return container;
    }

    applyTheme() {
        const theme = CONFIG.THEME;
        const els = this.elements;
        const { width, height } = this.scene.scale;

        [els.p1NameTxt, els.p2NameTxt, els.timeText1, els.timeText2, els.configBtn].forEach(
            (el) => {
                if (el) el.setFill(theme.PRIMARY_STR);
            }
        );

        this.drawGrid();
        this.updateMainMargins(width, height);
    }

    // --- ANIMACIONES Y LÓGICA VISUAL ---

    animateRoundStart(isPlayerRight, duration, onComplete) {
        const { width } = this.scene.scale;
        const CENTER_X = width / 2;
        const p1TargetX = isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2TargetX = isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        // Reset Emojis
        this.elements.p1Emoji.setText('✊').setScale(1).setAlpha(1).setOrigin(0.5);
        this.elements.p2Emoji.setText('✊').setScale(1).setAlpha(1).setOrigin(0.5);
        this.elements.p1Emoji.setAngle(isPlayerRight ? -90 : 90).setFlipX(!isPlayerRight);
        this.elements.p2Emoji.setAngle(isPlayerRight ? 90 : -90).setFlipX(isPlayerRight);

        // Posición inicial fuera de pantalla
        this.elements.p1Emoji.x = p1TargetX < CENTER_X ? -200 : width + 200;
        this.elements.p2Emoji.x = p2TargetX < CENTER_X ? -200 : width + 200;

        // Animar entrada
        this.scene.tweens.add({
            targets: [this.elements.p1Emoji, this.elements.p2Emoji],
            x: (target) => (target === this.elements.p1Emoji ? p1TargetX : p2TargetX),
            duration: 500,
            ease: 'Back.easeOut',
            onStart: () =>
                AudioManager.playSFX(this.scene, 'sfx_reveal', {
                    volume: 0.3 * AudioManager.volumes.sfx,
                }),
        });

        // Barras de tiempo
        [this.elements.timeBar1, this.elements.timeBar2].forEach((bar) => {
            bar.setVisible(true).setFillStyle(CONFIG.THEME.primary).width = width * 0.4;
            bar.alpha = 0;
            bar.scaleX = 1;
        });
        this.elements.timeText1.alpha = 0;
        this.elements.timeText2.alpha = 0;

        this.scene.tweens.add({
            targets: [
                this.elements.timeBar1,
                this.elements.timeBar2,
                this.elements.timeText1,
                this.elements.timeText2,
            ],
            alpha: 1,
            duration: 300,
            onComplete: onComplete,
        });
    }

    runTimer(duration, onTimeout) {
        this.timer.start(duration, onTimeout);
    }

    stopTimer() {
        this.timer.stop();
    }

    animateResolutionShake(isPlayerRight, onComplete) {
        const p1StartAngle = isPlayerRight ? -90 : 90;
        const p2StartAngle = isPlayerRight ? 90 : -90;

        const p1Emoji = this.elements.p1Emoji;
        const p2Emoji = this.elements.p2Emoji;

        p1Emoji.setAngle(p1StartAngle).setOrigin(0.5, 1);

        p2Emoji.setAngle(p2StartAngle).setOrigin(0.5, 1);

        const { width } = this.scene.scale;
        const CENTER_X = width / 2;
        const p1FixedX = isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2FixedX = isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        p1Emoji.x = p1FixedX;
        p2Emoji.x = p2FixedX;

        const offset = 60;
        p1Emoji.x += p1StartAngle > 0 ? -offset : offset;
        p2Emoji.x += p2StartAngle > 0 ? -offset : offset;

        this.scene.tweens.add({
            targets: p1Emoji,
            angle: p1Emoji.flipX ? p1StartAngle - 90 : p1StartAngle + 90, // Ajuste de rotación para flipX
            duration: 150,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                p1Emoji.setAngle(p1StartAngle).setOrigin(0.5);
                p1Emoji.x = p1FixedX;
            },
        });

        this.scene.tweens.add({
            targets: p2Emoji,
            angle: p2Emoji.flipX ? p2StartAngle - 90 : p2StartAngle + 90, // Usando la misma lógica condicional que p1Emoji
            duration: 150,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                p2Emoji.setAngle(p2StartAngle).setOrigin(0.5);
                p2Emoji.x = p2FixedX;
                if (onComplete) onComplete();
            },
        });
    }

    showRoundResult(
        p1Choice,
        p2Choice,
        p1Result,
        p1Health,
        p2Health,
        resultText,
        color,
        onComplete
    ) {
        const icons = ['✊', '✋', '✌️'];
        if (this.elements.p1Emoji)
            this.elements.p1Emoji.setText(p1Choice === -1 ? '❌' : icons[p1Choice]);
        if (this.elements.p2Emoji) this.elements.p2Emoji.setText(icons[p2Choice]);

        this.scene.tweens.add({
            targets: [this.elements.p1Emoji, this.elements.p2Emoji],
            scale: 1.5,
            duration: 100,
            yoyo: true,
            ease: 'Back.easeOut',
        });

        // Actualizar Corazones
        this.updateHeartsUI(this.elements.p1Hearts, p1Health);
        this.updateHeartsUI(this.elements.p2Hearts, p2Health);

        // Texto de Resultado
        this.elements.p1NameTxt.setText(resultText).setFill(color).setScale(0);
        this.scene.tweens.add({
            targets: this.elements.p1NameTxt,
            scale: 1.2,
            duration: 400,
            ease: 'Bounce.easeOut',
        });

        // Animación específica por resultado (WIN/LOSE/DRAW)
        if (p1Result === 'WIN') {
            this.scene.tweens.add({
                targets: this.elements.p2X,
                alpha: 1,
                scale: { from: 2, to: 1 },
                duration: 300,
                ease: 'Bounce.easeOut',
            });
        } else if (p1Result === 'LOSE') {
            this.scene.tweens.add({
                targets: this.elements.p1X,
                alpha: 1,
                scale: { from: 2, to: 1 },
                duration: 300,
                ease: 'Bounce.easeOut',
            });
        } else if (p1Result === 'DRAW') {
            this.elements.p2NameTxt.setText('DRAW!').setFill(color).setScale(0);
            this.scene.tweens.add({
                targets: this.elements.p2NameTxt,
                scale: 1.2,
                duration: 400,
                ease: 'Bounce.easeOut',
            });
        }

        if (onComplete) {
            this.scene.time.delayedCall(1000, onComplete);
        }
    }

    playImpactEffect(color, intensity) {
        this.scene.cameras.main.flash(200 * intensity, 255, 255, 255);
        this.scene.cameras.main.shake(200 * intensity, 0.01 * intensity);
        // Si hay partículas en la escena, las usamos
        if (this.scene.vfx) {
            const midX = (this.elements.p1Emoji.x + this.elements.p2Emoji.x) / 2;
            const midY = (this.elements.p1Emoji.y + this.elements.p2Emoji.y) / 2;
            this.scene.vfx.setPosition(midX, midY);
            this.scene.vfx.forEachAlive((p) => (p.tint = color));
            this.scene.vfx.explode(30 + 20 * intensity);
        }
    }

    hideResultText() {
        // Resetear textos de estado
        if (this.elements.p1NameTxt)
            this.elements.p1NameTxt
                .setText(DataManager.getName())
                .setFill(CONFIG.THEME.primaryStr)
                .setScale(1);
        if (this.elements.p2NameTxt)
            this.elements.p2NameTxt
                .setText(this.enemy.name)
                .setFill(CONFIG.THEME.primaryStr)
                .setScale(1);
        this.elements.p1X.setAlpha(0);
        this.elements.p2X.setAlpha(0);
    }

    // --- INDICADOR DE IA ---
    updateAIIndicator(color) {
        if (this.elements.aiIndicator) {
            this.elements.aiIndicator.setFillStyle(color);
        }
    }

    resetAIIndicator() {
        if (this.elements.aiIndicator) {
            this.elements.aiIndicator.setFillStyle(CONFIG.COLORS.AI_THINKING_RED);
        }
    }
}
