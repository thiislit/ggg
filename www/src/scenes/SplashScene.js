import { CONFIG } from '../data/config.js';
import { AudioManager } from '../managers/AudioManager.js';
import { ASSETS } from '../data/AssetManifest.js';
import { ASSET_KEYS } from '../constants/AssetKeys.js';
import { DataManager } from '../managers/DataManager.js';
import { CampaignManager } from '../managers/CampaignManager.js';
import { RetroButton } from '../ui/components/RetroButton.js';

export class SplashScene extends Phaser.Scene {
    constructor() {
        super('SplashScene');
    }

    preload() {
        const { width, height } = this.scale;

        // --- TÍTULO (Durante Carga) ---
        this.tempTitle = this.createRingTitle(width / 2, height * 0.3);

        // --- BARRA DE CARGA RETRO-ESTILIZADA ---
        const progressBarWidth = 320;
        const progressBarHeight = 24;
        const x = width / 2 - progressBarWidth / 2;
        const y = height / 2 + 100;

        // Fondo de la barra (Marco pixelado)
        const progressBox = this.add.graphics();
        progressBox.lineStyle(4, 0x555555, 1);
        progressBox.strokeRect(x, y, progressBarWidth, progressBarHeight);
        progressBox.fillStyle(0x000000, 0.8);
        progressBox.fillRect(x, y, progressBarWidth, progressBarHeight);

        const progressBar = this.add.graphics();

        this.load.on('progress', (value) => {
            progressBar.clear();

            // Color de la barra (Cian neón estilo retro)
            progressBar.fillStyle(CONFIG.COLORS.P1_BLUE, 1);

            // Dibujar barra segmentada (estilo bloques)
            const padding = 4;
            const fullWidth = (progressBarWidth - padding * 2) * value;
            const segmentWidth = 10;
            const numSegments = Math.floor(fullWidth / segmentWidth);

            for (let i = 0; i < numSegments; i++) {
                progressBar.fillRect(
                    x + padding + i * segmentWidth,
                    y + padding,
                    segmentWidth - 2,
                    progressBarHeight - padding * 2
                );
            }
        });

        this.load.on('complete', () => {
            this.time.delayedCall(500, () => {
                this.tweens.add({
                    targets: [progressBar, progressBox],
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        progressBar.destroy();
                        progressBox.destroy();
                    },
                });
            });
        });

        // --- CARGA DINÁMICA DESDE MANIFIESTO ---

        // 1. Scripts externos
        this.load.script(
            'webfont',
            'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js'
        );

        // 2. Audio (SFX, Música, Fatalities, etc.)
        Object.values(ASSETS.AUDIO)
            .flat()
            .forEach((audio) => {
                this.load.audio(audio.key, audio.path);
            });

        // 3. Imágenes (Fondos, Avatares)
        Object.values(ASSETS.IMAGES)
            .flat()
            .forEach((img) => {
                this.load.image(img.key, img.path);
            });

