import { DataManager } from '../managers/DataManager.js';
import { CONFIG } from '../data/config.js';
import { CampaignManager } from '../managers/CampaignManager.js';
import { RetroButton } from '../ui/components/RetroButton.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    async create() {
        const { width, height } = this.scale;

        // Lanzar fondo (Estático)
        this.scene.launch('BackgroundScene');
        this.scene.sendToBack('BackgroundScene');

        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

        // Cargamos datos
        const playerName = DataManager.getName();
        const bestStreak = DataManager.getBestStreak();

        // Título pequeño arriba
        this.playerText = this.add
            .text(width / 2, height * 0.12, `HELLO, ${playerName}`, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.LARGE,
                fill: CONFIG.COLORS.TEXT_MAIN,
                align: 'center',
                wordWrap: { width: width * 0.9 },
            })
            .setOrigin(0.5);

        // --- BOTONES ---
        this.menuButtons = [];

        const startY = height * 0.35;
        const gap = height * 0.11;

        // 1. STORY MODE (Gold)
        const storyBtn = new RetroButton(this, width / 2, startY, 'STORY MODE', 0xffd700, () => {
            CampaignManager.startCampaign();
            this.goToGame();
        });
        this.menuButtons.push({ instance: storyBtn, type: 'GOLD' });

        // 2. QUICK PLAY
        const quickBtn = new RetroButton(
            this,
            width / 2,
            startY + gap,
            'QUICK PLAY',
            CONFIG.THEME.PRIMARY,
            () => {
                CampaignManager.stopCampaign();
                this.goToGame();
            }
        );
        this.menuButtons.push({ instance: quickBtn, type: 'PRIMARY' });

        // 3. EDITAR PERFIL
        const profileBtn = new RetroButton(
            this,
            width / 2,
            startY + gap * 2,
            'EDIT PROFILE',
            CONFIG.THEME.ACCENT || 0x00ff00,
            () => {
                this.scene.start('ProfileScene');
            }
        );
        this.menuButtons.push({ instance: profileBtn, type: 'SECONDARY' });

        // 4. OPCIONES
        const optBtn = new RetroButton(
            this,
            width / 2,
            startY + gap * 3,
            'OPTIONS',
            CONFIG.THEME.SECONDARY,
            () => {
                this.scene.launch('SettingsScene');
            }
        );
        this.menuButtons.push({ instance: optBtn, type: 'SECONDARY' });

        // --- ESCUCHAR CIERRE DE OPCIONES ---
        const settingsScene = this.scene.get('SettingsScene');
        const onSettingsClosed = () => {
            if (!this.scene.isActive()) return;

            const newName = DataManager.getName();
            const c = CONFIG.THEME;

            if (this.playerText && this.playerText.active) {
                this.playerText.setText(`HELLO, ${newName}`).setFill(c.PRIMARY_STR);
            }

            // Actualizar colores
            this.menuButtons.forEach((btnObj) => {
                if (btnObj.instance && btnObj.instance.scene) {
                    let color;
                    if (btnObj.type === 'PRIMARY') color = c.PRIMARY;
                    else if (btnObj.type === 'SECONDARY') color = c.SECONDARY;
                    else if (btnObj.type === 'GOLD') color = 0xffd700;

                    if (color) btnObj.instance.setColor(color);
                }
            });

            // Actualizar récord
            if (this.recordText && this.recordText.active) {
                this.recordText.setFill(c.PRIMARY_STR);
            }
            if (this.recordBg && this.recordBg.active) {
                this.recordBg.clear();
                this.recordBg.fillStyle(0x000000, 0.7);
                this.recordBg.fillRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
                this.recordBg.lineStyle(2, c.PRIMARY);
                this.recordBg.strokeRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
            }

            if (this.versionText && this.versionText.active) {
                this.versionText.setFill(c.SECONDARY_STR);
            }
        };

        settingsScene.events.on('settings-closed', onSettingsClosed);

        this.events.once('shutdown', () => {
            settingsScene.events.off('settings-closed', onSettingsClosed);
        });

        // --- MOSTRAR MEJOR RACHA ---
        this.recordText = this.add
            .text(0, 0, `RECORD: ${bestStreak} WINS`, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: '16px',
                fill: CONFIG.THEME.PRIMARY_STR,
            })
            .setOrigin(0.5);

        const recordContainer = this.add.container(width / 2, height * 0.85);
        this.recordBg = this.add.graphics();
        this.recordBg.fillStyle(0x000000, 0.7);
        this.recordBg.fillRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);
        this.recordBg.lineStyle(2, CONFIG.THEME.PRIMARY);
        this.recordBg.strokeRoundedRect(-150, -25, 300, 50, CONFIG.UI.BUTTON_RADIUS);

        recordContainer.add([this.recordBg, this.recordText]);

        // --- VERSIÓN ---
        this.versionText = this.add
            .text(width - 20, height - 20, 'v1.1', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.SMALL,
                fill: CONFIG.THEME.secondaryStr,
            })
            .setOrigin(1, 1);

        // Efecto de entrada suave
        this.cameras.main.alpha = 0;
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 1,
            duration: CONFIG.TIMING.FADE_DURATION,
        });

        // --- DEV CHEATS (ATAJOS DE TECLADO) ---
        this.input.keyboard.on('keydown-ONE', () => this.startDevCampaign(1));
        this.input.keyboard.on('keydown-TWO', () => this.startDevCampaign(2));
        this.input.keyboard.on('keydown-THREE', () => this.startDevCampaign(3));
    }

    startDevCampaign(level) {
        console.warn(`[DEV] Starting Campaign Level ${level}`);
        CampaignManager.startCampaign();
        CampaignManager.state.currentLevel = level;
        this.goToGame();
    }

    goToGame() {
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.scene.start('GameScene');
            },
        });
    }
}
