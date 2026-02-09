import { CONFIG } from '../../data/config.js';
import { AudioManager } from '../../managers/AudioManager.js';
import { ASSET_KEYS } from '../../constants/AssetKeys.js';

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
        const bubbleWidth = 350; // Se mantiene local por ahora, podría moverse a CONFIG.UI si se usa en más sitios
        const padding = 20; // Se mantiene local por ahora

        this.typingTimer = null; // Para poder cancelarlo

        // Medir altura dinámicamente
        const measureText = this.scene.add.text(0, 0, this.quote, { 
            fontFamily: CONFIG.FONTS.MAIN, 
            fontSize: CONFIG.UI.DIALOGUE_BOX.FONT_SIZE, 
            wordWrap: { width: bubbleWidth - (padding * 2) }, 
            lineSpacing: CONFIG.UI.DIALOGUE_BOX.LINE_SPACING
        }).setVisible(false);
        
        const bubbleHeight = Math.max(80, measureText.height + (padding * 2));
        measureText.destroy();

        // Fondo y Borde
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, CONFIG.UI.DIALOGUE_BOX.RADIUS);
        bg.lineStyle(3, this.color, 1);
        bg.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, CONFIG.UI.DIALOGUE_BOX.RADIUS);
        
        // Texto del contenido
        this.content = this.scene.add.text(0, 0, '', { 
            fontFamily: CONFIG.FONTS.MAIN, 
            fontSize: CONFIG.UI.DIALOGUE_BOX.FONT_SIZE, 
            fill: '#ffffff', 
            align: 'center', 
            wordWrap: { width: bubbleWidth - (padding * 2) }, 
            lineSpacing: CONFIG.UI.DIALOGUE_BOX.LINE_SPACING
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
    }

    startTypewriter() {
        let i = 0;
        if (this.typingTimer) this.typingTimer.remove();

        this.typingTimer = this.scene.time.addEvent({
            callback: () => { 
                if (!this.content || !this.content.active) {
                    this.typingTimer.remove();
                    return;
                }
                this.content.text += this.quote[i];
                
                // Reproducir sonido de escritura
                AudioManager.playSFX(this.scene, ASSET_KEYS.AUDIO.STORY_SFX_TYPE, {
                    volume: 0.3,
                    detune: Math.random() * 200 - 100
                });

                i++;
                if (i === this.quote.length) {
                    this.scene.events.emit('dialogue-typing-complete');
                }
            },
            repeat: this.quote.length - 1, 
            delay: 100 
        });
    }

    forceComplete() {
        if (this.typingTimer) {
            this.typingTimer.remove();
        }
        if (this.content) {
            this.content.setText(this.quote);
        }
        // Emitir el evento para que la escena sepa que puede continuar
        this.scene.events.emit('dialogue-typing-complete');
    }

    hide() {
        if (this.typingTimer) {
            this.typingTimer.remove();
        }
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                scale: 0.8,
                duration: 300,
                onComplete: () => {
                    this.destroy();
                    resolve();
                }
            });
        });
    }
}
