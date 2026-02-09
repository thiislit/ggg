import { ASSET_KEYS } from '../constants/AssetKeys.js';
import { CONFIG } from '../data/config.js';
import { DataManager } from '../managers/DataManager.js';
import { DialogueBox } from '../ui/components/DialogueBox.js';
import { RetroButton } from '../ui/components/RetroButton.js';
import { AudioManager } from '../managers/AudioManager.js';

export class EpilogueScene extends Phaser.Scene {
    constructor() {
        super('EpilogueScene');
        this.storySteps = [
            { char: 'ZORG', text: "This isn't over, terran! By the stars, I swear I will return!", type: 'zorg-speak', image: ASSET_KEYS.IMAGES.AVATAR_ZORG },
            { char: 'PRINCESS', text: "You did it, {PLAYER_NAME}! I knew you would save me! Thank you, thank you so much.", type: 'princess-speak', image: ASSET_KEYS.IMAGES.STORY_PRINCESS_1 },
            { char: 'PRINCESS', text: "I knew you could do it. You took that creep down like it was nothing.", type: 'princess-speak', image: ASSET_KEYS.IMAGES.STORY_PRINCESS_2 },
            { char: 'PRINCESS', text: "My father's ship is almost here. Try not to get into too much trouble without me, okay?", type: 'princess-speak', image: ASSET_KEYS.IMAGES.STORY_PRINCESS_3 },
            { char: 'PRINCESS', text: "", type: 'kiss', image: ASSET_KEYS.IMAGES.STORY_PRINCESS_4 }
        ];
        this.currentStepIndex = 0;
        this.currentDialogueBox = null;
        this.isTyping = false;
        this.activeCharacter = null;
        this.endButton = null;
    }

    preload() {
        // Todos los assets se precargan globalmente en SplashScene.
    }

    create() {
        const { width, height } = this.scale;

        // 1. Iniciar música y fondo
        AudioManager.playMusic(this, ASSET_KEYS.AUDIO.MUSIC_BGM);
        const bgScene = this.scene.get('BackgroundScene');
        if (bgScene && bgScene.changeBackground) {
            bgScene.changeBackground(ASSET_KEYS.IMAGES.BG_CAMPAIGN_HARD);
        }
        
        // 2. Personajes
        this.zorg = this.add.image(width / 2, height * 0.4, ASSET_KEYS.IMAGES.AVATAR_ZORG).setScale(CONFIG.UI.EPILOGUE.ZORG_SCALE).setAlpha(0);
        
        this.princessImages = {
            [ASSET_KEYS.IMAGES.STORY_PRINCESS_1]: this.add.image(width / 2, height * 0.4, ASSET_KEYS.IMAGES.STORY_PRINCESS_1).setScale(CONFIG.UI.EPILOGUE.PRINCESS_SCALE).setAlpha(0),
            [ASSET_KEYS.IMAGES.STORY_PRINCESS_2]: this.add.image(width / 2, height * 0.4, ASSET_KEYS.IMAGES.STORY_PRINCESS_2).setScale(CONFIG.UI.EPILOGUE.PRINCESS_SCALE).setAlpha(0),
            [ASSET_KEYS.IMAGES.STORY_PRINCESS_3]: this.add.image(width / 2, height * 0.4, ASSET_KEYS.IMAGES.STORY_PRINCESS_3).setScale(CONFIG.UI.EPILOGUE.PRINCESS_SCALE).setAlpha(0),
            [ASSET_KEYS.IMAGES.STORY_PRINCESS_4]: this.add.image(width / 2, height * 0.4, ASSET_KEYS.IMAGES.STORY_PRINCESS_4).setScale(CONFIG.UI.EPILOGUE.PRINCESS_SCALE).setAlpha(0)
        };

        // 3. UI
        this.tapText = this.add.text(width / 2, height - 30, "TAP TO CONTINUE ►", {
            fontFamily: CONFIG.FONTS.MAIN, fontSize: '12px', fill: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: this.tapText, alpha: 1, duration: 500, yoyo: true, repeat: -1 });

        this.events.on('dialogue-typing-complete', () => {
            this.isTyping = false;
            this.tapText.setAlpha(1);
        });

        // 4. Iniciar secuencia
        this.time.delayedCall(1000, () => this.showNextStep());
        this.input.on('pointerdown', () => this.handleInput());
    }

    handleInput() {
        if (this.endButton) return; // No hacer nada si ya se mostró el botón final
        if (this.isTyping) {
            if (this.currentDialogueBox) this.currentDialogueBox.forceComplete();
        } else {
            this.showNextStep();
        }
    }

    async showNextStep() {
        this.tapText.setAlpha(0);

        if (this.currentDialogueBox) {
            await this.currentDialogueBox.hide();
            this.currentDialogueBox = null;
        }

        if (this.currentStepIndex >= this.storySteps.length) {
            this.showEndButton();
            return;
        }

        const step = this.storySteps[this.currentStepIndex];
        let charImage;

        if (step.char === 'ZORG') {
            charImage = this.zorg;
        } else if (step.char === 'PRINCESS') {
            charImage = this.princessImages[step.image];
        }

        if (this.activeCharacter && this.activeCharacter !== charImage) {
            this.tweens.add({ targets: this.activeCharacter, alpha: 0, duration: 300 });
        }
        this.activeCharacter = charImage;
        if (this.activeCharacter) {
            this.tweens.add({ targets: this.activeCharacter, alpha: 1, duration: 500 });
        }
        
        this.currentStepIndex++;

        if (step.text) {
            let dialogueText = step.text.replace('{PLAYER_NAME}', DataManager.getName() || "HERO");
            this.isTyping = true;
            this.currentDialogueBox = new DialogueBox(this, this.scale.width / 2, this.scale.height * 0.8, dialogueText, CONFIG.THEME.primary);
        } else if (step.type === 'kiss') {
            this.isTyping = false;
            this.tapText.setAlpha(1);
        }
    }

    showEndButton() {
        const { width, height } = this.scale;
        
        if (this.activeCharacter) {
            this.tweens.add({ targets: this.activeCharacter, alpha: 0, duration: 300 });
            this.activeCharacter = null;
        }

        this.endButton = new RetroButton(
            this, width / 2, height * 0.5, "MAIN MENU", CONFIG.THEME.primary,
            () => this.scene.start('MainMenuScene')
        );
    }
}