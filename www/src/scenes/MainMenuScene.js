import { Storage } from '../Storage.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    async create() {
        // Asegurar que el fondo espacial esté detrás
        if (this.scene.get('BackgroundScene')) {
            this.scene.sendToBack('BackgroundScene');
        }

        const { width, height } = this.scale;
        
        // Cargamos datos asíncronamente
        const playerName = await Storage.get('playerName', 'JUGADOR 1');
        const bestStreak = await Storage.get('streak_best', 0);

        // Fondo (Transparente)
        // this.cameras.main.setBackgroundColor('#1a1a1a');

        // Título pequeño arriba
        this.playerText = this.add.text(width / 2, height * 0.15, `HOLA, ${playerName}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // --- BOTONES ---
        // 1. INICIAR JUEGO
        const startBtn = this.createButton(width / 2, height * 0.45, "INICIAR JUEGO", 0x00A8F3, () => {
            // Transición suave transparente (Alpha)
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
        const optBtn = this.createButton(width / 2, height * 0.6, "OPCIONES", 0x555555, () => {
            this.scene.launch('SettingsScene'); 
        });

        // Escuchar cuando se cierran las opciones
        this.scene.get('SettingsScene').events.on('settings-closed', async () => {
            // Refrescar el nombre por si cambió en Settings
            const newName = await Storage.get('playerName', 'JUGADOR 1');
            this.playerText.setText(`HOLA, ${newName}`);
        });

        // --- MOSTRAR MEJOR RACHA (NUEVO) ---
        this.recordText = this.add.text(0, 0, `RECORD: ${bestStreak} WINS`, {
            fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#ffd700'
        }).setOrigin(0.5);

        this.add.container(width / 2, height * 0.85).add([
            this.add.rectangle(0, 0, 300, 50, 0x000000).setStrokeStyle(2, 0xffd700),
            this.recordText
        ]);

        // Efecto de entrada suave (Transparente)
        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 500 });
    }

    createButton(x, y, text, color, callback) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 360, 80, color).setStrokeStyle(4, 0xffffff).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, text, {
            fontFamily: '"Press Start 2P"', fontSize: '20px'
        }).setOrigin(0.5);

        container.add([bg, txt]);

        bg.on('pointerdown', () => {
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 200 });
            this.tweens.add({ targets: container, scale: 0.95, duration: 50, yoyo: true });
            if (navigator.vibrate) navigator.vibrate(50);
            this.time.delayedCall(150, callback);
        });

        return container;
    }
}