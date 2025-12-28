export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        // data trae: { winner, streak, isNewRecord }
        const winner = data.winner || 'NADIE';
        const streak = data.streak || 0;
        const isNewRecord = data.isNewRecord || false;

        const { width, height } = this.scale;

        // Fondo (Transparente)
        // this.cameras.main.setBackgroundColor('#000000');

        const color = winner === 'CPU' ? '#F34235' : '#00A8F3';

        this.add.text(width / 2, height * 0.25, "EL GANADOR ES:", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        // Nombre del Ganador
        let fontSize = winner.length > 10 ? '24px' : '40px';
        const winText = this.add.text(width / 2, height * 0.35, winner, {
            fontFamily: '"Press Start 2P"', fontSize: fontSize, fill: color, align: 'center', wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5);

        this.tweens.add({ targets: winText, scale: 1.2, duration: 500, yoyo: true, repeat: -1 });

        // --- MOSTRAR RACHA ---
        if (streak > 0 || isNewRecord) {
            const streakY = height * 0.5;
            
            if (isNewRecord) {
                // Si es récord, mostrar texto dorado parpadeante
                const recText = this.add.text(width / 2, streakY, "¡NUEVO RECORD!", {
                    fontFamily: '"Press Start 2P"', fontSize: '22px', fill: '#FFD700'
                }).setOrigin(0.5);
                
                this.tweens.add({ targets: recText, alpha: 0, duration: 300, yoyo: true, repeat: -1 });
                
                // Texto de cantidad abajo
                this.add.text(width / 2, streakY + 40, `${streak} VICTORIAS SEGUIDAS`, {
                    fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#ffffff'
                }).setOrigin(0.5);

            } else {
                // Racha normal
                this.add.text(width / 2, streakY, `RACHA ACTUAL: ${streak}`, {
                    fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#aaaaaa'
                }).setOrigin(0.5);
            }
        }

        // Botón Reiniciar
        const restartBtn = this.add.container(width / 2, height * 0.7);
        const rBg = this.add.rectangle(0, 0, 300, 70, 0xffffff).setInteractive({ useHandCursor: true });
        const rTxt = this.add.text(0, 0, "REINICIAR", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#000000'
        }).setOrigin(0.5);
        restartBtn.add([rBg, rTxt]);

                rBg.on('pointerdown', () => {

                    if (navigator.vibrate) navigator.vibrate(50);

                    this.tweens.add({

                        targets: this.cameras.main,

                        alpha: 0,

                        duration: 300,

                        onComplete: () => {

                            this.scene.start('GameScene');

                        }

                    });

                });

                

                // Botón Menú

                const menuBtn = this.add.text(width / 2, height * 0.85, "IR AL MENU", {

                     fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#888888'

                }).setOrigin(0.5).setInteractive({ useHandCursor: true });

                

                menuBtn.on('pointerdown', () => {

                    this.tweens.add({

                        targets: this.cameras.main,

                        alpha: 0,

                        duration: 300,

                        onComplete: () => {

                            this.scene.start('MainMenuScene');

                        }

                    });

                });

        

                // Efecto de entrada suave

                this.cameras.main.alpha = 0;

                this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 500 });

            }

        }