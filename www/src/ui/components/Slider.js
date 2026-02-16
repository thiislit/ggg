import { CONFIG } from '../../data/config.js';

export class Slider extends Phaser.GameObjects.Container {
    /**
     * Componente de slider horizontal.
     * @param {Phaser.Scene} scene La escena a la que pertenece este slider.
     * @param {number} x La posición X del slider.
     * @param {number} y La posición Y del slider.
     * @param {number} width El ancho del track del slider.
     * @param {number} initialValue El valor inicial del slider (entre 0 y 1).
     * @param {function(number):void} onChangeCallback La función a llamar cuando el valor del slider cambia.
     */
    constructor(scene, x, y, width, initialValue, onChangeCallback) {
        super(scene, x, y);

        this.scene = scene;
        this.sliderWidth = width;
        this.value = initialValue;
        this.onChangeCallback = onChangeCallback;

        this.colors = CONFIG.THEME;

        this.setupTrack();
        this.setupHandle();
        this.setupInput();

        this.updateHandlePosition();

        this.scene.add.existing(this);
    }

    setupTrack() {
        this.track = this.scene.add.rectangle(0, 0, this.sliderWidth, 10, 0x444444).setOrigin(0.5);
        this.add(this.track);
    }

    setupHandle() {
        this.handle = this.scene.add
            .circle(0, 0, 15, this.colors.PRIMARY)
            .setInteractive({ draggable: true, useHandCursor: true });
        this.add(this.handle);
    }

    setupInput() {
        this.handle.on('drag', (pointer, dragX) => {
            const minX = -this.sliderWidth / 2;
            const maxX = this.sliderWidth / 2;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

            this.handle.x = clampedX;
            this.value = (clampedX - minX) / this.sliderWidth;

            if (this.onChangeCallback) {
                this.onChangeCallback(this.value);
            }
        });
    }

    updateHandlePosition() {
        const minX = -this.sliderWidth / 2;
        this.handle.x = minX + this.value * this.sliderWidth;
    }

    // Método para refrescar los colores si el tema cambia
    refreshColors() {
        this.colors = CONFIG.THEME;
        this.handle.setFillStyle(this.colors.PRIMARY);
    }
}
