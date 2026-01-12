import { CONFIG } from '../../data/config.js';

/**
 * Componente de Burbuja de Diálogo con efecto máquina de escribir.
 */
export class DialogueBox extends Phaser.GameObjects.Container {
    constructor(scene, x, y, quote, color) {
        super(scene, x, y);
        this.scene = scene;
        this.quote = quote;
        this.color = color;

        this.init();
        this.scene.add.existing(this);
        this.setDepth(2500);
    }

    init() {
        const bubbleWidth = 220;
        const padding = 20;
        
        // Medir altura dinámicamente
        const measureText = this.scene.add.text(0, 0, this.quote, { 
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '12px', wordWrap: { width: bubbleWidth - padding } 
        }).setVisible(false);
        
        const bubbleHeight = Math.max(60, measureText.height + padding);
        measureText.destroy();

        // Fondo y Borde
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 10);
        bg.lineStyle(3, this.color, 1);
        bg.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 10);
        
        // Texto del contenido
        this.content = this.scene.add.text(0, 0, '', { 
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '12px', fill: '#ffffff', align: 'center', wordWrap: { width: bubbleWidth - padding } 
        }).setOrigin(0.5);

        this.add([bg, this.content]);
        this.setScale(0);
        
        // Animación de aparición
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => this.startTypewriter()
        });

        // Autodestrucción después de un tiempo
        this.scene.time.delayedCall(4000, () => {
            if (this.active) {
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    scale: 0.8,
                    duration: 300,
                    onComplete: () => this.destroy()
                });
            }
        });
    }

    startTypewriter() {
        let i = 0;
        this.scene.time.addEvent({
            callback: () => { 
                if (this.content && this.content.active) {
                    this.content.text += this.quote[i]; 
                    i++; 
                }
            },
            repeat: this.quote.length - 1, 
            delay: 50 
        });
    }
}
