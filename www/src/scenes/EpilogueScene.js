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
            {
                char: 'ZORG',
                text: "This isn't over, terran! By the stars, I swear I will return!",
                type: 'zorg-speak',
                image: ASSET_KEYS.IMAGES.AVATAR_ZORG,
            },
            {
                char: 'PRINCESS',
                text: 'You did it, {PLAYER_NAME}! I knew you would save me! Thank you, thank you so much.',
                type: 'princess-speak',
                image: ASSET_KEYS.IMAGES.STORY_PRINCESS_1,
            },
            {
                char: 'PRINCESS',
                text: 'I knew you could do it. You took that creep down like it was nothing.',
                type: 'princess-speak',
                image: ASSET_KEYS.IMAGES.STORY_PRINCESS_2,
            },
            {
                char: 'PRINCESS',
                text: "My father's ship is almost here. Try not to get into too much trouble without me, okay?",
                type: 'princess-speak',
                image: ASSET_KEYS.IMAGES.STORY_PRINCESS_3,
            },
            { char: 'PRINCESS', text: '', type: 'kiss', image: ASSET_KEYS.IMAGES.STORY_PRINCESS_4 },
        ];
        this.currentStepIndex = 0;
        this.currentDialogueBox = null;
        this.isTyping = false;
        this.activeCharacter = null;
        this.endButton = null;
        this.heartTimer = null;
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
        this.zorg = this.add
            .image(width / 2, height * 0.45, ASSET_KEYS.IMAGES.AVATAR_ZORG)
            .setScale(CONFIG.UI.EPILOGUE.ZORG_SCALE)
            .setAlpha(0);

        this.princessImages = {
            [ASSET_KEYS.IMAGES.STORY_PRINCESS_1]: this.add
                .image(width / 2, height * 0.45, ASSET_KEYS.IMAGES.STORY_PRINCESS_1)
                .setScale(CONFIG.UI.EPILOGUE.PRINCESS_SCALE)
                .setAlpha(0),
            [ASSET_KEYS.IMAGES.STORY_PRINCESS_2]: this.add
                .image(width / 2, height * 0.45, ASSET_KEYS.IMAGES.STORY_PRINCESS_2)
                .setScale(CONFIG.UI.EPILOGUE.PRINCESS_SCALE)
                .setAlpha(0),
            [ASSET_KEYS.IMAGES.STORY_PRINCESS_3]: this.add
                .image(width / 2, height * 0.45, ASSET_KEYS.IMAGES.STORY_PRINCESS_3)
                .setScale(CONFIG.UI.EPILOGUE.PRINCESS_SCALE)
                .setAlpha(0),
            [ASSET_KEYS.IMAGES.STORY_PRINCESS_4]: this.add
                .image(width / 2, height * 0.45, ASSET_KEYS.IMAGES.STORY_PRINCESS_4)
                .setScale(CONFIG.UI.EPILOGUE.PRINCESS_SCALE)
                .setAlpha(0),
        };

        // 3. UI
        this.tapText = this.add
            .text(width / 2, height - 50, 'TAP TO CONTINUE ►', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: '14px',
                fill: '#ffffff',
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(3000);
        this.tweens.add({ targets: this.tapText, alpha: 1, duration: 500, yoyo: true, repeat: -1 });

        this.events.on('dialogue-typing-complete', () => {
            this.isTyping = false;
            this.tapText.setAlpha(1);
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.time.delayedCall(1000, () => this.showNextStep());
        this.input.on('pointerdown', () => this.handleInput());
    }

    startHeartRain() {
        if (this.heartTimer) return;
        this.heartTimer = this.time.addEvent({
            delay: 300,
            callback: () => {
                const { width, height } = this.scale;
                const heart = this.add.text(Phaser.Math.Between(0, width), -50, '❤️', {
                    fontSize: Phaser.Math.Between(20, 40) + 'px',
                });
                heart.setDepth(2000);
                this.tweens.add({
                    targets: heart,
                    y: height + 100,
                    x: heart.x + Phaser.Math.Between(-80, 80),
                    angle: 360,
                    alpha: { start: 1, end: 0 },
                    duration: Phaser.Math.Between(4000, 7000),
                    onComplete: () => heart.destroy(),
                });
            },
            loop: true,
        });
    }

    handleInput() {
        if (this.endButton) return;
        if (this.isTyping) {
            if (this.currentDialogueBox) this.currentDialogueBox.forceComplete();
        } else {
            this.showNextStep();
        }
    }

    async showNextStep() {
        this.tapText.setAlpha(0);
        if (this.currentDialogueBox) {
            const box = this.currentDialogueBox;
            this.currentDialogueBox = null;
            await box.hide();
        }

        if (this.currentStepIndex >= this.storySteps.length) {
            this.transitionToCredits();
            return;
        }

        const step = this.storySteps[this.currentStepIndex];

        if (this.currentStepIndex === 1) {
            this.startHeartRain();
        }

        let charImage;
        if (step.char === 'ZORG') charImage = this.zorg;
        else if (step.char === 'PRINCESS') charImage = this.princessImages[step.image];

        if (this.activeCharacter && this.activeCharacter !== charImage) {
            this.tweens.add({ targets: this.activeCharacter, alpha: 0, duration: 300 });
        }
        this.activeCharacter = charImage;
        if (this.activeCharacter) {
            this.tweens.add({ targets: this.activeCharacter, alpha: 1, duration: 500 });
        }

        this.currentStepIndex++;

        if (step.text) {
            let dialogueText = step.text.replace('{PLAYER_NAME}', DataManager.getName() || 'HERO');
            this.isTyping = true;
            this.currentDialogueBox = new DialogueBox(
                this,
                this.scale.width / 2,
                this.scale.height * 0.85,
                dialogueText,
                CONFIG.THEME.primary
            );
        } else {
            this.isTyping = false;
            this.tapText.setAlpha(1);
        }
    }

    transitionToCredits() {
        // Ocultar todo antes de la transición
        if (this.activeCharacter) this.activeCharacter.setAlpha(0);
        this.tapText.setAlpha(0);

        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.startCredits();
        });
    }

    startCredits() {
        const { width, height } = this.scale;

        // Fondo negro sólido
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setDepth(5000);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        const credits = [
            'RPS RETRO',
            '',
            'A GAME BY',
            'AXEL',
            '',
            'POWERED BY',
            'PHASER & CAPACITOR',
            '',
            'THANK YOU FOR PLAYING!',
        ];

        const creditsContainer = this.add.container(width / 2, height + 100).setDepth(6000);

        credits.forEach((line, i) => {
            const isTitle = i === 0 || i === credits.length - 1;
            const txt = this.add
                .text(0, i * 100, line, {
                    fontFamily: CONFIG.FONTS.MAIN,
                    fontSize: isTitle ? '28px' : '18px',
                    fill: isTitle ? CONFIG.COLORS.P1_BLUE : '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 6, // Borde negro grueso para evitar que las letras se intercalen
                    align: 'center',
                })
                .setOrigin(0.5);
            creditsContainer.add(txt);
        });

        this.tweens.add({
            targets: creditsContainer,
            y: -(credits.length * 110),
            duration: 18000, // Más lento aún para máxima legibilidad
            ease: 'Linear',
            onComplete: () => {
                this.endButton = new RetroButton(
                    this,
                    width / 2,
                    height / 2,
                    'MAIN MENU',
                    CONFIG.THEME.primary,
                    () => {
                        if (this.heartTimer) this.heartTimer.destroy();
                        this.scene.start('MainMenuScene');
                    }
                ).setDepth(7000);
            },
        });
    }
}
