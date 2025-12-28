import { Storage } from '../Storage.js';

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    async create() {
        const { width, height } = this.scale;
        
        // Siempre usamos tema oscuro/neon
        this.themes = {
            dark: { background: 0x000000, text: '#ffffff', accent: '#00A8F3' }
        };
        const colors = this.themes.dark;

        // 1. Fondo bloqueador
        this.bg = this.add.rectangle(0, 0, width, height, colors.background, 0.95)
            .setOrigin(0)
            .setInteractive();
        this.bg.on('pointerdown', (pointer, localX, localY, event) => event.stopPropagation());

        // 2. Título
        this.title = this.add.text(width / 2, height * 0.12, "OPCIONES", {
            fontFamily: '"Press Start 2P"', fontSize: '28px', fill: colors.text
        }).setOrigin(0.5);

        // 3. Volumen
        this.volLabel = this.add.text(width / 2, height * 0.25, "VOLUMEN", {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.text
        }).setOrigin(0.5);

        const track = this.add.rectangle(width / 2, height * 0.33, 200, 10, 0x555555).setOrigin(0.5);
        const handleX = (width / 2 - 100) + (this.sound.volume * 200);
        this.handle = this.add.circle(handleX, height * 0.33, 15, this.currentTheme === 'dark' ? 0x00A8F3 : 0xF34235)
            .setInteractive({ draggable: true, useHandCursor: true });

        this.handle.on('drag', (pointer, dragX) => {
            const minX = width / 2 - 100;
            const maxX = width / 2 + 100;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
            this.handle.x = clampedX;
            this.sound.setVolume((clampedX - minX) / 200);
        });

        // 4. Vibración
        const savedVib = await Storage.get('vibrate', 'true');
        this.vibrateEnabled = (savedVib !== 'false');
        
        this.vibBtn = this.add.text(width / 2, height * 0.48, `VIBRACION: ${this.vibrateEnabled ? 'ON' : 'OFF'}`, {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.text
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.vibBtn.on('pointerdown', () => {
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 200 });
            this.vibrateEnabled = !this.vibrateEnabled;
            Storage.set('vibrate', this.vibrateEnabled);
            this.vibBtn.setText(`VIBRACION: ${this.vibrateEnabled ? 'ON' : 'OFF'}`);
            if (this.vibrateEnabled && navigator.vibrate) navigator.vibrate(50);
        });

        // 5. Fondo (Antes Tema)
        let bgDim = await Storage.get('bgDim', 'false') === 'true';
        
        this.bgBtn = this.add.text(width / 2, height * 0.60, `FONDO: ${bgDim ? 'TENUE' : 'VIVO'}`, {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.text
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.bgBtn.on('pointerdown', () => {
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 200 });
            bgDim = !bgDim;
            Storage.set('bgDim', bgDim);
            this.bgBtn.setText(`FONDO: ${bgDim ? 'TENUE' : 'VIVO'}`);
        });

        // 6. DIFICULTAD
        this.difficulties = ['EASY', 'MEDIUM', 'HARD'];
        let savedDiff = await Storage.get('difficulty', 'MEDIUM');
        this.diffIndex = this.difficulties.indexOf(savedDiff);
        if (this.diffIndex === -1) this.diffIndex = 1;

        this.diffBtn = this.add.text(width / 2, height * 0.72, `DIFICULTAD: ${this.difficulties[this.diffIndex]}`, {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: this.getDiffColor(this.difficulties[this.diffIndex])
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.diffBtn.on('pointerdown', () => {
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 200 });
            this.diffIndex = (this.diffIndex + 1) % this.difficulties.length;
            const newDiff = this.difficulties[this.diffIndex];
            Storage.set('difficulty', newDiff);
            this.diffBtn.setText(`DIFICULTAD: ${newDiff}`);
            this.diffBtn.setFill(this.getDiffColor(newDiff));
            if (this.vibrateEnabled && navigator.vibrate) navigator.vibrate(20);
        });

        // 7. Botón Volver
        this.closeBtn = this.add.text(width / 2, height * 0.88, "VOLVER", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: colors.accent
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.closeBtn.on('pointerdown', () => {
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 500 });
            this.events.emit('settings-closed');
            this.scene.stop();
        });

        // 8. Privacidad
        this.privacyBtn = this.add.text(width / 2, height * 0.82, "PRIVACIDAD", {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.text
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.privacyBtn.on('pointerdown', () => {
            window.open('privacy.html', '_self');
        });
    }

    getDiffColor(diff) {
        if (this.currentTheme === 'light') return '#000000';
        switch(diff) {
            case 'EASY': return '#2ecc71';
            case 'MEDIUM': return '#f1c40f';
            case 'HARD': return '#e74c3c';
            default: return '#ffffff';
        }
    }

    applyLocalTheme() {
        const colors = this.themes.dark;
        // Solo actualizamos textos que cambian, los colores son fijos
        const currentDiff = this.difficulties[this.diffIndex];
        this.diffBtn.setFill(this.getDiffColor(currentDiff));
    }
}