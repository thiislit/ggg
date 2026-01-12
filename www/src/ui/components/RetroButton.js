import { CONFIG } from '../../data/config.js';
import { AudioManager } from '../../managers/AudioManager.js';

/**
 * Componente de Botón Retro Reutilizable
 * Encapsula visual, animación y sonido en un solo objeto.
 */
export class RetroButton extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text, color, callback, scale = 1) {
        super(scene, x, y);
        this.scene = scene;
        this.callback = callback;
        this.setScale(scale);

        // --- 1. HALO DE RESPLANDOR (GLOW) ---
        this.glow = this.scene.add.graphics();
        this.glow.fillStyle(0xffffff, 0.3);
        this.glow.fillRoundedRect(-160, -40, 320, 80, 20);
        this.glow.alpha = 0;
        
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- 2. FONDO DEL BOTÓN ---
        this.bg = this.scene.add.graphics();
        this.drawBackground(color);

        // --- 3. TEXTO ---
        this.label = this.scene.add.text(0, 0, text, {
            fontFamily: CONFIG.FONTS.MAIN,
            fontSize: '18px',
            fill: '#000000'
        }).setOrigin(0.5);

        // --- 4. ÁREA INTERACTIVA ---
        // Definimos un rectángulo invisible para los clics
        const hitArea = new Phaser.Geom.Rectangle(-150, -35, 300, 70);
        this.bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Añadir elementos al contenedor en orden
        this.add([this.glow, this.bg, this.label]);

        // --- 5. EVENTOS ---
        this.bg.on('pointerdown', () => this.onDown());
        this.bg.on('pointerup', () => this.onUp());
        this.bg.on('pointerover', () => this.onHover(true));
        this.bg.on('pointerout', () => this.onHover(false));

        // Añadir este componente a la escena y darle profundidad base
        this.scene.add.existing(this);
        this.setDepth(10);
    }

    drawBackground(color) {
        this.bg.clear();
        this.bg.fillStyle(color, 1);
        this.bg.fillRoundedRect(-150, -35, 300, 70, CONFIG.UI.BUTTON_RADIUS);
        this.bg.lineStyle(CONFIG.UI.BORDER_WIDTH, 0xffffff, 1);
        this.bg.strokeRoundedRect(-150, -35, 300, 70, CONFIG.UI.BUTTON_RADIUS);
    }

    onDown() {
        AudioManager.playSFX(this.scene, 'sfx_button');
        if (navigator.vibrate) navigator.vibrate(20);
        
        this.scene.tweens.add({
            targets: this,
            scale: 0.95,
            duration: CONFIG.TIMING.BUTTON_BOUNCE,
            yoyo: true
        });
    }

    onUp() {
        // Pequeño retardo para que se vea la animación antes de ejecutar el callback
        this.scene.time.delayedCall(150, () => {
            if (this.callback) this.callback();
        });
    }

    onHover(isOver) {
        this.scene.tweens.add({
            targets: this.glow,
            alpha: isOver ? 0.9 : 0.6,
            duration: 200
        });
    }

    // Método para cambiar el texto dinámicamente
    setText(newText) {
        this.label.setText(newText);
    }

    // Método para cambiar el color (útil para temas)
    setColor(newColor) {
        this.drawBackground(newColor);
    }
}
