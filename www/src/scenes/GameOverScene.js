import { CONFIG } from '../config.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        // data trae: { winner, streak, isNewRecord }
        const winner = data.winner || 'NO ONE';
        const streak = data.streak || 0;
        const isNewRecord = data.isNewRecord || false;

        const { width, height } = this.scale;

        const winnerColor = winner === 'CPU' ? '#' + CONFIG.COLORS.CPU_RED.toString(16) : '#' + CONFIG.COLORS.P1_BLUE.toString(16);

        this.add.text(width / 2, height * 0.25, "WINNER:", {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '18px', fill: CONFIG.COLORS.TEXT_MAIN, align: 'center'
        }).setOrigin(0.5);

        // Nombre del Ganador
        let fontSize = winner.length > 10 ? CONFIG.FONTS.SIZES.LARGE : CONFIG.FONTS.SIZES.TITLE;
        const winText = this.add.text(width / 2, height * 0.35, winner, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: fontSize, fill: winnerColor, align: 'center', wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: winText, scale: 1.2, duration: 500, yoyo: true, repeat: -1 });

        // --- MOSTRAR RACHA ---
        if (streak > 0 || isNewRecord) {
            const streakY = height * 0.5;
            
            if (isNewRecord) {
                // Si es récord, mostrar texto dorado parpadeante
                const recText = this.add.text(width / 2, streakY, "NEW RECORD!", {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: '22px', fill: '#' + CONFIG.COLORS.GOLD.toString(16)
                }).setOrigin(0.5);
                
                this.tweens.add({ targets: recText, alpha: 0, duration: 300, yoyo: true, repeat: -1 });
                
                // Texto de cantidad abajo
                this.add.text(width / 2, streakY + 40, `${streak} WINS IN A ROW`, {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.NORMAL, fill: CONFIG.COLORS.TEXT_MAIN
                }).setOrigin(0.5);

            } else {
                // Racha normal
                this.add.text(width / 2, streakY, `CURRENT STREAK: ${streak}`, {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: '16px', fill: CONFIG.COLORS.TEXT_MUTED
                }).setOrigin(0.5);
            }
        }

        // Botones Estilizados
        this.createButton(width / 2, height * 0.7, "RESTART", CONFIG.COLORS.SUCCESS, () => {
            this.scene.start('GameScene');
        });

        this.createButton(width / 2, height * 0.82, "MAIN MENU", 0x888888, () => {
            this.scene.start('MainMenuScene');
        });

        // Efecto de entrada suave
        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
    }

    createButton(x, y, label, color, callback) {
        const container = this.add.container(x, y);
        
        // Sombra (Efecto 3D simple)
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.5);
        shadow.fillRoundedRect(-145, -30, 300, 60, CONFIG.UI.BUTTON_RADIUS); 
        
        // Fondo del botón
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-150, -35, 300, 60, CONFIG.UI.BUTTON_RADIUS);
        bg.lineStyle(CONFIG.UI.BORDER_WIDTH, 0xffffff, 1);
        bg.strokeRoundedRect(-150, -35, 300, 60, CONFIG.UI.BUTTON_RADIUS);

        const text = this.add.text(0, -5, label, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '18px', fill: CONFIG.COLORS.TEXT_MAIN
        }).setOrigin(0.5);

        // Área interactiva transparente encima de todo
        const hitArea = this.add.rectangle(0, -5, 300, 60, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        container.add([shadow, bg, text, hitArea]);

        hitArea.on('pointerdown', () => {
            if (navigator.vibrate) navigator.vibrate(20);
            this.tweens.add({
                targets: container,
                scale: 0.95,
                duration: CONFIG.TIMING.BUTTON_BOUNCE,
                yoyo: true,
                onComplete: () => {
                    this.tweens.add({
                        targets: this.cameras.main,
                        alpha: 0,
                        duration: 300,
                        onComplete: callback
                    });
                }
            });
        });

        return container;
    }
}