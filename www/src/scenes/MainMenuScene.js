import { Storage } from '../managers/Storage.js';
import { CONFIG } from '../data/config.js';
import { AudioManager } from '../managers/AudioManager.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { RetroButton } from '../ui/components/RetroButton.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    async create() {
        const { width, height } = this.scale;

        // Reactivar música al llegar al menú
        AudioManager.playMusic(this, 'bgm');

        // Lanzar fondo (Estático)
        this.scene.launch('BackgroundScene');
        this.scene.sendToBack('BackgroundScene');

        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)'); // Transparente para ver el fondo
        
        // Cargamos datos desde PlayerManager
        const playerName = PlayerManager.getName();
        const bestStreak = PlayerManager.getBestStreak();

        // Título pequeño arriba
        this.playerText = this.add.text(width / 2, height * 0.15, `HELLO, ${playerName}`, {
            fontFamily: CONFIG.FONTS.MAIN,
            fontSize: CONFIG.FONTS.SIZES.LARGE,
            fill: CONFIG.COLORS.TEXT_MAIN,
            align: 'center',
            wordWrap: { width: width * 0.9 } 
        }).setOrigin(0.5);

        // --- BOTONES ---
        this.menuButtons = [];

        // 1. INICIAR JUEGO (Usando color del tema)
        const startBtn = new RetroButton(this, width / 2, height * 0.40, "START GAME", CONFIG.THEME.PRIMARY, () => {
            this.tweens.add({
                targets: this.cameras.main,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    this.scene.start('GameScene');
                }
            });
        });
        this.menuButtons.push({ instance: startBtn, type: 'PRIMARY' });

        // 2. EDITAR PERFIL
        const profileBtn = new RetroButton(this, width / 2, height * 0.52, "EDIT PROFILE", CONFIG.THEME.ACCENT || 0x00FF00, () => {
            this.scene.start('ProfileScene');
        });
        this.menuButtons.push({ instance: profileBtn, type: 'SECONDARY' });

        // 3. OPCIONES
        const optBtn = new RetroButton(this, width / 2, height * 0.64, "OPTIONS", CONFIG.THEME.SECONDARY, () => {
            this.scene.launch('SettingsScene'); 
        });
        this.menuButtons.push({ instance: optBtn, type: 'SECONDARY' });

        // Escuchar cuando se cierran las opciones
        const settingsScene = this.scene.get('SettingsScene');
        const onSettingsClosed = async () => {
            // Seguridad: Si la escena ya no está activa, no hacer nada
            if (!this.scene.isActive()) return;

            const newName = PlayerManager.getName();
            const c = CONFIG.THEME;

            if (this.playerText && this.playerText.active && this.playerText.scene) {
                this.playerText.setText(`HELLO, ${newName}`).setFill(c.PRIMARY_STR);
            }

            // Actualizar colores de botones (Usando el nuevo componente)
            this.menuButtons.forEach(btnObj => {
                if (btnObj.instance && btnObj.instance.scene) {
                    const color = (btnObj.type === 'PRIMARY') ? c.PRIMARY : c.SECONDARY;
                    btnObj.instance.setColor(color);
                }
            });

            // Actualizar récord
            if (this.recordText && this.recordText.active && this.recordText.scene) {
                this.recordText.setFill(c.PRIMARY_STR);
            }
            if (this.recordBg && this.recordBg.active && this.recordBg.clear) {
                this.recordBg.clear();
                this.recordBg.fillStyle(0x000000, 0.7);
                this.recordBg.fillRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
                this.recordBg.lineStyle(2, c.PRIMARY);
                this.recordBg.strokeRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
            }

            if (this.versionText && this.versionText.active && this.versionText.scene) {
                this.versionText.setFill(c.SECONDARY_STR);
            }
        };

        settingsScene.events.on('settings-closed', onSettingsClosed);
        
        // Limpiar el evento cuando la escena se destruye o cambia
        this.events.once('shutdown', () => {
            settingsScene.events.off('settings-closed', onSettingsClosed);
        });

        // --- MOSTRAR MEJOR RACHA ---
        this.recordText = this.add.text(0, 0, `RECORD: ${bestStreak} WINS`, {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '16px', fill: CONFIG.THEME.PRIMARY_STR
        }).setOrigin(0.5);

        const recordContainer = this.add.container(width / 2, height * 0.85);
        this.recordBg = this.add.graphics();
        this.recordBg.fillStyle(0x000000, 0.7);
        this.recordBg.fillRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
        this.recordBg.lineStyle(2, CONFIG.THEME.PRIMARY);
        this.recordBg.strokeRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
        
        recordContainer.add([this.recordBg, this.recordText]);

        // --- VERSIÓN ---
        this.versionText = this.add.text(width - 20, height - 20, "v1.0", {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.SMALL, fill: CONFIG.THEME.secondaryStr
        }).setOrigin(1, 1);

        // Efecto de entrada suave
        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
    }
}
