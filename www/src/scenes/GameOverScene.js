import { CONFIG } from '../data/config.js';
import { AudioManager } from '../managers/AudioManager.js';
import { RetroButton } from '../ui/components/RetroButton.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        // data trae: { winner, streak, isNewRecord, isCampaign, campaignStatus }
        const winner = data.winner || 'ZORG';
        const streak = data.streak || 0;
        const isNewRecord = data.isNewRecord || false;
        const isCampaign = data.isCampaign || false;
        const status = data.campaignStatus || '';

        const { width, height } = this.scale;

        // --- LÓGICA DE TEXTO Y COLOR ---
        let titleText = "WINNER:";
        let mainText = winner;
        let color = CONFIG.THEME.primaryStr;
        let isWin = winner !== 'ZORG' && winner !== 'OUTER RIM' && winner !== 'ASTEROID BELT' && winner !== 'ZORG BASE'; // Detectar si ganó el jugador

        if (isCampaign) {
            if (status === 'LEVEL_UP') {
                titleText = "SECTOR SECURED";
                mainText = "READY FOR WARP";
                color = CONFIG.THEME.primaryStr;
                isWin = true;
            } else if (status === 'CAMPAIGN_COMPLETE') {
                titleText = "MISSION STATUS";
                mainText = "DAUGHTER SAVED!";
                color = 0xFFD700; // Oro
                isWin = true;
            } else { // RETRY_LEVEL
                titleText = "MISSION FAILED";
                mainText = "SIGNAL LOST";
                color = '#ff0000';
                isWin = false;
            }
        } else {
            // Modo Rápido (Lógica anterior)
            const isZorgWinner = winner === 'ZORG';
            color = isZorgWinner ? '#ff0000' : CONFIG.THEME.primaryStr;
            titleText = isZorgWinner ? "YOU WERE DEFEATED BY:" : "WINNER:";
            isWin = !isZorgWinner;
        }

        this.add.text(width / 2, height * 0.25, titleText, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '18px', fill: typeof color === 'number' ? '#' + color.toString(16) : color, align: 'center'
        }).setOrigin(0.5);

        // Texto Principal (Grande)
        let fontSize = mainText.length > 10 ? CONFIG.FONTS.SIZES.LARGE : CONFIG.FONTS.SIZES.TITLE;
        const winText = this.add.text(width / 2, height * 0.35, mainText, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: fontSize, fill: typeof color === 'number' ? '#' + color.toString(16) : color, align: 'center', wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5);

        this.tweens.add({ 
            targets: winText, 
            scale: !isWin ? 1.25 : 1.1, 
            duration: !isWin ? 300 : 500, 
            yoyo: true, 
            repeat: -1 
        });

        // --- MOSTRAR DETALLES (Racha o Info Campaña) ---
        const infoY = height * 0.5;
        if (isCampaign) {
            // Mostrar nivel o mensaje de ánimo
            let subMsg = "PREPARE FOR NEXT BATTLE";
            if (status === 'RETRY_LEVEL') subMsg = "DON'T GIVE UP, PILOT";
            if (status === 'CAMPAIGN_COMPLETE') subMsg = "THE GALAXY IS SAFE";
            
            this.add.text(width / 2, infoY, subMsg, {
                fontFamily: CONFIG.FONTS.MAIN, fontSize: '14px', fill: CONFIG.THEME.secondaryStr
            }).setOrigin(0.5);
        } 
        else if (streak > 0 || isNewRecord) {
            if (isNewRecord) {
                const recText = this.add.text(width / 2, infoY, "NEW RECORD!", {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: '22px', fill: CONFIG.THEME.accentStr
                }).setOrigin(0.5);
                this.tweens.add({ targets: recText, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
                this.add.text(width / 2, infoY + 40, `${streak} WINS IN A ROW`, {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.NORMAL, fill: CONFIG.THEME.primaryStr
                }).setOrigin(0.5);
            } else {
                this.add.text(width / 2, infoY, `CURRENT STREAK: ${streak}`, {
                    fontFamily: CONFIG.FONTS.MAIN, fontSize: '16px', fill: CONFIG.THEME.secondaryStr
                }).setOrigin(0.5);
            }
        }

        // --- BOTONES ---
        let btnText = "RESTART";
        let btnAction = () => this.scene.start('GameScene');

        if (isCampaign) {
            if (status === 'LEVEL_UP') {
                btnText = "NEXT SECTOR"; // Seguir jugando (GameScene cargará el siguiente nivel)
            } else if (status === 'RETRY_LEVEL') {
                btnText = "RETRY SECTOR"; // Reintentar mismo nivel
            } else if (status === 'CAMPAIGN_COMPLETE') {
                btnText = "PLAY AGAIN"; // Volver a empezar campaña o ir a menú
                btnAction = () => {
                    this.scene.start('MainMenuScene'); // Por ahora al menú
                };
            }
        }

        // Botón Principal (Acción)
        new RetroButton(this, width / 2, height * 0.7, btnText, CONFIG.THEME.primary, btnAction);

        // Botón Salir
        new RetroButton(this, width / 2, height * 0.82, "MAIN MENU", CONFIG.THEME.secondary, () => {
            this.scene.start('MainMenuScene');
        });

        // Efecto de entrada suave
        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
    }
}   ``
