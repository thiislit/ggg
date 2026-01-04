import { Storage } from '../Storage.js';
import { AudioManager } from '../managers/AudioManager.js';

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
        this.title = this.add.text(width / 2, height * 0.12, "OPTIONS", {
            fontFamily: '"Press Start 2P"', fontSize: '28px', fill: colors.text
        }).setOrigin(0.5);

        // 3. Volumen de MÚSICA
        this.musicLabel = this.add.text(width / 2, height * 0.22, "MUSIC VOLUME", {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.text
        }).setOrigin(0.5);

        const musicTrack = this.add.rectangle(width / 2, height * 0.28, 200, 10, 0x555555).setOrigin(0.5);
        const musicHandleX = (width / 2 - 100) + (AudioManager.volumes.music * 200);
        this.musicHandle = this.add.circle(musicHandleX, height * 0.28, 15, 0x00A8F3)
            .setInteractive({ draggable: true, useHandCursor: true });

        this.musicHandle.on('drag', (pointer, dragX) => {
            const minX = width / 2 - 100;
            const maxX = width / 2 + 100;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
            this.musicHandle.x = clampedX;
            const vol = (clampedX - minX) / 200;
            AudioManager.setMusicVolume(vol);
        });

        // 3b. Volumen de SFX
        this.sfxLabel = this.add.text(width / 2, height * 0.35, "SFX VOLUME", {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: colors.text
        }).setOrigin(0.5);

        const sfxTrack = this.add.rectangle(width / 2, height * 0.41, 200, 10, 0x555555).setOrigin(0.5);
        const sfxHandleX = (width / 2 - 100) + (AudioManager.volumes.sfx * 200);
        this.sfxHandle = this.add.circle(sfxHandleX, height * 0.41, 15, 0x00A8F3)
            .setInteractive({ draggable: true, useHandCursor: true });

        this.sfxHandle.on('drag', (pointer, dragX) => {
            const minX = width / 2 - 100;
            const maxX = width / 2 + 100;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
            this.sfxHandle.x = clampedX;
            const vol = (clampedX - minX) / 200;
            AudioManager.setSfxVolume(vol);
        });

        // 4. Vibración (SWITCH VISUAL B&N)
        const savedVib = await Storage.get('vibrate', 'true');
        this.vibrateEnabled = (savedVib !== 'false');

        const vibRow = this.add.container(width / 2, height * 0.52);
        this.vibLabel = this.add.text(-100, 0, "VIBRATION", {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.text
        }).setOrigin(0, 0.5);

        // Contenedor del Switch
        const switchW = 80;
        const switchH = 30;
        const switchX = 50; 
        
        // Fondo dinámico (Graphics)
        const switchBg = this.add.graphics();
        
        // Textos ON/OFF internos
        const offText = this.add.text(switchX + 15, 0, "OFF", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff' }).setOrigin(0.5);
        const onText = this.add.text(switchX + 65, 0, "ON", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff' }).setOrigin(0.5);

        const handle = this.add.circle(this.vibrateEnabled ? switchX + 65 : switchX + 15, 0, 14, 0xffffff); // Handle siempre blanco pero cambiante de color si fondo es blanco? No, handle blanco, fondo cambia.
        
        // Mejor: Handle NEGRO si el fondo es BLANCO, Handle BLANCO si el fondo es NEGRO.
        // O Handle siempre BLANCO y fondo NEGRO (OFF) -> BLANCO (ON)

        const drawSwitch = (enabled) => {
            switchBg.clear();
            if (enabled) {
                // Estado ON: Fondo Blanco, Borde Blanco
                switchBg.fillStyle(0xffffff, 1);
                switchBg.fillRoundedRect(switchX, -15, switchW, switchH, 15);
                
                // Textos invierten color para verse sobre blanco
                offText.setFill('#000000');
                onText.setFill('#000000'); // Tapado por handle de todas formas
                handle.setFillStyle(0x000000); // Handle Negro sobre fondo blanco
            } else {
                // Estado OFF: Fondo Negro, Borde Blanco
                switchBg.lineStyle(2, 0xffffff);
                switchBg.strokeRoundedRect(switchX, -15, switchW, switchH, 15);
                switchBg.fillStyle(0x000000, 1);
                switchBg.fillRoundedRect(switchX, -15, switchW, switchH, 15);

                // Textos blancos sobre fondo negro
                offText.setFill('#ffffff');
                onText.setFill('#ffffff');
                handle.setFillStyle(0xffffff); // Handle Blanco sobre fondo negro
            }
        };

        drawSwitch(this.vibrateEnabled);

        const toggleArea = this.add.rectangle(switchX + 40, 0, switchW, switchH, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        const updateSwitch = (enabled) => {
            this.tweens.add({
                targets: handle,
                x: enabled ? switchX + 65 : switchX + 15,
                duration: 200,
                ease: 'Power2',
                onStart: () => drawSwitch(enabled) // Redibujar colores al iniciar cambio
            });
        };

        toggleArea.on('pointerdown', () => {
            AudioManager.playSFX(this, 'sfx_button');
            this.vibrateEnabled = !this.vibrateEnabled;
            Storage.set('vibrate', this.vibrateEnabled);
            updateSwitch(this.vibrateEnabled);
            if (this.vibrateEnabled && navigator.vibrate) navigator.vibrate(50);
        });

        vibRow.add([this.vibLabel, switchBg, offText, onText, handle, toggleArea]);

        // 5. Fondo (SWITCH VISUAL B&N)
        let bgDim = await Storage.get('bgDim', 'false') === 'true';
        
        const bgRow = this.add.container(width / 2, height * 0.62);
        this.bgLabel = this.add.text(-100, 0, "BG IN GAME", {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.text
        }).setOrigin(0, 0.5);

        // Contenedor del Switch
        const bgSwitchX = 50; 
        const bgSwitchBg = this.add.graphics();
        const bgOffText = this.add.text(bgSwitchX + 15, 0, "OFF", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff' }).setOrigin(0.5);
        const bgOnText = this.add.text(bgSwitchX + 65, 0, "ON", { fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff' }).setOrigin(0.5);
        const bgHandle = this.add.circle(bgDim ? bgSwitchX + 65 : bgSwitchX + 15, 0, 14, 0xffffff);

        const drawBgSwitch = (enabled) => {
            bgSwitchBg.clear();
            if (enabled) {
                bgSwitchBg.fillStyle(0xffffff, 1);
                bgSwitchBg.fillRoundedRect(bgSwitchX, -15, 80, 30, 15);
                bgOffText.setFill('#000000');
                bgOnText.setFill('#000000');
                bgHandle.setFillStyle(0x000000);
            } else {
                bgSwitchBg.lineStyle(2, 0xffffff);
                bgSwitchBg.strokeRoundedRect(bgSwitchX, -15, 80, 30, 15);
                bgSwitchBg.fillStyle(0x000000, 1);
                bgSwitchBg.fillRoundedRect(bgSwitchX, -15, 80, 30, 15);
                bgOffText.setFill('#ffffff');
                bgOnText.setFill('#ffffff');
                bgHandle.setFillStyle(0xffffff);
            }
        };

        drawBgSwitch(bgDim);

        const bgToggleArea = this.add.rectangle(bgSwitchX + 40, 0, 80, 30, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        const updateBgSwitch = (enabled) => {
            this.tweens.add({
                targets: bgHandle,
                x: enabled ? bgSwitchX + 65 : bgSwitchX + 15,
                duration: 200,
                ease: 'Power2',
                onStart: () => drawBgSwitch(enabled)
            });
        };

        bgToggleArea.on('pointerdown', () => {
            AudioManager.playSFX(this, 'sfx_button');
            bgDim = !bgDim;
            Storage.set('bgDim', bgDim);
            updateBgSwitch(bgDim);
            if (this.vibrateEnabled && navigator.vibrate) navigator.vibrate(20);
        });

        bgRow.add([this.bgLabel, bgSwitchBg, bgOffText, bgOnText, bgHandle, bgToggleArea]);

        // 6. DIFICULTAD (SELECTOR CON FLECHAS)
        this.difficulties = ['EASY', 'MEDIUM', 'HARD'];
        let savedDiff = await Storage.get('difficulty', 'MEDIUM');
        this.diffIndex = this.difficulties.indexOf(savedDiff);
        if (this.diffIndex === -1) this.diffIndex = 1;

        const diffRow = this.add.container(width / 2, height * 0.74);
        
        // Etiqueta (Más a la izquierda)
        const diffLabel = this.add.text(-120, 0, "DIFFICULTY", {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: colors.text
        }).setOrigin(0, 0.5);

        // Valor Central (Desplazado para no chocar)
        const diffValue = this.add.text(100, 0, this.difficulties[this.diffIndex], {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: this.getDiffColor(this.difficulties[this.diffIndex])
        }).setOrigin(0.5);

        // Flecha Izquierda
        const leftArrow = this.add.text(40, 0, "<", {
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Flecha Derecha
        const rightArrow = this.add.text(160, 0, ">", {
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const updateDifficulty = (direction) => {
            // Ciclo circular: +1 o -1
            if (direction === 1) {
                this.diffIndex = (this.diffIndex + 1) % this.difficulties.length;
            } else {
                this.diffIndex = (this.diffIndex - 1 + this.difficulties.length) % this.difficulties.length;
            }

            const newDiff = this.difficulties[this.diffIndex];
            Storage.set('difficulty', newDiff);
            
            diffValue.setText(newDiff);
            diffValue.setFill(this.getDiffColor(newDiff));
            
            // Animación de pulso
            this.tweens.add({ targets: diffValue, scale: { from: 1.2, to: 1 }, duration: 200 });
            if (this.vibrateEnabled && navigator.vibrate) navigator.vibrate(20);
        };

        leftArrow.on('pointerdown', () => {
            AudioManager.playSFX(this, 'sfx_button');
            this.tweens.add({ targets: leftArrow, scale: 0.8, duration: 50, yoyo: true });
            updateDifficulty(-1);
        });

        rightArrow.on('pointerdown', () => {
            AudioManager.playSFX(this, 'sfx_button');
            this.tweens.add({ targets: rightArrow, scale: 0.8, duration: 50, yoyo: true });
            updateDifficulty(1);
        });
        
        // Añadir a la fila pero guardar referencias para poder actualizar colores si hiciera falta
        this.diffValueText = diffValue; 
        diffRow.add([diffLabel, leftArrow, diffValue, rightArrow]);

        // 7. Botón Volver
        this.closeBtn = this.add.text(width / 2, height * 0.90, "BACK", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: colors.accent
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.closeBtn.on('pointerdown', () => {
            AudioManager.playSFX(this, 'sfx_button');
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 500 });
            this.events.emit('settings-closed');
            this.scene.stop();
        });

        // 8. Privacidad
        this.privacyBtn = this.add.text(width / 2, height * 0.82, "PRIVACY", {
            fontFamily: '"Press Start 2P"', fontSize: '10px', fill: colors.text
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.privacyBtn.on('pointerdown', () => {
            AudioManager.playSFX(this, 'sfx_button');
            window.open('privacy.html', '_self');
        });

        // 9. Créditos
        this.creditsBtn = this.add.text(width / 2, height * 0.86, "CREDITS", {
            fontFamily: '"Press Start 2P"', fontSize: '10px', fill: colors.text
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.creditsBtn.on('pointerdown', () => {
            AudioManager.playSFX(this, 'sfx_button');
            if (this.creditsText) {
                this.creditsText.destroy();
                this.creditsText = null;
                return;
            }
            this.creditsText = this.add.text(width / 2, height * 0.96, "DEVELOPED BY AXEL\nENGINE: PHASER 3\nVERSION 1.0", {
                fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#888888', align: 'center'
            }).setOrigin(0.5);
            
            this.tweens.add({ targets: this.creditsText, alpha: { from: 0, to: 1 }, duration: 500 });
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