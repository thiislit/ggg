import { DataManager } from '../managers/DataManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { CONFIG } from '../data/config.js';
import { ASSET_KEYS } from '../constants/AssetKeys.js';
import { Switch } from '../ui/components/Switch.js';
import { Slider } from '../ui/components/Slider.js';

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    async create() {
        const { width, height } = this.scale;
        const colors = CONFIG.THEME;

        // 1. Fondo bloqueador
        this.bg = this.add.rectangle(0, 0, width, height, colors.BG, 0.95)
            .setOrigin(0)
            .setInteractive();
        this.bg.on('pointerdown', (pointer, localX, localY, event) => event.stopPropagation());
        this.bg.on('pointerup', (pointer, localX, localY, event) => event.stopPropagation());

        // 2. Título
        this.title = this.add.text(width / 2, height * 0.10, "OPTIONS", {
            fontFamily: '"Press Start 2P"', fontSize: '28px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5);

        // --- SLIDERS DE VOLUMEN ---
        const sliderX = width / 2;
        const trackW = 240;

        // Música
        this.musicLabel = this.add.text(sliderX, height * 0.20, "MUSIC VOLUME", {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5);

        this.musicSlider = new Slider(this, sliderX, height * 0.25, trackW, AudioManager.volumes.music, (value) => {
            AudioManager.setMusicVolume(value);
        });

        // SFX
        this.sfxLabel = this.add.text(sliderX, height * 0.32, "SFX VOLUME", {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5);

        this.sfxSlider = new Slider(this, sliderX, height * 0.37, trackW, AudioManager.volumes.sfx, (value) => {
            AudioManager.setSfxVolume(value);
        });

        // --- FILAS DE CONFIGURACIÓN ---
        const startY = height * 0.45;
        const rowStep = height * 0.075;
        const labelX = -140;
        const valueX = 60;

        this.arrows = [];

        // 4. Mute
        this.muteSwitch = new Switch(this, width / 2, startY, DataManager.isMuted(), (newState) => {
            this.sound.mute = newState;
            DataManager.setIsMuted(newState);
        });
        this.muteSwitch.setX(width / 2 + 30);
        this.add.text(width / 2 - 140, startY, "MUTE GAME", { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0, 0.5);

        // 5. Vibración
        this.vibrateSwitch = new Switch(this, width / 2, startY + rowStep, DataManager.isVibrateEnabled(), (newState) => {
            DataManager.setVibrate(newState);
            if (newState && navigator.vibrate) navigator.vibrate(50);
        });
        this.vibrateSwitch.setX(width / 2 + 30);
        this.add.text(width / 2 - 140, startY + rowStep, "VIBRATION", { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0, 0.5);

        // 6. BG Dim
        this.bgDimSwitch = new Switch(this, width / 2, startY + rowStep * 2, DataManager.isBgDim(), (newState) => {
            DataManager.setBgDim(newState);
            const bgScene = this.scene.get('BackgroundScene');
            if (bgScene) bgScene.applyDim(newState);
        });
        this.bgDimSwitch.setX(width / 2 + 30);
        this.add.text(width / 2 - 140, startY + rowStep * 2, "BG DIM", { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0, 0.5);

        // 7. BG Theme
        const bgThemes = [
            { id: ASSET_KEYS.IMAGES.BG_GREEN, name: 'GREEN' },
            { id: ASSET_KEYS.IMAGES.BG_PURPLE, name: 'PURPLE' },
            { id: ASSET_KEYS.IMAGES.BG_BLUE, name: 'BLUE' }
        ];
        let currentBgId = DataManager.getBgTheme();
        let bgIdx = bgThemes.findIndex(t => t.id === currentBgId);
        if (bgIdx === -1) bgIdx = 1;

        const themeRow = this.add.container(width / 2, startY + rowStep * 3);
        this.themeLabel = this.add.text(labelX, 0, "BG THEME", { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0, 0.5);
        this.themeValue = this.add.text(valueX + 40, 0, bgThemes[bgIdx].name, { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0.5);
        const tL = this.add.text(valueX - 10, 0, "<", { fontFamily: '"Press Start 2P"', fontSize: '20px', fill: colors.ACCENT_STR }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const tR = this.add.text(valueX + 90, 0, ">", { fontFamily: '"Press Start 2P"', fontSize: '20px', fill: colors.ACCENT_STR }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.arrows.push(tL, tR);

        const updateTheme = (dir) => {
            bgIdx = (bgIdx + dir + bgThemes.length) % bgThemes.length;
            const theme = bgThemes[bgIdx];
            DataManager.setBgTheme(theme.id);
            CONFIG.THEME.setFromPalette(theme.id);
            this.themeValue.setText(theme.name);
            const bgScene = this.scene.get('BackgroundScene');
            if (bgScene && bgScene.changeBackground) bgScene.changeBackground(theme.id);
            this.refreshUIColors();
            this.tweens.add({ targets: this.themeValue, scale: { from: 1.2, to: 1 }, duration: 200 });
        };
        tL.on('pointerdown', () => { updateTheme(-1); AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_BUTTON); });
        tR.on('pointerdown', () => { updateTheme(1); AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_BUTTON); });
        themeRow.add([this.themeLabel, tL, this.themeValue, tR]);

        // 8. Difficulty
        this.difficulties = ['EASY', 'MEDIUM', 'HARD'];
        let savedDiff = DataManager.getDifficulty();
        this.diffIdx = this.difficulties.indexOf(savedDiff);
        if (this.diffIdx === -1) this.diffIdx = 1;

        const diffRow = this.add.container(width / 2, startY + rowStep * 4);
        this.diffLabel = this.add.text(labelX, 0, "DIFFICULTY", { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0, 0.5);
        this.diffValue = this.add.text(valueX + 40, 0, this.difficulties[this.diffIdx], { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: this.getDiffColor(this.difficulties[this.diffIdx]) }).setOrigin(0.5);
        const dL = this.add.text(valueX - 10, 0, "<", { fontFamily: '"Press Start 2P"', fontSize: '20px', fill: colors.ACCENT_STR }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const dR = this.add.text(valueX + 90, 0, ">", { fontFamily: '"Press Start 2P"', fontSize: '20px', fill: colors.ACCENT_STR }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.arrows.push(dL, dR);

        const updateDiff = (dir) => {
            this.diffIdx = (this.diffIdx + dir + this.difficulties.length) % this.difficulties.length;
            const d = this.difficulties[this.diffIdx];
            DataManager.setDifficulty(d);
            this.diffValue.setText(d).setFill(this.getDiffColor(d));
            this.tweens.add({ targets: this.diffValue, scale: { from: 1.2, to: 1 }, duration: 200 });
        };
        dL.on('pointerdown', () => { updateDiff(-1); AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_BUTTON); });
        dR.on('pointerdown', () => { updateDiff(1); AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_BUTTON); });
        diffRow.add([this.diffLabel, dL, this.diffValue, dR]);

        // 9. Botón BACK
        this.closeBtn = this.add.text(width / 2, height * 0.88, "BACK", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.closeBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_BUTTON);
            this.events.emit('settings-closed');
            this.scene.stop();
        });

        // 10. Footer
        this.add.text(60, height - 30, "PRIVACY", { fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#666' })
            .setOrigin(0, 1).setInteractive({ useHandCursor: true }).on('pointerdown', () => window.open('privacy.html', '_self'));

        this.add.text(width - 60, height - 30, "CREDITS", { fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#666' })
            .setOrigin(1, 1).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
                if (this.creditsText) { this.creditsText.destroy(); this.creditsText = null; return; }
                this.creditsText = this.add.text(width / 2, height * 0.5, "DEV: AXEL\nPHASER 3\nv1.1", {
                    fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.ACCENT_STR, align: 'center', backgroundColor: colors.BG_STR
                }).setOrigin(0.5).setDepth(100);
                this.time.delayedCall(2000, () => { if(this.creditsText) this.creditsText.destroy(); this.creditsText = null; });
            });
    }

    refreshUIColors() {
        const c = CONFIG.THEME;
        this.title.setFill(c.PRIMARY_STR);
        this.musicLabel.setFill(c.PRIMARY_STR);
        this.sfxLabel.setFill(c.PRIMARY_STR);
        
        // Llamar a refreshColors en los nuevos componentes
        this.musicSlider.refreshColors();
        this.sfxSlider.refreshColors();
        this.muteSwitch.refreshColors();
        this.vibrateSwitch.refreshColors();
        this.bgDimSwitch.refreshColors();

        this.closeBtn.setFill(c.PRIMARY_STR);
        this.themeLabel.setFill(c.PRIMARY_STR);
        this.diffLabel.setFill(c.PRIMARY_STR);
        if (this.themeValue) this.themeValue.setFill(c.PRIMARY_STR);
        if (this.arrows) this.arrows.forEach(a => a.setFill(c.ACCENT_STR));
    }

    getDiffColor(diff) {
        switch(diff) {
            case 'EASY': return '#2ecc71';
            case 'MEDIUM': return '#f1c40f';
            case 'HARD': return '#e74c3c';
            default: return '#ffffff';
        }
    }
}