        // 4. Spritesheets
        ASSETS.SPRITESHEETS.forEach((sheet) => {
            this.load.spritesheet(sheet.key, sheet.path, sheet.config);
        });
    }

    async create() {
        // Inicializar todos los datos del juego desde el almacenamiento
        await DataManager.init();

        // Inicializar tema de colores antes de que nada se dibuje
        const savedBg = DataManager.getBgTheme();
        CONFIG.THEME.setFromPalette(savedBg);

        // Inicializar estado de Mute
        this.sound.mute = DataManager.isMuted();

        // Inicializar gestor de audio
        await AudioManager.init(this);

        // Iniciar el fondo animado en paralelo
        this.scene.launch('BackgroundScene');
        this.scene.sendToBack('BackgroundScene');
        this.scene.bringToTop();

        // --- SAFE AREA DETECTION ---
        if (window.Capacitor && window.Capacitor.Plugins.SafeArea) {
            window.Capacitor.Plugins.SafeArea.getSafeAreaInsets()
                .then(({ insets }) => {
                    this.game.registry.set('safeTop', insets.top);
                    this.game.registry.set('safeBottom', insets.bottom);
                    console.warn('Safe Area detected:', insets);
                })
                .catch(() => {
                    this.game.registry.set('safeTop', 0);
                    this.game.registry.set('safeBottom', 0);
                });
        } else {
            this.game.registry.set('safeTop', 0);
            this.game.registry.set('safeBottom', 0);
        }

        this.sound.pauseOnBlur = false;

        const unlockAudio = () => {
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }

            // Lógica inteligente: Solo reproducir si estamos en escenas que permiten música
            // const activeKey = this.scene.key; // SplashScene
            // O podemos chequear el Manager de escenas global
            const currentScenes = this.game.scene.getScenes(true);
            const isStoryActive = currentScenes.some((s) => s.scene.key === 'StoryScene');
            const isProfileActive = currentScenes.some((s) => s.scene.key === 'ProfileScene');

            if (!isStoryActive && !isProfileActive) {
                if (
                    !this.sound.get(ASSET_KEYS.AUDIO.MUSIC_BGM) ||
                    !this.sound.get(ASSET_KEYS.AUDIO.MUSIC_BGM).isPlaying
                ) {
                    AudioManager.playMusic(this, ASSET_KEYS.AUDIO.MUSIC_BGM);
                }
            }

            removeAudioListeners();
        };

        const removeAudioListeners = () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        // Limpieza obligatoria al salir de la escena
        this.events.once('shutdown', removeAudioListeners);

        // --- AUTO-JUMP DEBUG LOGIC ---
        const urlParams = new URLSearchParams(window.location.search);

        // MODO RESET (Para desarrollo)
        if (urlParams.has('reset')) {
            console.warn('RESETTING GAME DATA...');
            DataManager.clear();
            // O simplemente continuar como usuario nuevo:
        }

        // --- CREAR ANIMACIONES GLOBALES ---
        const allAnims = [
            {
                key: ASSET_KEYS.ANIMATIONS.ANIM_EARTH,
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_TIERRA,
                endFrame: 399,
            },
            {
                key: ASSET_KEYS.ANIMATIONS.ANIM_MARS,
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_MARS,
                endFrame: 399,
            },
            {
                key: ASSET_KEYS.ANIMATIONS.ANIM_KEPLER,
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_KEPLER,
                endFrame: 399,
            },
            {
                key: ASSET_KEYS.ANIMATIONS.ANIM_NEBULA,
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_NEBULA,
                endFrame: 399,
            },
            {
                key: ASSET_KEYS.ANIMATIONS.ANIM_ZORG_PLANET,
                texture: ASSET_KEYS.SPRITESHEETS.PLANET_ZORG,
                endFrame: 399,
            },
            {
                key: ASSET_KEYS.ANIMATIONS.ANIM_CAMPAIGN_STAR,
                texture: ASSET_KEYS.SPRITESHEETS.CAMPAIGN_STAR,
                endFrame: 99,
                frameRate: 20,
            },
            {
                key: ASSET_KEYS.ANIMATIONS.ANIM_CAMPAIGN_GALAXY_PURPLE,
                texture: ASSET_KEYS.SPRITESHEETS.CAMPAIGN_GALAXY_PURPLE,
                endFrame: 399,
                frameRate: 20,
            },
            {
                key: ASSET_KEYS.ANIMATIONS.ANIM_CAMPAIGN_BLACKHOLE,
                texture: ASSET_KEYS.SPRITESHEETS.CAMPAIGN_BLACKHOLE,
                endFrame: 224,
                frameRate: 15,
            },
            {
                key: ASSET_KEYS.ANIMATIONS.GALAXY_SPIN,
                texture: ASSET_KEYS.SPRITESHEETS.STORY_GALAXY_ANIM,
                endFrame: 399,
            },
        ];

        allAnims.forEach((anim) => {
            if (!this.anims.exists(anim.key)) {
                this.anims.create({
                    key: anim.key,
                    frames: this.anims.generateFrameNumbers(anim.texture, {
                        start: 0,
                        end: anim.endFrame,
                    }),
                    frameRate: anim.frameRate || 15,
                    repeat: -1,
                });
            }
        });

        // Mantener planet_rotate como alias para Earth por compatibilidad
        if (!this.anims.exists(ASSET_KEYS.ANIMATIONS.PLANET_ROTATE)) {
            this.anims.create({
                key: ASSET_KEYS.ANIMATIONS.PLANET_ROTATE,
                frames: this.anims.generateFrameNumbers(ASSET_KEYS.SPRITESHEETS.PLANET_TIERRA, {
                    start: 0,
                    end: 399,
                }),
                frameRate: 15,
                repeat: -1,
            });
        }

        // Parámetro ?level=
        const startLevel = urlParams.get('level');
        if (startLevel) {
            this.time.delayedCall(200, () => {
                CampaignManager.startCampaign();
                CampaignManager.state.currentLevel = parseInt(startLevel, 10);
                this.scene.start('GameScene');
            });
            return;
        }

        // Parámetro ?scene=
        const startScene = urlParams.get('scene');
        if (startScene) {
            this.time.delayedCall(200, () => {
                switch (startScene) {
                    case 'story':
                        this.scene.start('StoryScene');
                        break;
                    case 'menu':
                        this.scene.start('MainMenuScene');
                        break;
                    case 'game':
                        this.scene.start('GameScene');
                        break;
                    case 'profile':
                        this.scene.start('ProfileScene');
                        break;
                    case 'gameover':
                        this.scene.start('GameOverScene', {
                            winner: 'ZORG',
                            streak: 5,
                            isNewRecord: true,
                        });
                        break;
                    case 'settings':
                        this.scene.start('SettingsScene');
                        break;
                    case 'epilogue':
                        this.scene.start('EpilogueScene');
                        break;
                }
            });
            return;
        }

        // Verificación de seguridad: Si WebFont no cargó (offline), iniciar igual
        if (typeof WebFont === 'undefined') {
            console.warn('WebFont no disponible. Iniciando modo offline.');
            this.buildScene();
        } else {
            WebFont.load({
                google: { families: ['Press Start 2P'] },
                active: () => {
                    this.time.delayedCall(100, () => this.buildScene());
                },
                inactive: () => {
                    console.warn('Fuente inactiva. Iniciando fallback.');
                    this.buildScene();
                },
                timeout: 2000,
            });
        }
    }

    createRingTitle(x, y) {
        const container = this.add.container(x, y);
        const radius = 160;
        const fontSize = '48px';
        const color = CONFIG.COLORS.TEXT_MAIN;

        // --- ANILLOS CONCÉNTRICOS ESTILO PIXEL-ART (Nítidos) ---
        const rings = this.add.graphics();

        // Dibujamos anillos sólidos con opacidades fijas para evitar el blur
        rings.lineStyle(8, 0x000000, 0.5);
        rings.strokeCircle(0, 0, radius + 20);

        rings.lineStyle(4, 0x000000, 0.3);
        rings.strokeCircle(0, 0, radius + 40);

        rings.lineStyle(2, 0x000000, 0.15);
        rings.strokeCircle(0, 0, radius + 60);

        container.add(rings);

        const letterSpacingAngle = 17;

        const wordsData = [
            { text: 'ROCK.', angle: -90 },
            { text: 'PAPER.', angle: 10 },
            { text: 'SCISSORS.', angle: 144 },
        ];

        wordsData.forEach((item) => {
            const word = item.text;
            const wordCenterAngle = item.angle;
            const centerIndex = (word.length - 1) / 2;

            for (let i = 0; i < word.length; i++) {
                const offset = (i - centerIndex) * letterSpacingAngle;
                const finalAngleDeg = wordCenterAngle + offset;
                const finalAngleRad = Phaser.Math.DegToRad(finalAngleDeg);

                const tx = Math.cos(finalAngleRad) * radius;
                const ty = Math.sin(finalAngleRad) * radius;

                const char = word[i];
                const letter = this.add
                    .text(tx, ty, char, {
                        fontFamily: '"Press Start 2P"',
                        fontSize: fontSize,
                        fill: color,
                    })
                    .setOrigin(0.5)
                    .setRotation(finalAngleRad + Math.PI / 2)
                    .setShadow(4, 4, '#000000', 0, false, true);

                container.add(letter);
            }
        });

        return container;
    }

    buildScene() {
        const { width, height } = this.scale;

        if (this.tempTitle) this.tempTitle.destroy();

        this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

        const title = this.createRingTitle(width / 2, height * 0.3);

        this.tweens.add({
            targets: title,
            angle: 360,
            duration: 16000,
            repeat: -1,
            ease: 'Linear',
        });

        this.tweens.add({
            targets: title,
            scale: 1.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Efecto Neón
        const colorCycle = { h: 0.33 };
        this.tweens.add({
            targets: colorCycle,
            h: 0.4,
            duration: 4000,
            yoyo: true,
            repeat: -1,
            onUpdate: () => {
                const color = Phaser.Display.Color.HSVToRGB(colorCycle.h, 1, 1).color;
                title.list.forEach((child) => {
                    if (child.setTint) child.setTint(color);
                });
            },
        });

        // BOTÓN DE INICIO PREMIUM (Estilo Arcade con Parpadeo)
        const startBtn = new RetroButton(
            this,
            width / 2,
            height * 0.63,
            'TAP TO START',
            CONFIG.COLORS.P1_BLUE,
            () => {
                // Transición de salida profesional más rápida (400ms)
                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // Pequeño delay de seguridad (50ms) para asegurar negro total
                    this.time.delayedCall(50, () => {
                        if (!DataManager.hasSeenIntro()) {
                            this.scene.start('StoryScene');
                        } else {
                            this.scene.start('ProfileScene');
                        }
                    });
                });
            }
        );

        // Añadir parpadeo clásico estilo Arcade
        this.tweens.add({
            targets: startBtn,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Steps(1)', // Cambio brusco para estilo retro
        });
    }
}
