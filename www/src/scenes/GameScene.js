import { CONFIG } from '../config.js';
import { Storage } from '../Storage.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.p1Health = 3;
        this.p2Health = 3;
        this.canPlay = true; 
        this.playerStats = [0, 0, 0];
        this.playerName = 'JUGADOR 1';
        this.themes = {
            dark: { background: 0x000000, text: '#ffffff', accent: '#00A8F3', uiBg: 0x1a1a1a },
            light: { background: 0xffffff, text: '#000000', accent: '#F34235', uiBg: 0xf0f0f0 }
        };
        this.currentTheme = 'dark';
        this.isPlayerRight = false;
        this.difficulty = 'MEDIUM';
    }

    async applyTheme() {
        // Siempre usamos colores estilo Dark/Neon para texto y UI
        const colors = this.themes['dark']; 
        
        // Leemos la preferencia de oscurecer fondo
        const bgDim = await Storage.get('bgDim', 'false') === 'true';
        
        // Si bgDim es true, ponemos capa negra al 70%. Si no, transparente.
        const bgColor = bgDim ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)';
        this.cameras.main.setBackgroundColor(bgColor);
        
        const textElements = [this.p1Status, this.p2Status, this.timeText1, this.timeText2];
        textElements.forEach(el => {
            if (el) el.setFill(colors.text);
        });
        if (this.configBtn) this.configBtn.setFill(colors.text);
        if (this.muteBtn) this.muteBtn.setFill(colors.text);
        if (this.p1ButtonsBg) {
            this.p1ButtonsBg.forEach(bg => {
                if (bg) bg.setStrokeStyle(3, 0xffffff); // Siempre borde blanco
            });
        }
        // Grid siempre visible
        if (this.gridGraphics) this.drawGrid();
    }

    async create() {
        // Cargar datos persistentes
        this.playerName = await Storage.get('playerName', 'JUGADOR 1');
        // Eliminamos currentTheme, ya no se usa
        const savedSide = await Storage.get('isPlayerRight', 'false');
        this.isPlayerRight = (savedSide === 'true');
        this.difficulty = await Storage.get('difficulty', 'MEDIUM');

        this.p1Health = 3;
        this.p2Health = 3;
        this.playerStats = [0, 0, 0];
        
        this.buildGame();
        this.applyTheme(); // Ya no necesita argumentos
        this.isPlayingRound = false; 
        this.createNextRondaBtn(this.scale.width, this.scale.height, "JUGAR");
    }

    buildGame() {
        const { width, height } = this.scale;
        
        const safeTop = this.game.registry.get('safeTop') || 0;
        const safeBottom = this.game.registry.get('safeBottom') || 0;

        const SAFE_TOP = Math.max(safeTop, 50); 
        const SAFE_BOTTOM = Math.max(safeBottom, 20);

        const CENTER_X = width / 2;
        const HEAD_H = height * 0.18;
        
        const FOOT_Y = (height * 0.72) - (SAFE_BOTTOM > 20 ? SAFE_BOTTOM / 2 : 0);
        const BAR_Y = FOOT_Y - 25;

        this.mainMargin = this.add.graphics();
        this.updateMainMargins(width, height, SAFE_TOP);
        this.gridGraphics = this.add.graphics();

        const timerStyle = { fontSize: '12px', fontFamily: '"Press Start 2P"', fill: '#ffffff' };
        this.add.rectangle(width * 0.25, BAR_Y, width * 0.4, 20, 0x333333).setStrokeStyle(2, 0xffffff);
        this.timeBar1 = this.add.rectangle(width * 0.25, BAR_Y, width * 0.4, 20, 0x2ecc71);
        this.timeText1 = this.add.text(width * 0.25, BAR_Y, '5s', timerStyle).setOrigin(0.5);
        this.add.rectangle(width * 0.75, BAR_Y, width * 0.4, 20, 0x333333).setStrokeStyle(2, 0xffffff);
        this.timeBar2 = this.add.rectangle(width * 0.75, BAR_Y, width * 0.4, 20, 0x2ecc71);
        this.timeText2 = this.add.text(width * 0.75, BAR_Y, '5s', timerStyle).setOrigin(0.5);

        const cpuNames = ['JUAN', 'ANA', 'LUIS', 'SOFIA', 'CARLOS', 'MARIA', 'DAVID', 'ELENA', 'PEDRO', 'LAURA', 'DIEGO', 'LUCIA'];
        this.cpuName = Phaser.Utils.Array.GetRandom(cpuNames);

        const p1X = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2X = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        const statusStyle = { fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#ffffff' };
        this.p1Status = this.add.text(p1X, (height * 0.18 * 0.4) + SAFE_TOP, this.playerName, statusStyle).setOrigin(0.5);
        this.p2Status = this.add.text(p2X, (HEAD_H * 0.4) + SAFE_TOP, this.cpuName, statusStyle).setOrigin(0.5);
        
        this.p1Score = this.createHearts(p1X, (HEAD_H * 0.7) + SAFE_TOP);
        this.p2Score = this.createHearts(p2X, (HEAD_H * 0.7) + SAFE_TOP);
        
        const emojiStyle = { fontSize: '120px', padding: { x: 20, y: 20 } };
        this.p1Emoji = this.add.text(p1X, height * 0.45, '✊', emojiStyle).setOrigin(0.5).setScale(0);
        this.p2Emoji = this.add.text(p2X, height * 0.45, '✊', emojiStyle).setOrigin(0.5).setScale(0);

        const xStyle = { fontSize: '120px', padding: { x: 20, y: 20 } };
        this.p1X = this.add.text(p1X, height * 0.45, '❌', xStyle).setOrigin(0.5).setAlpha(0).setDepth(10);
        this.p2X = this.add.text(p2X, height * 0.45, '❌', xStyle).setOrigin(0.5).setAlpha(0).setDepth(10);

        this.sound.volume = 0.5;
        this.game.events.on('blur', () => this.sound.pauseAll());
        this.game.events.on('focus', () => this.sound.resumeAll());

        this.createResponsiveButtons(width, height, FOOT_Y);
        this.createControls(width, height, SAFE_BOTTOM);

        const pixelGraphics = this.make.graphics({x: 0, y: 0, add: false});
        pixelGraphics.fillStyle(0xffffff, 1);
        pixelGraphics.fillRect(0, 0, 6, 6);
        pixelGraphics.generateTexture('pixel', 6, 6);
        this.vfx = this.add.particles(0, 0, 'pixel', {
            speed: { min: -300, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 800,
            gravityY: 400,
            emitting: false
        });
        
        // Efecto de entrada suave
        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 500 });
    }

    createHearts(x, y) {
        const container = this.add.container(x, y);
        for (let i = 0; i < 3; i++) {
            const hContainer = this.add.container((i - 1) * 40, 0); 
            
            const heartGfx = this.add.graphics();
            heartGfx.fillStyle(0xff0000, 1);
            heartGfx.lineStyle(2, 0xffffff, 1);
            
            const size = 8; 
            heartGfx.fillCircle(-size, -size/2, size);
            heartGfx.strokeCircle(-size, -size/2, size);
            heartGfx.fillCircle(size, -size/2, size);
            heartGfx.strokeCircle(size, -size/2, size);
            heartGfx.beginPath();
            heartGfx.moveTo(-size*2, -size/2);
            heartGfx.lineTo(0, size*2.5);
            heartGfx.lineTo(size*2, -size/2);
            heartGfx.fillPath();
            
            heartGfx.beginPath();
            const offset = size * 0.9; 
            heartGfx.moveTo(-size - offset, -size/2 + (size*0.5)); 
            heartGfx.lineTo(0, size*2.5);
            heartGfx.lineTo(size + offset, -size/2 + (size*0.5));
            heartGfx.strokePath();

            const shine = this.add.circle(-size, -size, 3, 0xffffff, 0.6);
            
            hContainer.add([heartGfx, shine]);
            hContainer.setData('active', true);
            container.add(hContainer);

            this.tweens.add({
                targets: hContainer,
                scale: 1.15,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 150 
            });
        }
        return container;
    }

    updateHearts(container, lives) {
        if (!container) return;
        container.list.forEach((hContainer, index) => {
            const isActive = hContainer.getData('active');
            if (index < lives) {
                if (!isActive) {
                    hContainer.setData('active', true);
                    hContainer.setAlpha(1);
                    const gfx = hContainer.list[0];
                    gfx.clear();
                    gfx.fillStyle(0xff0000, 1);
                    gfx.lineStyle(2, 0xffffff, 1);
                    this.redrawHeart(gfx);
                }
            } 
            else if (index >= lives && isActive) {
                hContainer.setData('active', false);
                this.tweens.add({
                    targets: hContainer,
                    y: -20,
                    scale: 1.5,
                    duration: 200,
                    yoyo: true,
                    onComplete: () => {
                        hContainer.setAlpha(0.5);
                        hContainer.setScale(1);
                        const gfx = hContainer.list[0];
                        gfx.clear();
                        gfx.fillStyle(0x333333, 1);
                        gfx.lineStyle(2, 0x888888, 1);
                        this.redrawHeart(gfx);
                    }
                });
            }
        });
    }

    redrawHeart(heartGfx) {
        const size = 8; 
        heartGfx.fillCircle(-size, -size/2, size);
        heartGfx.strokeCircle(-size, -size/2, size);
        heartGfx.fillCircle(size, -size/2, size);
        heartGfx.strokeCircle(size, -size/2, size);
        heartGfx.beginPath();
        heartGfx.moveTo(-size*2, -size/2);
        heartGfx.lineTo(0, size*2.5);
        heartGfx.lineTo(size*2, -size/2);
        heartGfx.fillPath();
        
        heartGfx.beginPath();
        const offset = size * 0.9;
        heartGfx.moveTo(-size - offset, -size/2 + (size*0.5)); 
        heartGfx.lineTo(0, size*2.5);
        heartGfx.lineTo(size + offset, -size/2 + (size*0.5));
        heartGfx.strokePath();
    }

    updateMainMargins(width, height, safeTop) {
        this.mainMargin.clear();
        const CENTER_X = width / 2;
        const BORDER_W = 10;
        const HEAD_H = height * 0.18;
        const FOOT_Y = height * 0.72;
        
        const leftColor = this.isPlayerRight ? 0xF34235 : 0x00A8F3; 
        const rightColor = this.isPlayerRight ? 0x00A8F3 : 0xF34235;
        
        this.mainMargin.lineStyle(BORDER_W, leftColor, 1);
        this.mainMargin.beginPath();
        this.mainMargin.moveTo(CENTER_X, BORDER_W / 2);
        this.mainMargin.lineTo(BORDER_W / 2, BORDER_W / 2);
        this.mainMargin.lineTo(BORDER_W / 2, height - BORDER_W / 2);
        this.mainMargin.lineTo(CENTER_X, height - BORDER_W / 2);
        this.mainMargin.strokePath();
        
        this.mainMargin.lineStyle(BORDER_W, rightColor, 1);
        this.mainMargin.beginPath();
        this.mainMargin.moveTo(CENTER_X, BORDER_W / 2);
        this.mainMargin.lineTo(width - BORDER_W / 2, BORDER_W / 2);
        this.mainMargin.lineTo(width - BORDER_W / 2, height - BORDER_W / 2);
        this.mainMargin.lineTo(CENTER_X, height - BORDER_W / 2);
        this.mainMargin.strokePath();
    }

    createResponsiveButtons(width, height, footerTop) {
        this.p1ButtonsBg = [];
        this.p2ButtonsBg = [];
        this.p1ButtonsTxt = [];
        this.p2ButtonsTxt = [];
        const choices = ['PIEDRA', 'PAPEL', 'TIJERA'];
        const emojis = ['✊', '✋', '✌️'];
        const startY = footerTop || (height * 0.75);
        const p1X = this.isPlayerRight ? width * 0.75 : width * 0.25;
        const p2X = this.isPlayerRight ? width * 0.25 : width * 0.75;
        choices.forEach((name, i) => {
            const yPos = startY + 80 + (i * 110);
            this.makeSingleBtn(p1X, yPos, name, emojis[i], true, i);
            this.makeSingleBtn(p2X, yPos, name, emojis[i], false, i);
        });
    }

    makeSingleBtn(x, y, name, emoji, isP1, index) {
        let baseColor = isP1 ? 0x00A8F3 : 0xF34235;
        let container = this.add.container(x, y);
        let bg = this.add.rectangle(0, 0, 90, 90, baseColor).setStrokeStyle(3, 0xffffff);
        let emo = this.add.text(0, 5, emoji, { fontSize: '42px', padding: { x: 10, y: 10 } }).setOrigin(0.5);
        let txt = this.add.text(0, 35, name, { fontFamily: '"Press Start 2P"', fontSize: '9px', fill: '#ffffff' }).setOrigin(0.5);
        container.add([bg, emo, txt]);
        const audioKeys = ['sfx_rock', 'sfx_paper', 'sfx_scissors'];
        if (isP1) {
            this.p1ButtonsBg[index] = bg;
            this.p1ButtonsTxt[index] = txt;
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
                if (this.isResolving) return;
                this.tweens.add({ targets: container, scale: 0.9, duration: 50, yoyo: true });
                this.sound.play(audioKeys[index]);
                if (navigator.vibrate) navigator.vibrate(20);
                this.handleInput(index);
            });
        } else {
            this.p2ButtonsBg[index] = bg;
            this.p2ButtonsTxt[index] = txt;
        }
    }

    createControls(width, height, safeBottom = 0) {
        const SAFE_BOTTOM = Math.max(safeBottom, 20);
        const BTN_Y = height - 60 - (SAFE_BOTTOM > 20 ? SAFE_BOTTOM / 2 : 0);

        this.configBtn = this.add.text(60, BTN_Y, '⚙️', { fontSize: '40px' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2000);
        this.configBtn.on('pointerdown', () => {
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 500 });
            this.tweens.add({ targets: this.configBtn, scale: 1.2, duration: 100, yoyo: true });
            this.scene.launch('SettingsScene');
            this.scene.get('SettingsScene').events.once('settings-closed', () => {
                this.applyTheme(); // Recargar preferencia de fondo
            });
        });
        this.isMuted = this.sound.mute;
        const icon = this.isMuted ? '🔇' : '🔊';
        this.muteBtn = this.add.text(width - 60, BTN_Y, icon, { fontSize: '40px' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2000);
        this.muteBtn.on('pointerdown', () => {
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 500 });
            this.isMuted = !this.isMuted;
            this.sound.mute = this.isMuted;
            this.muteBtn.setText(this.isMuted ? '🔇' : '🔊');
            this.tweens.add({ targets: this.muteBtn, scale: 1.2, duration: 100, yoyo: true });
        });
        this.switchBtn = this.add.text(width / 2, height - 130 - (SAFE_BOTTOM > 20 ? SAFE_BOTTOM / 2 : 0), '⇄', { fontSize: '40px' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2000);
        this.switchBtn.on('pointerdown', () => {
            if (this.isPlayingRound || this.isSwitchingSide) {
                this.tweens.killTweensOf(this.switchBtn);
                this.switchBtn.x = width / 2; 
                this.tweens.add({ targets: this.switchBtn, x: '+=5', duration: 50, yoyo: true, repeat: 3 });
                return; 
            }
            // this.sound.play('sfx_reveal', { volume: 0.5, detune: 200 });
            this.switchSides();
            this.tweens.killTweensOf(this.switchBtn);
            this.switchBtn.x = width / 2; 
            this.tweens.add({ targets: this.switchBtn, scale: 1.2, duration: 100, yoyo: true });
        });
        this.stopBtn = this.add.container(width / 2, BTN_Y);
        let sRect = this.add.rectangle(0, 0, 240, 50, 0xF34235).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff);
        let sText = this.add.text(0, 0, 'DETENER PARTIDA', { fontFamily: '"Press Start 2P"', fontSize: '10px' }).setOrigin(0.5);
        this.stopBtn.add([sRect, sText]);
        sRect.on('pointerdown', () => {
             // this.sound.play('sfx_reveal', { volume: 0.5, detune: 500 }); // Sonido de clic normal
             this.tweens.add({
                targets: this.cameras.main,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    this.scene.start('SplashScene'); // O MainMenuScene si prefieres
                }
             });
        });
    }

    handleInput(index) {
        if (this.isResolving) return;
        this.isResolving = true;
        this.playerStats[index]++;
        this.resetButtonColors();
        if (this.p1ButtonsBg[index]) {
            this.p1ButtonsBg[index].setFillStyle(0xFFFFFF);
            this.p1ButtonsTxt[index].setFill('#000000');
        }
        this.sound.play(['sfx_rock', 'sfx_paper', 'sfx_scissors'][index]);
        this.time.delayedCall(800, () => {
            this.resolveRound(index);
        });
    }

    startRound() {
        this.isResolving = false;
        this.isPlayingRound = true; 
        this.p1X.setAlpha(0);
        this.p2X.setAlpha(0);
        const { width, height } = this.scale;
        const CENTER_X = width / 2;
        const p1TargetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2TargetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        
        this.p1Emoji.setText('✊').setScale(1).setAlpha(1);
        this.p2Emoji.setText('✊').setScale(1).setAlpha(1);
        
        this.p1Emoji.x = p1TargetX < CENTER_X ? -200 : width + 200;
        this.p2Emoji.x = p2TargetX < CENTER_X ? -200 : width + 200;
        
        this.tweens.add({
            targets: [this.p1Emoji, this.p2Emoji],
            x: (target) => (target === this.p1Emoji ? p1TargetX : p2TargetX),
            duration: 500,
            ease: 'Back.easeOut',
            onStart: () => {
                this.sound.play('sfx_reveal', { volume: 0.3 }); 
            }
        });
        const duration = 5000;
        [this.timeBar1, this.timeBar2].forEach(bar => {
            bar.setVisible(true).setFillStyle(0x2ecc71).width = (width * 0.4);
        });
        this.timeBar1.alpha = 0; this.timeBar2.alpha = 0;
        this.timeText1.alpha = 0; this.timeText2.alpha = 0;
        this.tweens.add({ targets: [this.timeBar1, this.timeBar2, this.timeText1, this.timeText2], alpha: 1, duration: 300 });
        this.timeText1.setText('5s'); this.timeText2.setText('5s');
        this.tweens.add({
            targets: [this.timeBar1, this.timeBar2],
            width: 0,
            duration: duration,
            onUpdate: (tween) => {
                const remaining = Math.ceil((1 - tween.progress) * 5);
                this.timeText1.setText(remaining + 's');
                this.timeText2.setText(remaining + 's');
                if (tween.progress > 0.7) {
                    this.timeBar1.setFillStyle(0xff0000);
                    this.timeBar2.setFillStyle(0xff0000);
                }
            },
            onComplete: () => {
                this.resolveRound(-1);
            }
        });
    }

    resolveRound(playerChoice) {
        this.isResolving = true;
        this.tweens.killTweensOf([this.timeBar1, this.timeBar2, this.p1Emoji, this.p2Emoji]);
        const defaultY = this.scale.height * 0.45;
        this.p1Emoji.setY(defaultY).setScale(1);
        this.p2Emoji.setY(defaultY).setScale(1);
        const cpuChoice = this.getCpuChoice();
        this.tweens.add({
            targets: [this.p1Emoji, this.p2Emoji],
            y: '+=30',
            yoyo: true,
            repeat: 2,
            duration: 150,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                this.time.delayedCall(150, () => {
                    this.showResults(playerChoice, cpuChoice);
                });
            }
        });
    }

    getCpuChoice() {
        const diff = this.difficulty || 'MEDIUM';
        const totalPlays = this.playerStats.reduce((a, b) => a + b, 0);
        const randomChoice = Math.floor(Math.random() * 3);
        if (totalPlays < 3) return randomChoice;
        let smartChance = 0; 
        if (diff === 'EASY') smartChance = 0;
        else if (diff === 'MEDIUM') smartChance = 0.4;
        else if (diff === 'HARD') smartChance = 0.7;
        if (Math.random() < smartChance) {
            const mostUsed = this.playerStats.indexOf(Math.max(...this.playerStats));
            return (mostUsed + 1) % 3;
        }
        return randomChoice;
    }

    showResults(p1, p2) {
        this.sound.stopAll();
        const icons = ['✊', '✋', '✌️'];
        if (this.p1Emoji) this.p1Emoji.setText(p1 === -1 ? '❌' : icons[p1]);
        if (this.p2Emoji) this.p2Emoji.setText(icons[p2]);
        this.tweens.add({ targets: [this.p1Emoji, this.p2Emoji], scale: 1.5, duration: 100, yoyo: true, ease: 'Back.easeOut' });
        let resultText = "";
        let color = "#ffffff";
        let isVictory = false;
        let isDefeat = false;
        if (p1 === -1) {
            resultText = "¡TIEMPO!";
            color = "#ff0000";
            isDefeat = true;
            this.p1Health--; 
            this.sound.play('sfx_lose');
            if (navigator.vibrate) navigator.vibrate(400); 
            this.playImpactEffect(0xF34235, 0.8);
        } else if (p1 === p2) {
            resultText = "¡EMPATE!"; 
            this.sound.play('sfx_tie'); 
            if (navigator.vibrate) navigator.vibrate(100); 
            this.playImpactEffect(0xaaaaaa, 0.5);
            this.p2Status.setText("¡EMPATE!").setFill(color).setScale(0);
            this.tweens.add({ targets: this.p2Status, scale: 1.2, duration: 400, ease: 'Bounce.easeOut' });
        } else if ((p1 === 0 && p2 === 2) || (p1 === 1 && p2 === 0) || (p1 === 2 && p2 === 1)) {
            resultText = "¡GANASTE!"; color = "#00A8F3"; isVictory = true; 
            this.p2Health--; 
            this.sound.play('sfx_win');
            this.tweens.add({ targets: this.p2X, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Bounce.easeOut' });
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            this.playImpactEffect(0x00A8F3, 1.0);
        } else {
            resultText = "¡PERDISTE!"; color = "#F34235"; isDefeat = true; 
            this.p1Health--; 
            this.sound.play('sfx_lose');
            this.tweens.add({ targets: this.p1X, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Bounce.easeOut' });
            if (navigator.vibrate) navigator.vibrate(400);
            this.playImpactEffect(0xF34235, 0.8);
        }
        this.p1Status.setText(resultText).setFill(color).setScale(0);
        this.tweens.add({ targets: this.p1Status, scale: 1.2, duration: 400, ease: 'Bounce.easeOut' });
        this.updateHearts(this.p1Score, this.p1Health);
        this.updateHearts(this.p2Score, this.p2Health);
        if (this.p1Health <= 0 || this.p2Health <= 0) {
            this.time.delayedCall(1200, async () => {
                const isPlayerWin = this.p2Health <= 0;
                const winnerName = isPlayerWin ? this.playerName : this.cpuName;
                
                // Cargar rachas actuales desde almacenamiento seguro
                let currentStreak = parseInt(await Storage.get('streak_current', '0'));
                let bestStreak = parseInt(await Storage.get('streak_best', '0'));
                
                if (isPlayerWin) {
                    currentStreak++;
                    if (currentStreak > bestStreak) {
                        bestStreak = currentStreak;
                        await Storage.set('streak_best', bestStreak);
                    }
                } else {
                    currentStreak = 0;
                }
                await Storage.set('streak_current', currentStreak);
                
                this.tweens.add({
                    targets: this.cameras.main,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.scene.start('GameOverScene', { 
                            winner: winnerName,
                            streak: currentStreak,
                            isNewRecord: (isPlayerWin && currentStreak === bestStreak && currentStreak > 0)
                        });
                    }
                });
            });
        } else {
            this.time.delayedCall(600, () => {
                this.createNextRondaBtn(this.scale.width, this.scale.height);
            });
        }
    }

    playImpactEffect(color, intensity) {
        this.cameras.main.flash(200 * intensity, 255, 255, 255);
        this.cameras.main.shake(200 * intensity, 0.01 * intensity);
        if (this.vfx) {
            const midX = (this.p1Emoji.x + this.p2Emoji.x) / 2;
            const midY = (this.p1Emoji.y + this.p2Emoji.y) / 2;
            this.vfx.setPosition(midX, midY);
            this.vfx.forEachAlive(p => p.tint = color);
            this.vfx.explode(30 + (20 * intensity)); 
        }
    }

    createNextRondaBtn(width, height, labelText = "NEXT") {
        this.isPlayingRound = false; 
        const currentColor = this.themes[this.currentTheme].text;
        this.p1Status.setText(this.playerName).setFill(currentColor);
        if (this.nextRondaBtn) this.nextRondaBtn.destroy();
        const x = width / 2;
        const y = height * 0.45;
        this.nextRondaBtn = this.add.container(x, y);
        const circle = this.add.circle(0, 0, 75, 0x2ecc71).setStrokeStyle(4, 0xffffff);
        const text = this.add.text(0, 0, labelText, {
            fontFamily: '"Press Start 2P"', fontSize: labelText.length > 5 ? '18px' : '24px', fill: '#ffffff'
        }).setOrigin(0.5);
        this.nextRondaBtn.add([circle, text]);
        circle.setInteractive({ useHandCursor: true });
        this.nextRondaBtn.setScale(0);
        this.tweens.add({ targets: this.nextRondaBtn, scale: 1, duration: 400, ease: 'Back.easeOut' });
        circle.on('pointerdown', () => {
            // Eliminado el sonido redundante
            this.nextRondaBtn.setScale(0.9);
            if (navigator.vibrate) navigator.vibrate(20);
        });
        circle.on('pointerup', () => {
            this.nextRondaBtn.destroy(); 
            this.nextRondaBtn = null;
            this.p1Status.setText(this.playerName).setFill(currentColor).setScale(1); 
            this.p2Status.setText(this.cpuName).setFill(currentColor).setScale(1);
            this.startRound();
        });
    }

    drawGrid() {
        this.gridGraphics.clear();
        const { width, height } = this.scale;
        const CENTER_X = width / 2;
        const SAFE_TOP = 50;
        const HEAD_H = height * 0.18;
        const FOOT_Y = height * 0.72;
        const LINE_THICK = 4;
        const leftColor = this.isPlayerRight ? 0xF34235 : 0x00A8F3; 
        const rightColor = this.isPlayerRight ? 0x00A8F3 : 0xF34235;
        const centerColor = this.currentTheme === 'light' ? 0x000000 : 0xffffff;
        this.gridGraphics.lineStyle(LINE_THICK, centerColor, 0.3);
        this.gridGraphics.lineBetween(CENTER_X, 0, CENTER_X, height);
        this.gridGraphics.lineStyle(LINE_THICK, leftColor, 1);
        this.gridGraphics.lineBetween(0, HEAD_H + SAFE_TOP, CENTER_X - 2, HEAD_H + SAFE_TOP);
        this.gridGraphics.lineBetween(0, FOOT_Y, CENTER_X - 2, FOOT_Y);
        this.gridGraphics.lineStyle(LINE_THICK, rightColor, 1);
        this.gridGraphics.lineBetween(CENTER_X + 2, HEAD_H + SAFE_TOP, width, HEAD_H + SAFE_TOP);
        this.gridGraphics.lineBetween(CENTER_X + 2, FOOT_Y, width, FOOT_Y);
    }
    
    resetButtonColors() {
        if (!this.p1ButtonsBg || !this.p1ButtonsTxt) return;
        for (let i = 0; i < 3; i++) {
            if (this.p1ButtonsBg[i]) this.p1ButtonsBg[i].setFillStyle(0x00A8F3);
            if (this.p1ButtonsTxt[i]) this.p1ButtonsTxt[i].setFill('#ffffff');
            if (this.p2ButtonsBg[i]) this.p2ButtonsBg[i].setFillStyle(0xF34235);
            if (this.p2ButtonsTxt[i]) this.p2ButtonsTxt[i].setFill('#ffffff');
        }
    }

    switchSides() {
        if (this.isSwitchingSide) return;
        this.isSwitchingSide = true; 
        this.isPlayerRight = !this.isPlayerRight;
        Storage.set('isPlayerRight', this.isPlayerRight);
        this.drawGrid();
        const { width, height } = this.scale;
        this.updateMainMargins(width, height);
        const CENTER_X = width / 2;
        const p1X = this.isPlayerRight ? width * 0.75 : width * 0.25;
        const p2X = this.isPlayerRight ? width * 0.25 : width * 0.75;
        const p1EmojiX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2EmojiX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        this.tweens.add({ targets: [this.p1Status], x: p1EmojiX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p2Status], x: p2EmojiX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p1Score], x: p1EmojiX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p2Score], x: p2EmojiX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p1Emoji, this.p1X], x: p1EmojiX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p2Emoji, this.p2X], x: p2EmojiX, duration: 300, ease: 'Power2' });
        this.p1ButtonsBg.forEach((btn, i) => {
            if(btn && btn.parentContainer) { this.tweens.add({ targets: btn.parentContainer, x: p1X, duration: 300, ease: 'Back.easeOut' }); }
        });
        this.p2ButtonsBg.forEach((btn, i) => {
        if(btn && btn.parentContainer) { this.tweens.add({ targets: btn.parentContainer, x: p2X, duration: 300, ease: 'Back.easeOut' }); }
        });
        this.time.delayedCall(310, () => { this.isSwitchingSide = false; });
    }
}
