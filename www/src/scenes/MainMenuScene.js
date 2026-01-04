import { Storage } from '../Storage.js';
import { CONFIG } from '../config.js';
import { AudioManager } from '../managers/AudioManager.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    async create() {
        // Asegurar que el fondo espacial esté detrás
        if (this.scene.get('BackgroundScene')) {
            this.scene.sendToBack('BackgroundScene');
        }
        
        // --- MUSICA DE FONDO GLOBAL ---
        AudioManager.playMusic(this, 'bgm');

        const { width, height } = this.scale;
        
        // Cargamos datos asíncronamente
        const playerName = await Storage.get('playerName', 'PLAYER 1');
        const bestStreak = await Storage.get('streak_best', 0);

        // Título pequeño arriba
        this.playerText = this.add.text(width / 2, height * 0.15, `HELLO, ${playerName}`, {
            fontFamily: CONFIG.FONTS.MAIN,
            fontSize: CONFIG.FONTS.SIZES.LARGE,
            fill: '#aaaaaa', // Mantenemos gris suave específico o podríamos usar MUTED
            align: 'center',
            wordWrap: { width: width * 0.9 } 
        }).setOrigin(0.5);

        // --- BOTONES ---
        // 1. INICIAR JUEGO
        const startBtn = this.createButton(width / 2, height * 0.45, "START GAME", CONFIG.COLORS.P1_BLUE, () => {
            // Transición suave
            this.tweens.add({
                targets: this.cameras.main,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    this.scene.start('GameScene');
                }
            });
        });

        // 2. OPCIONES
        const optBtn = this.createButton(width / 2, height * 0.6, "OPTIONS", 0x555555, () => {
            this.scene.launch('SettingsScene'); 
        });

        // Escuchar cuando se cierran las opciones
        this.scene.get('SettingsScene').events.on('settings-closed', async () => {
            // Refrescar el nombre por si cambió en Settings
            const newName = await Storage.get('playerName', 'PLAYER 1');
            this.playerText.setText(`HELLO, ${newName}`);
        });

        // --- MOSTRAR MEJOR RACHA ---
        this.recordText = this.add.text(0, 0, `RECORD: ${bestStreak} WINS`, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '16px', fill: '#' + CONFIG.COLORS.GOLD.toString(16)
        }).setOrigin(0.5);

        const recordContainer = this.add.container(width / 2, height * 0.85);
        const recordBg = this.add.graphics();
        recordBg.fillStyle(CONFIG.COLORS.BG_DARK, 1);
        recordBg.fillRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
        recordBg.lineStyle(2, CONFIG.COLORS.GOLD);
        recordBg.strokeRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
        
        recordContainer.add([recordBg, this.recordText]);

        // --- VERSIÓN ---
        this.add.text(width - 20, height - 20, "v1.0", {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.SMALL, fill: '#555555'
        }).setOrigin(1, 1);

        // Efecto de entrada suave
        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
    }

    createButton(x, y, text, color, callback) {
        const container = this.add.container(x, y);
        
        // Usamos Graphics para bordes redondeados
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-180, -40, 360, 80, CONFIG.UI.BUTTON_RADIUS); 
        bg.lineStyle(4, 0xffffff);
        bg.strokeRoundedRect(-180, -40, 360, 80, CONFIG.UI.BUTTON_RADIUS);
        
        // Área interactiva
        bg.setInteractive(new Phaser.Geom.Rectangle(-180, -40, 360, 80), Phaser.Geom.Rectangle.Contains);
        
        // --- EFECTO DE HALO EXTERNO (GLOW) ---
        const glowBg = this.add.graphics();
        glowBg.fillStyle(0xffffff, 0.4); 
        glowBg.fillRoundedRect(-190, -50, 380, 100, 20); 
        glowBg.alpha = 0; 

        this.tweens.add({
            targets: glowBg,
            alpha: 0.8, 
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const txt = this.add.text(0, 0, text, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.LARGE
        }).setOrigin(0.5);

        container.add([glowBg, bg, txt]);

        bg.on('pointerdown', () => {
            this.tweens.add({ targets: container, scale: 0.95, duration: CONFIG.TIMING.BUTTON_BOUNCE, yoyo: true });
            AudioManager.playSFX(this, 'sfx_button');
            if (navigator.vibrate) navigator.vibrate(50);
            this.time.delayedCall(150, callback);
        });

        return container;
    }
}