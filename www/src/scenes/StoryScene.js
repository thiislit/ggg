import { CONFIG } from '../data/config.js';
import { AudioManager } from '../managers/AudioManager.js';
import { DataManager } from '../managers/DataManager.js';
import { ASSET_KEYS } from '../constants/AssetKeys.js';

export class StoryScene extends Phaser.Scene {
    constructor() {
        super('StoryScene');
        // Secuencia narrativa
        this.storySteps = [
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL,
                text: "INCOMING TRANSMISSION...\nIs anyone there? Do you copy?",
                delay: 50
            },
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL,
                text: "My name is Captain Robert. I'm transmitting on all emergency frequencies.",
                delay: 50
            },
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL,
                text: "I am currently stranded at coordinates: SECTOR 7-G / NEBULA-9. Fuel is depleted.",
                delay: 50
            },
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL,
                text: "Wait... the signal is getting stronger. Someone IS listening. Thank the stars.",
                delay: 50
            },
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL,
                text: "I can feel your connection, {PLAYER_NAME}. It gives me hope in this darkness.",
                delay: 50
            },
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_SAD,
                text: "Thank you for answering my signal. You don't know how much this means to me.",
                delay: 50
            },
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL,
                text: "But there is no time. Zorg... he has my daughter. He took her to the Dark Sector.",
                delay: 50
            },
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL,
                text: "He is strong, but you... I sense you can defeat him in the ancient duel.",
                delay: 50
            },
            {
                image: ASSET_KEYS.IMAGES.STORY_ROBERT_SMILE,
                text: "Please, save her. Good luck, pilot. Over and out.",
                delay: 50
            }
        ];
        this.currentStep = 0;
        this.isTyping = false;
    }

    init(data) {
        this.resumeGame = data && data.resume ? true : false;
    }

    preload() {
        this.load.path = 'assets/story/';
        this.load.image(ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL, 'robert_normal.png');
        this.load.image(ASSET_KEYS.IMAGES.STORY_ROBERT_SAD, 'robert_sad.png');
        this.load.image(ASSET_KEYS.IMAGES.STORY_ROBERT_SMILE, 'robert_smile.png');
        this.load.image(ASSET_KEYS.IMAGES.STORY_BG, 'galaxiabackground.png');
        
        // Cargar sonidos de la historia
        this.load.audio(ASSET_KEYS.AUDIO.STORY_SFX_SIGNAL, 'captandosenal.mp3');
        this.load.audio(ASSET_KEYS.AUDIO.STORY_SFX_TYPE, 'sonidoletras.mp3');
        this.load.audio(ASSET_KEYS.AUDIO.STORY_SFX_GALAXY, 'sonidogalaxia.mp3');
        this.load.audio(ASSET_KEYS.AUDIO.STORY_SFX_END, 'sonidofindetransmicion.mp3');
        
        this.load.spritesheet(ASSET_KEYS.SPRITESHEETS.STORY_GALAXY_ANIM, 'galaxy_bg.png', {
            frameWidth: 100,
            frameHeight: 100,
            startFrame: 0,
            endFrame: 399,
            margin: 5,
            spacing: 5
        });
    }

    create() {
        const { width, height } = this.scale;

        // Iniciar música de fondo de la historia
        AudioManager.playMusic(this, ASSET_KEYS.AUDIO.STORY_BGM, { volume: 0.4 });

        // Reproducir sonido de buscando señal (solo al inicio real, no en resume)
        if (!this.resumeGame) {
            AudioManager.playSFX(this, ASSET_KEYS.AUDIO.STORY_SFX_SIGNAL, { volume: 0.6 });
        }

        // Crear animación de galaxia
        if (this.textures.exists(ASSET_KEYS.SPRITESHEETS.STORY_GALAXY_ANIM) && !this.anims.exists(ASSET_KEYS.ANIMATIONS.GALAXY_SPIN)) {
            this.anims.create({
                key: ASSET_KEYS.ANIMATIONS.GALAXY_SPIN,
                frames: this.anims.generateFrameNumbers(ASSET_KEYS.SPRITESHEETS.STORY_GALAXY_ANIM, { start: 0, end: 399 }),
                frameRate: 15,
                repeat: -1
            });
        }

        // 0. Fondo Base Estático
        this.mainBg = this.add.image(width/2, height/2, ASSET_KEYS.IMAGES.STORY_BG)
            .setDisplaySize(width, height)
            .setAlpha(0.6);

        this.tweens.add({
            targets: this.mainBg,
            scale: 1.1,
            duration: 20000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Sprite de Galaxia (Oculto al inicio)
        this.galaxy = this.add.sprite(width/2, height/2, ASSET_KEYS.SPRITESHEETS.STORY_GALAXY_ANIM).setAlpha(0);
        this.galaxy.setScale(8);
        
        if (this.anims.exists(ASSET_KEYS.ANIMATIONS.GALAXY_SPIN)) {
            this.galaxy.play(ASSET_KEYS.ANIMATIONS.GALAXY_SPIN);
        } else {
            console.warn('Animation galaxy_spin missing, showing static frame.');
        }

        this.createScanlines(width, height);

        // 2. Personaje (Robert)
        this.robert = this.add.image(width / 2, height * 0.35, ASSET_KEYS.IMAGES.STORY_ROBERT_NORMAL);
        const maxW = width * 0.8;
        const scale = maxW / this.robert.width;
        this.robert.setScale(scale > 1 ? 1 : scale);
        
        this.robert.setAlpha(0);
        this.robert.setTint(0x88ccff);

        this.startHologramEffect();

        // 3. Caja de Texto
        const boxHeight = height * 0.3;
        this.textBox = this.add.container(width / 2, height - (boxHeight / 2) - 20);
        
        const bgBox = this.add.rectangle(0, 0, width * 0.9, boxHeight, 0x000000, 0.8)
            .setStrokeStyle(4, CONFIG.COLORS.P1_BLUE);
        
        this.textObject = this.add.text(-width * 0.42, -boxHeight * 0.4, '', {
            fontFamily: CONFIG.FONTS.MAIN,
            fontSize: '24px',
            fill: '#00ff00',
            wordWrap: { width: width * 0.84 },
            lineSpacing: 12
        });
        
        // Asegurar limpieza total
        this.textObject.setText('');

        this.textBox.add([bgBox, this.textObject]);
        this.textBox.setAlpha(0);

        this.tapText = this.add.text(width / 2, height - 30, "TAP TO CONTINUE ►", {
            fontFamily: CONFIG.FONTS.MAIN,
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: this.tapText, alpha: 1, duration: 500, yoyo: true, repeat: -1 });

        // --- INICIO DE LA SECUENCIA ---
        this.time.delayedCall(1000, () => {
            this.textBox.setAlpha(1);
            
            // SI VENIMOS DE RESUME, SALTAMOS AL PASO 4
            if (this.resumeGame) {
                this.robert.setAlpha(1);
                this.startHologramEffect();
                this.showStep(4);
            } else {
                this.showStep(0);
            }
        });

        this.input.on('pointerdown', () => this.handleInput());
    }

    startHologramEffect() {
        this.tweens.killTweensOf(this.robert);
        this.tweens.add({
            targets: this.robert,
            alpha: { from: 0.8, to: 1 },
            y: '+=10',
            duration: 2000,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });
    }

    createScanlines(width, height) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.1);
        for (let y = 0; y < height; y += 4) {
            graphics.fillRect(0, y, width, 2);
        }
        graphics.setDepth(1000);
    }

    handleInput() {
        if (this.isTyping) {
            this.forceCompleteText();
        } else {
            this.nextStep();
        }
    }

    showStep(index) {
        if (index === 4 && !this.resumeGame) {
            this.scene.start('ProfileScene', { fromStory: true });
            return;
        }

        if (index >= this.storySteps.length) {
            this.finishStory();
            return;
        }

        const step = this.storySteps[index];
        this.currentStep = index;
        
        // --- LÓGICA DE TRANSICIONES VISUALES ---
        
        if (index === 2) { 
            // PASO 2: MOSTRAR GALAXIA
            this.tweens.killTweensOf(this.robert);
            this.tweens.add({ targets: this.robert, alpha: 0, duration: 1000 });
            this.tweens.add({ targets: this.galaxy, alpha: 0.8, scale: 10, duration: 3500, ease: 'Cubic.easeOut' });
            
            // REPRODUCIR SONIDO GALAXIA
            AudioManager.playSFX(this, ASSET_KEYS.AUDIO.STORY_SFX_GALAXY, { volume: 1.0 });
            
        } else if (index === 3) {
            // PASO 3: REGRESA ROBERT
            this.tweens.add({ targets: this.galaxy, alpha: 0, duration: 1000 });
            
            this.robert.setAlpha(0);
            this.tweens.add({
                targets: this.robert,
                alpha: 1,
                duration: 1000,
                delay: 500,
                onComplete: () => this.startHologramEffect()
            });
        }

        // Cambiar Imagen de Robert
        if (this.robert.texture.key !== step.image && index !== 2) {
            this.doGlitchEffect(() => {
                this.robert.setTexture(step.image);
            });
        }

        // PREPARAR TEXTO
        let finalText = step.text;
        if (finalText.includes('{PLAYER_NAME}')) {
             const realName = DataManager.getName();
             finalText = finalText.replace('{PLAYER_NAME}', realName);
        }

        this.typeText(finalText);
    }

    doGlitchEffect(callback) {
        this.tweens.add({
            targets: this.robert,
            alpha: 0.2,
            x: '+=10',
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.robert.x = this.scale.width / 2;
                this.robert.alpha = 1;
                if (callback) callback();
            }
        });
        AudioManager.playSFX(this, ASSET_KEYS.AUDIO.SFX_BUTTON, { volume: 0.5 });
    }

    typeText(fullText) {
        if (this.typingTimer) {
            this.typingTimer.remove();
            this.typingTimer = null;
        }

        this.isTyping = true;
        this.textObject.setText('');
        this.tapText.setVisible(false);
        
        let i = 0;
        let charCount = 0;
        
        const typeNext = () => {
            if (i >= fullText.length) {
                this.isTyping = false;
                this.tapText.setVisible(true);
                this.typingTimer = null;
                return;
            }

            const char = fullText[i];
            this.textObject.text += char;
            i++;
            charCount++;

            // Reproducir sonido cada 3 letras para no saturar
            if (charCount % 3 === 0 && char !== ' ') {
                AudioManager.playSFX(this, ASSET_KEYS.AUDIO.STORY_SFX_TYPE, {
                    volume: 0.3,
                    detune: Math.random() * 200 - 100
                });
            }

            // Calcular retraso
            let delay = 55;
            
            if (Math.random() < 0.12) {
                delay += 250;
            }

            if (char === '.' || char === '?' || char === '!') {
                delay = 450;
            } else if (char === ',') {
                delay = 200;
            }

            this.typingTimer = this.time.delayedCall(delay, typeNext);
        };

        typeNext();
    }

    forceCompleteText() {
        if (this.typingTimer) {
            this.typingTimer.remove();
            this.typingTimer = null;
        }
        
        const step = this.storySteps[this.currentStep];
        
        let finalText = step.text;
        if (finalText.includes('{PLAYER_NAME}')) {
             const realName = DataManager.getName();
             finalText = finalText.replace('{PLAYER_NAME}', realName);
        }
        
        this.textObject.setText(finalText);
        this.isTyping = false;
        this.tapText.setVisible(true);
    }

    nextStep() {
        this.showStep(this.currentStep + 1);
    }

    async finishStory() {
        await DataManager.setIntroSeen(true);
        
        // Sonido de desconexión final
        AudioManager.playSFX(this, ASSET_KEYS.AUDIO.STORY_SFX_END, { volume: 0.8 });

        this.tweens.add({
            targets: [this.robert, this.textBox, this.mainBg, this.galaxy],
            scaleY: 0.01,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.scene.start('MainMenuScene');
            }
        });
    }
}