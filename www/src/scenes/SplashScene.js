import { CONFIG } from '../config.js';
import { Storage } from '../Storage.js';
import { AudioManager } from '../managers/AudioManager.js';

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

        // --- CARGA DE ASSETS ---
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
        this.load.audio('sfx_rock', 'assets/sounds/rockrock-select.mp3');
        this.load.audio('sfx_paper', 'assets/sounds/paperpaper-select.mp3');
        this.load.audio('sfx_scissors', 'assets/sounds/scissors-select.mp3');
        this.load.audio('sfx_reveal', 'assets/sounds/reveal-reveal.mp3');
        this.load.audio('sfx_win', 'assets/sounds/yooo-win.mp3');
        this.load.audio('sfx_lose', 'assets/sounds/whywhy-lose.mp3');
        this.load.audio('sfx_tie', 'assets/sounds/tietie-tie.mp3');
        // Music
        this.load.audio('bgm', 'assets/sounds/background.mp3');
        // UI
        this.load.audio('sfx_button', 'assets/sounds/button-click.mp3');
        // Background Image
        this.load.image('v3_bg', 'assets/v3_space.png');

        // --- CARGA DE ASSETS DINÁMICOS ---
        // Avatares
        this.load.image('avatar_p1', 'assets/avatars/navegante-1.png');
        this.load.image('avatar_cpu', 'assets/avatars/alien-1.png');

        // Nuevo Planeta Animado (Spritesheet ULTRA - 400 frames)
        this.load.spritesheet('planet_tierra', 'assets/planets/tierra400.png', {
            frameWidth: 100,
            frameHeight: 100,
            startFrame: 0,
            endFrame: 399,
            margin: 5,
            spacing: 5
        });

        // Fatalities
        this.load.audio('fatality_rock', 'assets/sounds/rock-fatality.mp3');
        this.load.audio('fatality_paper', 'assets/sounds/paper-fatality.mp3');
        this.load.audio('fatality_scissor', 'assets/sounds/scissor-fatality.mp3');
    }

    async create() {
        // Inicializar gestor de audio
        await AudioManager.init(this);

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
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        // --- AUTO-JUMP DEBUG LOGIC ---
        const urlParams = new URLSearchParams(window.location.search);
        const startScene = urlParams.get('scene');
        if (startScene) {
            this.time.delayedCall(200, () => {
                switch(startScene) {
                    case 'menu': this.scene.start('MainMenuScene'); break;
                    case 'game': this.scene.start('GameScene'); break;
                    case 'gameover': this.scene.start('GameOverScene', { winner: 'TEST PLAYER', streak: 5, isNewRecord: true }); break;
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

        // Efecto Neón (Ciclo de Verdes en lugar de RGB total)
        const colorCycle = { h: 0.33 }; // 0.33 es verde en HSV
        this.tweens.add({
            targets: colorCycle,
            h: 0.4, // Oscilar entre verdes
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

        const defaultName = 'PLAYER 1';
        const nameRow = this.add.container((width / 2) - 40, height * 0.6);
        
        const nameLabel = this.add.text(0, -65, "NAME:", {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: CONFIG.COLORS.TEXT_MAIN
        }).setOrigin(0.5);
        
        const nameFieldBg = this.add.graphics();
        nameFieldBg.fillStyle(0x000000, 0.7);
        nameFieldBg.fillRoundedRect(-135, -35, 270, 70, 16);
        nameFieldBg.lineStyle(4, CONFIG.COLORS.P1_BLUE);
        nameFieldBg.strokeRoundedRect(-135, -35, 270, 70, 16);
        nameFieldBg.setInteractive(new Phaser.Geom.Rectangle(-135, -35, 270, 70), Phaser.Geom.Rectangle.Contains);

        const nameText = this.add.text(0, 0, defaultName, {
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: CONFIG.COLORS.TEXT_MAIN
        }).setOrigin(0.5);

        const cursor = this.add.text(0, 0, '_', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: CONFIG.COLORS.GOLD 
        }).setOrigin(0, 0.5); 

        const updateCursorPos = () => {
            const textWidth = nameText.width;
            cursor.x = (textWidth / 2) + 5;
        };
        updateCursorPos();

        this.tweens.add({
            targets: cursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        Storage.get('playerName', defaultName).then(savedName => {
            nameText.setText(savedName);
            updateCursorPos();
        });

        const okBtn = this.add.container(185, 0);
        const okBg = this.add.graphics();
        okBg.fillStyle(CONFIG.COLORS.P1_BLUE, 1);
        okBg.fillRoundedRect(-40, -35, 80, 70, 16); 
        okBg.lineStyle(4, 0xffffff);
        okBg.strokeRoundedRect(-40, -35, 80, 70, 16);
        okBg.setInteractive(new Phaser.Geom.Rectangle(-40, -35, 80, 70), Phaser.Geom.Rectangle.Contains);

        const okTxt = this.add.text(0, 0, "OK", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: CONFIG.COLORS.TEXT_DARK
        }).setOrigin(0.5);
        okBtn.add([okBg, okTxt]);

        const nextBtn = this.add.container(width / 2, height * 0.8); 
        const nextBg = this.add.graphics();
        nextBg.fillStyle(CONFIG.COLORS.P1_BLUE);
        nextBg.fillRoundedRect(-180, -30, 360, 60, 16);
        nextBg.lineStyle(4, 0xffffff);
        nextBg.strokeRoundedRect(-180, -30, 360, 60, 16);
        nextBg.setInteractive(new Phaser.Geom.Rectangle(-180, -30, 360, 60), Phaser.Geom.Rectangle.Contains);

        const nextTxt = this.add.text(0, 0, "CONTINUE", { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: CONFIG.COLORS.TEXT_DARK 
        }).setOrigin(0.5);
        nextBtn.add([nextBg, nextTxt]);

        nameRow.add([nameFieldBg, nameText, cursor, nameLabel, okBtn]); 

        const activateInput = async () => {
            if (this.hiddenInput) return;

            const input = document.createElement('input');
            input.type = 'text';
            input.style.position = 'absolute';
            input.style.opacity = '0';
            input.value = nameText.text;
            input.maxLength = 10;
            document.body.appendChild(input);
            input.focus();
            this.hiddenInput = input;

            nameFieldBg.clear();
            nameFieldBg.fillStyle(0x000000, 0.7);
            nameFieldBg.fillRoundedRect(-135, -35, 270, 70, 16);
            nameFieldBg.lineStyle(4, CONFIG.COLORS.GOLD); 
            nameFieldBg.strokeRoundedRect(-135, -35, 270, 70, 16);

            input.addEventListener('input', (e) => {
                let val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 10);
                nameText.setText(val);
                updateCursorPos();
                Storage.set('playerName', val);
            });

            const finalize = () => {
                nameFieldBg.clear();
                nameFieldBg.fillStyle(0x000000, 0.7);
                nameFieldBg.fillRoundedRect(-135, -35, 270, 70, 16);
                nameFieldBg.lineStyle(4, CONFIG.COLORS.P1_BLUE);
                nameFieldBg.strokeRoundedRect(-135, -35, 270, 70, 16);

                if (this.hiddenInput) {
                    document.body.removeChild(this.hiddenInput);
                    this.hiddenInput = null;
                }
            };

            input.addEventListener('keydown', (e) => { if(e.key === 'Enter') finalize(); });
            okBg.on('pointerdown', () => {
                AudioManager.playSFX(this, 'sfx_button');
                this.tweens.add({ targets: okBtn, scale: 0.9, duration: 50, yoyo: true });
                finalize();
            });
        };

        nameFieldBg.on('pointerdown', activateInput);

        nextBg.on('pointerdown', () => {
            if (this.hiddenInput) {
                document.body.removeChild(this.hiddenInput);
                this.hiddenInput = null;
            }
            AudioManager.playSFX(this, 'sfx_button');
            if (navigator.vibrate) navigator.vibrate(50);
            this.tweens.add({ targets: nextBtn, scale: 0.95, duration: 50, yoyo: true });
            this.time.delayedCall(100, () => {
                this.scene.start('MainMenuScene');
            });
        });
    }
}