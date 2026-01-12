import { CONFIG } from '../data/config.js';
import { AudioManager } from '../managers/AudioManager.js';
import { RetroButton } from '../ui/components/RetroButton.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        // data trae: { winner, streak, isNewRecord }
        const winner = data.winner || 'ZORG';
        const streak = data.streak || 0;
        const isNewRecord = data.isNewRecord || false;

        const { width, height } = this.scale;

        // Si gana ZORG, usamos rojo amenazador, si no, el color del tema
        const isZorgWinner = winner === 'ZORG';
        const winnerColor = isZorgWinner ? '#ff0000' : CONFIG.THEME.primaryStr;

        this.add.text(width / 2, height * 0.25, isZorgWinner ? "YOU WERE DEFEATED BY:" : "WINNER:", {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '18px', fill: winnerColor, align: 'center'
        }).setOrigin(0.5);

        // Nombre del Ganador
        let fontSize = winner.length > 10 ? CONFIG.FONTS.SIZES.LARGE : CONFIG.FONTS.SIZES.TITLE;
        const winText = this.add.text(width / 2, height * 0.35, winner, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: fontSize, fill: winnerColor, align: 'center', wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5);

        this.tweens.add({ 
            targets: winText, 
            scale: isZorgWinner ? 1.25 : 1.1, 
            duration: isZorgWinner ? 300 : 500, 
            yoyo: true, 
            repeat: -1 
        });

        // --- MOSTRAR RACHA ---
        if (streak > 0 || isNewRecord) {
            const streakY = height * 0.5;
            
            if (isNewRecord) {
                // Si es récord, mostrar texto blanco brillante
                const recText = this.add.text(width / 2, streakY, "NEW RECORD!", {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: '22px', fill: CONFIG.THEME.accentStr
                }).setOrigin(0.5);
                
                this.tweens.add({ targets: recText, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
                
                // Texto de cantidad abajo
                this.add.text(width / 2, streakY + 40, `${streak} WINS IN A ROW`, {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.NORMAL, fill: CONFIG.THEME.primaryStr
                }).setOrigin(0.5);

            } else {
                // Racha normal
                this.add.text(width / 2, streakY, `CURRENT STREAK: ${streak}`, {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: '16px', fill: CONFIG.THEME.secondaryStr
                }).setOrigin(0.5);
            }
        }

        // Botones Estilizados (Usando Componente Reutilizable)
        new RetroButton(this, width / 2, height * 0.7, "RESTART", CONFIG.THEME.primary, () => {
            this.scene.start('GameScene');
        });

        new RetroButton(this, width / 2, height * 0.82, "MAIN MENU", CONFIG.THEME.secondary, () => {
            this.scene.start('MainMenuScene');
        });

        // Efecto de entrada suave
        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
    }
}   ``
