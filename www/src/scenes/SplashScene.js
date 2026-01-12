import { CONFIG } from '../data/config.js';
import { Storage } from '../managers/Storage.js';
import { AudioManager } from '../managers/AudioManager.js';
import { ASSETS } from '../data/AssetManifest.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { RetroButton } from '../ui/components/RetroButton.js';

export class SplashScene extends Phaser.Scene {
    constructor() {
        super('SplashScene');
    }

    preload() {
        const { width, height } = this.scale;

        // --- TÍTULO (Durante Carga) ---
        this.tempTitle = this.createRingTitle(width / 2, height * 0.3);

        // --- BARRA DE CARGA ---
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 + 100, 320, 30);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(CONFIG.COLORS.P1_BLUE, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 110, 300 * value, 10);
        });

        this.load.on('complete', () => {
            progressBar.clear();
            progressBar.fillStyle(CONFIG.COLORS.P1_BLUE, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 110, 300, 10);

            this.time.delayedCall(800, () => {
                this.tweens.add({
                    targets: [progressBar, progressBox],
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        progressBar.destroy();
                        progressBox.destroy();
                    }
                });
            });
        });

        // --- CARGA DINÁMICA DESDE MANIFIESTO ---
        
        // 1. Scripts externos
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        // 2. Audio (SFX, Música, Fatalities)
        Object.values(ASSETS.AUDIO).flat().forEach(audio => {
            this.load.audio(audio.key, audio.path);
        });

        // 3. Imágenes (Fondos, Avatares)
        Object.values(ASSETS.IMAGES).flat().forEach(img => {
            this.load.image(img.key, img.path);
        });

        // 4. Spritesheets
        ASSETS.SPRITESHEETS.forEach(sheet => {
            this.load.spritesheet(sheet.key, sheet.path, sheet.config);
        });
    }

    async create() {
        // Inicializar tema de colores antes de que nada se dibuje
        const savedBg = await Storage.get('bg_theme', 'bg_purple');
        CONFIG.THEME.setFromPalette(savedBg);

        // Inicializar estado de Mute
        const isMuted = await Storage.get('isMuted', false);
        this.sound.mute = isMuted;

        // Inicializar gestor de audio
        await AudioManager.init(this);

        // Inicializar datos del jugador
        await PlayerManager.init();

        // Iniciar el fondo animado en paralelo
        this.scene.launch('BackgroundScene');
        // Aseguramos que el fondo se quede DETRÁS de esta escena (y de todas las futuras)
        this.scene.sendToBack('BackgroundScene');
        this.scene.bringToTop(); 

        // --- SAFE AREA DETECTION ---
        if (window.Capacitor && window.Capacitor.Plugins.SafeArea) {
            window.Capacitor.Plugins.SafeArea.getSafeAreaInsets().then(({ insets }) => {
                this.game.registry.set('safeTop', insets.top);
                this.game.registry.set('safeBottom', insets.bottom);
                console.log('Safe Area detected:', insets);
            }).catch(() => {
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
            // Forzar inicio de música si no está sonando
            if (!this.sound.get('bgm') || !this.sound.get('bgm').isPlaying) {
                AudioManager.playMusic(this, 'bgm'); 
            }
            
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        // --- AUTO-JUMP DEBUG LOGIC ---
        const urlParams = new URLSearchParams(window.location.search);
        
        // --- CREAR ANIMACIONES GLOBALES ---
        const planetAnims = [
            { key: 'anim_earth', texture: 'planet_tierra' },
            { key: 'anim_mars', texture: 'planet_mars' },
            { key: 'anim_kepler', texture: 'planet_kepler' },
            { key: 'anim_nebula', texture: 'planet_nebula' },
            { key: 'anim_zorg_planet', texture: 'planet_zorg' }
        ];

        planetAnims.forEach(anim => {
            if (!this.anims.exists(anim.key)) {
                this.anims.create({
                    key: anim.key,
                    frames: this.anims.generateFrameNumbers(anim.texture, { start: 0, end: 399 }),
                    frameRate: 15,
                    repeat: -1
                });
            }
        });

        // Mantener planet_rotate como alias para Earth por compatibilidad
        if (!this.anims.exists('planet_rotate')) {
            this.anims.create({
                key: 'planet_rotate',
                frames: this.anims.generateFrameNumbers('planet_tierra', { start: 0, end: 399 }),
                frameRate: 15,
                repeat: -1
            });
        }

        const startScene = urlParams.get('scene');
        if (startScene) {
            this.time.delayedCall(200, () => {
                switch(startScene) {
                    case 'menu': this.scene.start('MainMenuScene'); break;
                    case 'game': this.scene.start('GameScene'); break;
                    case 'profile': this.scene.start('ProfileScene'); break;
                    case 'gameover': this.scene.start('GameOverScene', { winner: 'ZORG', streak: 5, isNewRecord: true }); break;
                    case 'settings': this.scene.start('SettingsScene'); break;
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
                timeout: 2000
            });
        }
    }

    createRingTitle(x, y) {
        const container = this.add.container(x, y);
        const radius = 160; 
        const fontSize = '48px'; 
        const color = CONFIG.COLORS.TEXT_MAIN;
        
        // --- ANILLO DE FONDO DIFUSO (EFECTO GRAVEDAD/BLUR) ---
        const bgRing = this.add.graphics();
        const thickness = 140; 
        
        for (let i = 0; i < thickness; i++) {
            const alpha = 0.4 * Math.pow(1 - (i / thickness), 2);
            bgRing.lineStyle(2, 0x000000, alpha);
            bgRing.strokeCircle(0, 0, radius + (thickness * 0.5) - i);
            bgRing.strokeCircle(0, 0, radius - (thickness * 0.5) + i);
        }
        container.add(bgRing);

        const letterSpacingAngle = 17; 

        const wordsData = [
            { text: "ROCK.", angle: -90 },
            { text: "PAPER.", angle: 10 },
            { text: "SCISSORS.", angle: 144 }
        ];

        wordsData.forEach(item => {
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
                const letter = this.add.text(tx, ty, char, { 
                    fontFamily: '"Press Start 2P"', fontSize: fontSize, fill: color 
                }).setOrigin(0.5)
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
            ease: 'Linear'
        });

        this.tweens.add({
            targets: title,
            scale: 1.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
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
                title.list.forEach(child => {
                    if (child.setTint) child.setTint(color);
                });
            }
        });

        // BOTÓN DE INICIO PREMIUM (Usando Componente Reutilizable)
        new RetroButton(
            this, 
            width / 2, 
            height * 0.63, 
            "TAP TO START", 
            CONFIG.COLORS.P1_BLUE, 
            () => this.scene.start('ProfileScene')
        );
    }
}
