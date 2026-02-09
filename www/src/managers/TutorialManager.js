import { DataManager } from '../managers/DataManager.js';
import { CONFIG } from '../data/config.js';

export class TutorialManager {
    constructor(scene) {
        this.scene = scene;
        this.tutorialContainer = null;
    }

    checkTutorial() {
        if (!DataManager.hasSeenTutorial()) {
            this.showTutorial();
        }
    }

    showTutorial() {
        const { width, height } = this.scene.scale;
        this.tutorialContainer = this.scene.add.container(0, 0).setDepth(3000);
        const overlay = this.scene.add.rectangle(0, 0, width, height, CONFIG.COLORS.BG_DARK, 0.8).setOrigin(0).setInteractive();
        const style = { fontFamily: CONFIG.FONTS.MAIN, fontSize: '18px', fill: CONFIG.COLORS.TEXT_MAIN, align: 'center', wordWrap: { width: width * 0.8 } };
        const text = this.scene.add.text(width/2, height * 0.4, "CHOOSE YOUR WEAPON\nBEFORE TIME RUNS OUT!", style).setOrigin(0.5);
        const btn = this.scene.add.container(width/2, height * 0.6);
        const bRect = this.scene.add.rectangle(0, 0, 200, 60, CONFIG.COLORS.P1_BLUE).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
        const bText = this.scene.add.text(0, 0, "GOT IT!", { fontFamily: CONFIG.FONTS.MAIN, fontSize: '16px' }).setOrigin(0.5);
        btn.add([bRect, bText]);
        bRect.on('pointerdown', async () => {
            await DataManager.setTutorialSeen(true);
            this.scene.tweens.add({ targets: this.tutorialContainer, alpha: 0, duration: 300, onComplete: () => this.tutorialContainer.destroy() });
        });
        this.tutorialContainer.add([overlay, text, btn]);
        const handEmoji = this.scene.add.text(width/2, height * 0.8, "👆", { fontSize: '60px' }).setOrigin(0.5);
        this.tutorialContainer.add(handEmoji);
        this.scene.tweens.add({ targets: handEmoji, y: '+=30', duration: 500, yoyo: true, repeat: -1 });
    }
}