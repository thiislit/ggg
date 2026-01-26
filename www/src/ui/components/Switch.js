import { CONFIG } from '../../data/config.js';
import { ASSET_KEYS } from '../../constants/AssetKeys.js';
import { AudioManager } from '../../managers/AudioManager.js';

export class Switch extends Phaser.GameObjects.Container {
    /**
     * Componente de interruptor ON/OFF.
     * @param {Phaser.Scene} scene La escena a la que pertenece este interruptor.
     * @param {number} x La posición X del interruptor.
     * @param {number} y La posición Y del interruptor.
     * @param {boolean} initialState El estado inicial del interruptor (true para ON, false para OFF).
     * @param {function(boolean):void} onChangeCallback La función a llamar cuando el estado del interruptor cambia.
     */
    constructor(scene, x, y, initialState, onChangeCallback) {
        super(scene, x, y);

        this.scene = scene;
        this.currentState = initialState;
        this.onChangeCallback = onChangeCallback;

        this.colors = CONFIG.THEME;
        this.valueX = 60; // Hardcoded from SettingsScene, adjust if needed

        this.setupGraphics();
        this.setupText();
        this.setupHandle();
        this.setupInput();

        this.drawSwitch(this.currentState); // Dibujar el estado inicial

        this.scene.add.existing(this);
    }

    setupGraphics() {
        this.switchBg = this.scene.add.graphics();
        this.add(this.switchBg);
    }

    setupText() {
        this.offText = this.scene.add.text(this.valueX + 15, 0, "OFF", { 
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '8px', fill: this.colors.ACCENT_STR 
        }).setOrigin(0.5);
        this.onText = this.scene.add.text(this.valueX + 65, 0, "ON", { 
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '8px', fill: this.colors.ACCENT_STR 
        }).setOrigin(0.5);
        this.add([this.offText, this.onText]);
    }

    setupHandle() {
        this.handle = this.scene.add.circle(0, 0, 14, this.colors.ACCENT);
        this.add(this.handle);
    }

    setupInput() {
        this.inputArea = this.scene.add.rectangle(this.valueX + 40, 0, 80, 30, 0, 0)
            .setInteractive({ useHandCursor: true });
        this.add(this.inputArea);

        this.inputArea.on('pointerup', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            this.toggle();
            AudioManager.playSFX(this.scene, ASSET_KEYS.AUDIO.SFX_BUTTON);
        });
    }

    toggle() {
        this.currentState = !this.currentState;
        this.drawSwitch(this.currentState);
        if (this.onChangeCallback) {
            this.onChangeCallback(this.currentState);
        }
    }

    drawSwitch(enabled) {
        this.switchBg.clear();
        this.switchBg.lineStyle(2, this.colors.ACCENT);
        this.switchBg.strokeRoundedRect(this.valueX, -15, 80, 30, 15);
        
        if (enabled) {
            this.switchBg.fillStyle(this.colors.ACCENT, 1);
            this.switchBg.fillRoundedRect(this.valueX, -15, 80, 30, 15);
            this.handle.setFillStyle(this.colors.PRIMARY);
            this.offText.setFill(CONFIG.COLORS.TEXT_DARK); 
            this.onText.setFill(CONFIG.COLORS.TEXT_DARK);
        } else {
            this.switchBg.fillStyle(0x000000, 1);
            this.switchBg.fillRoundedRect(this.valueX, -15, 80, 30, 15);
            this.handle.setFillStyle(this.colors.ACCENT);
            this.offText.setFill(this.colors.ACCENT_STR); 
            this.onText.setFill(this.colors.ACCENT_STR);
        }

        this.scene.tweens.killTweensOf(this.handle);
        this.scene.tweens.add({ 
            targets: this.handle, 
            x: enabled ? this.valueX + 65 : this.valueX + 15, 
            duration: 150
        });
    }

    // Método para refrescar los colores si el tema cambia
    refreshColors() {
        this.colors = CONFIG.THEME;
        this.drawSwitch(this.currentState);
    }
}
