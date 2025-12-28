import { CONFIG } from '../config.js';
import { Storage } from '../Storage.js';

export class SplashScene extends Phaser.Scene {
    constructor() {
        super('SplashScene');
    }

    preload() {
        const { width, height } = this.scale;

        // --- TÍTULO (Durante Carga) ---
        this.tempTitle = this.add.text(width / 2, height * 0.3, "PIEDRA PAPEL\nO TIJERA", {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            fill: '#00A8F3',
            align: 'center'
        }).setOrigin(0.5);

        // --- BARRA DE CARGA ---
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 + 100, 320, 30);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00A8F3, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 + 110, 300 * value, 10);
        });

        this.load.on('complete', () => {
            progressBar.clear();
            progressBar.fillStyle(0x00A8F3, 1);
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
    }

    create() {
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

    buildScene() {
        const { width, height } = this.scale;

        if (this.tempTitle) this.tempTitle.destroy();

        this.cameras.main.setBackgroundColor('#000000'); // Fondo negro (o transparente si quieres ver el espacio)
        // Para ver el fondo espacial, comentamos la línea de arriba o usamos alpha 0
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

        const title = this.add.text(width / 2, height * 0.3, "PIEDRA PAPEL\nO TIJERA", {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            fill: '#00A8F3',
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            scale: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Dibujamos UI con valor por defecto para no bloquear
        const defaultName = 'JUGADOR 1';
        const nameRow = this.add.container(width / 2, height * 0.6);
        
        const nameFieldBg = this.add.rectangle(-45, 0, 270, 70, 0xffffff)
            .setStrokeStyle(4, 0x00A8F3)
            .setInteractive({ useHandCursor: true });

        const nameText = this.add.text(-45, 0, `NOMBRE: ${defaultName}`, {
            fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#000000'
        }).setOrigin(0.5);

        // Cargar nombre real en segundo plano
        Storage.get('playerName', defaultName).then(savedName => {
            nameText.setText(`NOMBRE: ${savedName}`);
        });

        const okBtn = this.add.container(140, 0);
        const okBg = this.add.rectangle(0, 0, 80, 70, 0x00ff00)
            .setStrokeStyle(4, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const okTxt = this.add.text(0, 0, "OK", {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#ffffff'
        }).setOrigin(0.5);
        okBtn.add([okBg, okTxt]);

        const nextBtn = this.add.container(0, height * 0.2); 
        const nextBg = this.add.rectangle(0, 0, 360, 60, 0x2ecc71).setStrokeStyle(4, 0xffffff).setInteractive({ useHandCursor: true });
        const nextTxt = this.add.text(0, 0, "CONTINUAR", { fontFamily: '"Press Start 2P"', fontSize: '20px' }).setOrigin(0.5);
        nextBtn.add([nextBg, nextTxt]);

        nameRow.add([nameFieldBg, nameText, okBtn, nextBtn]);

        const activateInput = async () => {
            if (this.hiddenInput) return;

            const input = document.createElement('input');
            input.type = 'text';
            input.style.position = 'absolute';
            input.style.opacity = '0';
            // Cargamos el valor actual (puede que ya se haya actualizado o no)
            const currentName = nameText.text.replace('NOMBRE: ', '');
            input.value = currentName;
            input.maxLength = 10;
            document.body.appendChild(input);
            input.focus();
            this.hiddenInput = input;

            nameFieldBg.setStrokeStyle(4, 0x00ff00);

            input.addEventListener('input', (e) => {
                let val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 10);
                nameText.setText(`NOMBRE: ${val}`);
                Storage.set('playerName', val);
            });

            const finalize = () => {
                nameFieldBg.setStrokeStyle(4, 0x00A8F3);
                if (this.hiddenInput) {
                    document.body.removeChild(this.hiddenInput);
                    this.hiddenInput = null;
                }
            };

            input.addEventListener('keydown', (e) => { if(e.key === 'Enter') finalize(); });
            okBg.on('pointerdown', finalize);
        };

        nameFieldBg.on('pointerdown', activateInput);

        nextBg.on('pointerdown', () => {
            if (this.hiddenInput) {
                document.body.removeChild(this.hiddenInput);
                this.hiddenInput = null;
            }
            if (navigator.vibrate) navigator.vibrate(50);
            this.scene.start('MainMenuScene');
        });
    }
}