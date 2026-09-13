import { CONFIG } from '../../data/config.js';
import { AudioManager } from '../../managers/AudioManager.js';
import { ASSET_KEYS } from '../../constants/AssetKeys.js';

/**
 * Dialogue Bubble component with typewriter effect.
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
        const bubbleWidth = 220; // Adjusted to match avatar frame width (220px)
        const padding = 15; // Slightly reduced to better utilize space

        this.typingTimer = null; // Can be canceled

        // Dynamically measure height
        const measureText = this.scene.add
            .text(0, 0, this.quote, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.UI.DIALOGUE_BOX.FONT_SIZE,
                wordWrap: { width: bubbleWidth - padding * 2 },
                lineSpacing: CONFIG.UI.DIALOGUE_BOX.LINE_SPACING,
            })
            .setVisible(false);

        const bubbleHeight = Math.max(80, measureText.height + padding * 2);
        measureText.destroy();

        // Background and Border
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRoundedRect(
            -bubbleWidth / 2,
            -bubbleHeight / 2,
            bubbleWidth,
            bubbleHeight,
            CONFIG.UI.DIALOGUE_BOX.RADIUS
        );
        bg.lineStyle(3, this.color, 1);
        bg.strokeRoundedRect(
            -bubbleWidth / 2,
            -bubbleHeight / 2,
            bubbleWidth,
            bubbleHeight,
            CONFIG.UI.DIALOGUE_BOX.RADIUS
        );

        // Content Text
        this.content = this.scene.add
            .text(0, 0, '', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.UI.DIALOGUE_BOX.FONT_SIZE,
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: bubbleWidth - padding * 2 },
                lineSpacing: CONFIG.UI.DIALOGUE_BOX.LINE_SPACING,
            })
            .setOrigin(0.5);

        this.add([bg, this.content]);
        this.setScale(0);

        // Pop-in animation
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => this.startTypewriter(),
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

                // Play typing sound using global SFX volume
                AudioManager.playSFX(this.scene, ASSET_KEYS.AUDIO.STORY_SFX_TYPE, {
                    detune: Math.random() * 200 - 100,
                });

                i++;
                if (i === this.quote.length) {
                    this.scene.events.emit('dialogue-typing-complete');
                    // Auto-hide after a delay to prevent stacking
                    this.scene.time.delayedCall(3000, () => {
                        if (this.active) this.hide();
                    });
                }
            },
            repeat: this.quote.length - 1,
            delay: 100,
        });
    }

    forceComplete() {
        if (this.typingTimer) {
            this.typingTimer.remove();
        }
        if (this.content) {
            this.content.setText(this.quote);
        }
        // Emit event so scene knows it can proceed
        this.scene.events.emit('dialogue-typing-complete');
    }

    hide() {
        if (this.isHiding) return Promise.resolve();
        this.isHiding = true;

        if (this.typingTimer) {
            this.typingTimer.remove();
        }
        return new Promise((resolve) => {
            if (!this.scene || !this.scene.tweens) {
                this.destroy();
                resolve();
                return;
            }
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                scale: 0.8,
                duration: 300,
                onComplete: () => {
                    this.destroy();
                    resolve();
                },
            });
        });
    }
}
