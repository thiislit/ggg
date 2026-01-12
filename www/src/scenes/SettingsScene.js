import { Storage } from '../managers/Storage.js';
import { AudioManager } from '../managers/AudioManager.js';
import { CONFIG } from '../data/config.js';

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

        const musicTrack = this.add.rectangle(sliderX, height * 0.25, trackW, 10, 0x444444).setOrigin(0.5);
        const musicHandleX = (sliderX - trackW/2) + (AudioManager.volumes.music * trackW);
        this.musicHandle = this.add.circle(musicHandleX, height * 0.25, 15, colors.PRIMARY)
            .setInteractive({ draggable: true, useHandCursor: true });

        this.musicHandle.on('drag', (pointer, dragX) => {
            const minX = sliderX - trackW/2;
            const maxX = sliderX + trackW/2;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
            this.musicHandle.x = clampedX;
            AudioManager.setMusicVolume((clampedX - minX) / trackW);
        });

        // SFX
        this.sfxLabel = this.add.text(sliderX, height * 0.32, "SFX VOLUME", {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5);

        const sfxTrack = this.add.rectangle(sliderX, height * 0.37, trackW, 10, 0x444444).setOrigin(0.5);
        const sfxHandleX = (sliderX - trackW/2) + (AudioManager.volumes.sfx * trackW);
        this.sfxHandle = this.add.circle(sfxHandleX, height * 0.37, 15, colors.PRIMARY)
            .setInteractive({ draggable: true, useHandCursor: true });

        this.sfxHandle.on('drag', (pointer, dragX) => {
            const minX = sliderX - trackW/2;
            const maxX = sliderX + trackW/2;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
            this.sfxHandle.x = clampedX;
            AudioManager.setSfxVolume((clampedX - minX) / trackW);
        });

        // --- FILAS DE CONFIGURACIÓN ---
        const startY = height * 0.45; // Subido un poco para que quepa MUTE
        const rowStep = height * 0.075; // Un poco más compacto
        const labelX = -140;
        const valueX = 60;

        // Referencias para refresh
        this.arrows = [];

        // 4. Mute (NUEVO)
        this.muteEnabled = this.sound.mute;
        const muteRow = this.add.container(width / 2, startY);
        this.muteLabel = this.add.text(labelX, 0, "MUTE GAME", { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0, 0.5);
        
        const muteSwitchBg = this.add.graphics();
        const mOffTxt = this.add.text(valueX + 15, 0, "OFF", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: colors.ACCENT_STR }).setOrigin(0.5);
        const mOnTxt = this.add.text(valueX + 65, 0, "ON", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: colors.ACCENT_STR }).setOrigin(0.5);
        const mHandle = this.add.circle(this.muteEnabled ? valueX + 65 : valueX + 15, 0, 14, colors.ACCENT);

        const drawMute = (enabled) => {
            muteSwitchBg.clear();
            muteSwitchBg.lineStyle(2, colors.ACCENT);
            muteSwitchBg.strokeRoundedRect(valueX, -15, 80, 30, 15);
            if (enabled) {
                muteSwitchBg.fillStyle(colors.ACCENT, 1);
                muteSwitchBg.fillRoundedRect(valueX, -15, 80, 30, 15);
                mHandle.setFillStyle(colors.PRIMARY);
                mOffTxt.setFill(colors.TEXT_DARK); mOnTxt.setFill(colors.TEXT_DARK);
            } else {
                muteSwitchBg.fillStyle(0x000000, 1);
                muteSwitchBg.fillRoundedRect(valueX, -15, 80, 30, 15);
                mHandle.setFillStyle(colors.ACCENT);
                mOffTxt.setFill(colors.ACCENT_STR); mOnTxt.setFill(colors.ACCENT_STR);
            }
        };
        drawMute(this.muteEnabled);

        const mArea = this.add.rectangle(valueX + 40, 0, 80, 30, 0, 0).setInteractive({ useHandCursor: true });
        mArea.on('pointerup', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            this.muteEnabled = !this.muteEnabled;
            this.sound.mute = this.muteEnabled;
            Storage.set('isMuted', this.muteEnabled);
            AudioManager.playSFX(this, 'sfx_button');
            
            // Animación inmediata
            this.tweens.killTweensOf(mHandle);
            this.tweens.add({ 
                targets: mHandle, 
                x: this.muteEnabled ? valueX + 65 : valueX + 15, 
                duration: 150, 
                onStart: () => drawMute(this.muteEnabled)
            });
        });
        muteRow.add([this.muteLabel, muteSwitchBg, mOffTxt, mOnTxt, mHandle, mArea]);

        // 5. Vibración
        this.vibrateEnabled = await Storage.get('vibrate', true);
        const vibRow = this.add.container(width / 2, startY + rowStep);
        this.vibLabel = this.add.text(labelX, 0, "VIBRATION", { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0, 0.5);
        
        const switchBg = this.add.graphics();
        const offTxt = this.add.text(valueX + 15, 0, "OFF", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: colors.ACCENT_STR }).setOrigin(0.5);
        const onTxt = this.add.text(valueX + 65, 0, "ON", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: colors.ACCENT_STR }).setOrigin(0.5);
        const vHandle = this.add.circle(this.vibrateEnabled ? valueX + 65 : valueX + 15, 0, 14, colors.ACCENT);

        const drawVib = (enabled) => {
            switchBg.clear();
            switchBg.lineStyle(2, colors.ACCENT);
            switchBg.strokeRoundedRect(valueX, -15, 80, 30, 15);
            if (enabled) {
                switchBg.fillStyle(colors.ACCENT, 1);
                switchBg.fillRoundedRect(valueX, -15, 80, 30, 15);
                vHandle.setFillStyle(colors.PRIMARY);
                offTxt.setFill(colors.TEXT_DARK); onTxt.setFill(colors.TEXT_DARK);
            } else {
                switchBg.fillStyle(0x000000, 1);
                switchBg.fillRoundedRect(valueX, -15, 80, 30, 15);
                vHandle.setFillStyle(colors.ACCENT);
                offTxt.setFill(colors.ACCENT_STR); onTxt.setFill(colors.ACCENT_STR);
            }
        };
        drawVib(this.vibrateEnabled);

        const vArea = this.add.rectangle(valueX + 40, 0, 80, 30, 0, 0).setInteractive({ useHandCursor: true });
        vArea.on('pointerup', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            this.vibrateEnabled = !this.vibrateEnabled;
            Storage.set('vibrate', this.vibrateEnabled);
            AudioManager.playSFX(this, 'sfx_button');
            
            this.tweens.killTweensOf(vHandle);
            this.tweens.add({ 
                targets: vHandle, 
                x: this.vibrateEnabled ? valueX + 65 : valueX + 15, 
                duration: 150, 
                onStart: () => drawVib(this.vibrateEnabled) 
            });
            if (this.vibrateEnabled && navigator.vibrate) navigator.vibrate(50);
        });
        vibRow.add([this.vibLabel, switchBg, offTxt, onTxt, vHandle, vArea]);

        // 6. BG Dim
        let bgDim = await Storage.get('bgDim', false);
        const bgRow = this.add.container(width / 2, startY + rowStep * 2);
        this.bgLabel = this.add.text(labelX, 0, "BG DIM", { fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.PRIMARY_STR }).setOrigin(0, 0.5);
        const dimBg = this.add.graphics();
        const dOff = this.add.text(valueX + 15, 0, "OFF", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: colors.ACCENT_STR }).setOrigin(0.5);
        const dOn = this.add.text(valueX + 65, 0, "ON", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: colors.ACCENT_STR }).setOrigin(0.5);
        const dHandle = this.add.circle(bgDim ? valueX + 65 : valueX + 15, 0, 14, colors.ACCENT);

        const drawDim = (enabled) => {
            dimBg.clear();
            dimBg.lineStyle(2, colors.ACCENT);
            dimBg.strokeRoundedRect(valueX, -15, 80, 30, 15);
            if (enabled) {
                dimBg.fillStyle(colors.ACCENT, 1);
                dimBg.fillRoundedRect(valueX, -15, 80, 30, 15);
                dHandle.setFillStyle(colors.PRIMARY);
                dOff.setFill(colors.TEXT_DARK); dOn.setFill(colors.TEXT_DARK);
            } else {
                dimBg.fillStyle(0x000000, 1);
                dimBg.fillRoundedRect(valueX, -15, 80, 30, 15);
                dHandle.setFillStyle(colors.ACCENT);
                dOff.setFill(colors.ACCENT_STR); dOn.setFill(colors.ACCENT_STR);
            }
        };
        drawDim(bgDim);

        const dArea = this.add.rectangle(valueX + 40, 0, 80, 30, 0, 0).setInteractive({ useHandCursor: true });
        dArea.on('pointerup', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            bgDim = !bgDim;
            Storage.set('bgDim', bgDim);
            AudioManager.playSFX(this, 'sfx_button');
            
            this.tweens.killTweensOf(dHandle);
            this.tweens.add({ 
                targets: dHandle, 
                x: bgDim ? valueX + 65 : valueX + 15, 
                duration: 150, 
                onStart: () => drawDim(bgDim) 
            });
        });
        bgRow.add([this.bgLabel, dimBg, dOff, dOn, dHandle, dArea]);

        // 7. BG Theme
        const bgThemes = [
            { id: 'bg_green', name: 'GREEN' },
            { id: 'bg_purple', name: 'PURPLE' },
            { id: 'bg_blue', name: 'BLUE' }
        ];
        let currentBgId = await Storage.get('bg_theme', 'bg_purple');
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
            Storage.set('bg_theme', theme.id);
            CONFIG.THEME.setFromPalette(theme.id);
            this.themeValue.setText(theme.name);
            const bgScene = this.scene.get('BackgroundScene');
            if (bgScene && bgScene.changeBackground) bgScene.changeBackground(theme.id);
            this.refreshUIColors();
            this.tweens.add({ targets: this.themeValue, scale: { from: 1.2, to: 1 }, duration: 200 });
        };
        tL.on('pointerdown', (pointer, localX, localY, event) => { 
            if (event) event.stopPropagation();
            AudioManager.playSFX(this, 'sfx_button'); 
            updateTheme(-1); 
        });
        tR.on('pointerdown', (pointer, localX, localY, event) => { 
            if (event) event.stopPropagation();
            AudioManager.playSFX(this, 'sfx_button'); 
            updateTheme(1); 
        });
        themeRow.add([this.themeLabel, tL, this.themeValue, tR]);

        // 7. Difficulty
        this.difficulties = ['EASY', 'MEDIUM', 'HARD'];
        let savedDiff = await Storage.get('difficulty', 'MEDIUM');
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
            Storage.set('difficulty', d);
            this.diffValue.setText(d).setFill(this.getDiffColor(d));
            this.tweens.add({ targets: this.diffValue, scale: { from: 1.2, to: 1 }, duration: 200 });
        };
        dL.on('pointerdown', (pointer, localX, localY, event) => { 
            if (event) event.stopPropagation();
            AudioManager.playSFX(this, 'sfx_button'); 
            updateDiff(-1); 
        });
        dR.on('pointerdown', (pointer, localX, localY, event) => { 
            if (event) event.stopPropagation();
            AudioManager.playSFX(this, 'sfx_button'); 
            updateDiff(1); 
        });
        diffRow.add([this.diffLabel, dL, this.diffValue, dR]);

        // 8. Botón BACK
        this.closeBtn = this.add.text(width / 2, height * 0.88, "BACK", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: colors.PRIMARY_STR
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.closeBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            AudioManager.playSFX(this, 'sfx_button');
            this.events.emit('settings-closed');
            this.scene.stop();
        });

        // 9. Footer
        this.add.text(60, height - 30, "PRIVACY", { fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#666' })
            .setOrigin(0, 1).setInteractive({ useHandCursor: true }).on('pointerdown', (pointer, localX, localY, event) => {
                if (event) event.stopPropagation();
                window.open('privacy.html', '_self');
            });

        this.add.text(width - 60, height - 30, "CREDITS", { fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#666' })
            .setOrigin(1, 1).setInteractive({ useHandCursor: true }).on('pointerdown', (pointer, localX, localY, event) => {
                if (event) event.stopPropagation();
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
        this.muteLabel.setFill(c.PRIMARY_STR);
        this.vibLabel.setFill(c.PRIMARY_STR);
        this.bgLabel.setFill(c.PRIMARY_STR);
        this.themeLabel.setFill(c.PRIMARY_STR);
        this.diffLabel.setFill(c.PRIMARY_STR);
        this.closeBtn.setFill(c.PRIMARY_STR);
        this.musicHandle.setFillStyle(c.PRIMARY);
        this.sfxHandle.setFillStyle(c.PRIMARY);
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
