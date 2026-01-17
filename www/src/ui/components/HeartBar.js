import { CONFIG } from '../../data/config.js';

/**
 * Componente de Barra de Vida (Corazones) - Versión Optimizada
 */
export class HeartBar extends Phaser.GameObjects.Container {
    constructor(scene, x, y, maxHealth = 3) {
        super(scene, x, y);
        this.scene = scene;
        this.maxHealth = maxHealth;
        this.hearts = [];

        this.HEART_RED = 0xff0000;
        this.HEART_EMPTY = 0x333333;

        this.init();
        this.scene.add.existing(this);
        this.setDepth(1500); // Profundidad máxima para asegurar visibilidad
    }

    init() {
        const spacing = 40;
        const totalWidth = (this.maxHealth - 1) * spacing;
        const startX = -(totalWidth / 2);

        for (let i = 0; i < this.maxHealth; i++) {
            const gfx = this.scene.add.graphics();
            // Dibujamos en (0,0) relativo al objeto gráfico, pero el objeto gráfico se posiciona en startX
            gfx.setPosition(startX + (i * spacing), 0);
            
            this.drawHeartShape(gfx, this.HEART_RED, 0xffffff);
            
            this.add(gfx);
            this.hearts.push(gfx);

            // Animación de latido
            this.scene.tweens.add({
                targets: gfx,
                scale: 1.15,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 150
            });
        }
    }

    drawHeartShape(gfx, fillColor, strokeColor) {
        const size = 8; 
        gfx.clear();
        gfx.fillStyle(fillColor, 1);
        gfx.lineStyle(2, strokeColor, 1);
        
        // Dibujar forma de corazón centrada en (0,0)
        gfx.fillCircle(-size, -size/2, size);
        gfx.strokeCircle(-size, -size/2, size);
        gfx.fillCircle(size, -size/2, size);
        gfx.strokeCircle(size, -size/2, size);
        
        gfx.beginPath();
        gfx.moveTo(-size*2, -size/2);
        gfx.lineTo(0, size*2.5);
        gfx.lineTo(size*2, -size/2);
        gfx.fillPath();
        
        gfx.beginPath();
        const offset = size * 0.9;
        gfx.moveTo(-size - offset, -size/2 + (size*0.5)); 
        gfx.lineTo(0, size*2.5);
        gfx.lineTo(size + offset, -size/2 + (size*0.5));
        gfx.strokePath();
    }

    updateLives(lives) {
        this.hearts.forEach((gfx, index) => {
            if (index < lives) {
                this.drawHeartShape(gfx, this.HEART_RED, 0xffffff);
                gfx.setAlpha(1);
            } 
            else {
                if (gfx.alpha > 0.5) {
                    this.scene.tweens.add({
                        targets: gfx,
                        y: -20,
                        scale: 1.5,
                        duration: 200,
                        yoyo: true,
                        onComplete: () => {
                            gfx.setAlpha(0.3);
                            this.drawHeartShape(gfx, this.HEART_EMPTY, 0x666666);
                        }
                    });
                } else {
                    gfx.setAlpha(0.3);
                    this.drawHeartShape(gfx, this.HEART_EMPTY, 0x666666);
                }
            }
        });
    }
}