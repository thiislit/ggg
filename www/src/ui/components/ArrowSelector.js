import { CONFIG } from '../../data/config.js';
import { AudioManager } from '../../managers/AudioManager.js';

/**
 * Componente Selector con flechas laterales.
 * Encapsula la lógica de navegación y el feedback visual.
 */
export class ArrowSelector extends Phaser.GameObjects.Container {
    constructor(scene, x, y, options = {}, callback) {
        super(scene, x, y);
        this.scene = scene;
        this.callback = callback;

        const {
            distance = 100, // Distancia entre flechas
            type = 'none', // 'circular', 'square', 'none'
            size = 100, // Tamaño del fondo
            color = CONFIG.THEME.PRIMARY,
            arrowSize = '38px',
        } = options;

        // 1. Dibujar Fondo (Si se requiere)
        if (type !== 'none') {
            this.bg = this.scene.add.graphics();
            this.bg.lineStyle(4, color, 0.8);
            this.bg.fillStyle(0x000000, 0.5);

            if (type === 'circular') {
                this.bg.fillCircle(0, 0, size / 2);
                this.bg.strokeCircle(0, 0, size / 2);
            } else if (type === 'square') {
                this.bg.fillRoundedRect(-size / 2, -size / 2, size, size, 15);
                this.bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 15);
            }
            this.add(this.bg);
        }

        // 2. Crear Flechas
        this.leftArrow = this.createArrow(-distance, '<', arrowSize);
        this.rightArrow = this.createArrow(distance, '>', arrowSize);

        this.add([this.leftArrow, this.rightArrow]);

        // Añadir este contenedor a la escena
        this.scene.add.existing(this);
    }

    createArrow(offsetX, char, fontSize) {
        const arrow = this.scene.add
            .text(offsetX, 0, char, {
                fontFamily: '"Press Start 2P"',
                fontSize: fontSize,
                fill: CONFIG.THEME.ACCENT_STR,
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Animación y Sonido al pulsar
        arrow.on('pointerdown', () => {
            AudioManager.playSFX(this.scene, 'sfx_button');
            this.scene.tweens.add({
                targets: arrow,
                scale: 1.3,
                duration: 80,
                yoyo: true,
            });
            if (this.callback) this.callback(char === '<' ? -1 : 1);
        });

        return arrow;
    }
}
