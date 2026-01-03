import { CONFIG } from '../config.js';
import { Storage } from '../Storage.js';
import { FatalityManager } from '../managers/FatalityManager.js';
import { OpponentAI } from '../managers/OpponentAI.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.p1Health = 3;
        this.p2Health = 3;
        this.canPlay = true; 
        this.playerStats = [0, 0, 0];
        this.playerName = 'PLAYER 1';
        this.themes = {
            dark: { 
                background: CONFIG.COLORS.BG_DARK, 
                text: CONFIG.COLORS.TEXT_MAIN, 
                accent: CONFIG.COLORS.P1_BLUE, 
                uiBg: 0x1a1a1a 
            },
            light: { 
                background: 0xffffff, 
                text: CONFIG.COLORS.TEXT_DARK, 
                accent: CONFIG.COLORS.CPU_RED, 
                uiBg: 0xf0f0f0 
            }
        };
        this.currentTheme = 'dark';
        this.isPlayerRight = false;
        this.difficulty = 'MEDIUM';
    }

    async applyTheme() {
        const colors = this.themes['dark']; 
        const bgDim = await Storage.get('bgDim', 'false') === 'true';
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
                if (bg) bg.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, 0xffffff);
            });
        }
        if (this.gridGraphics) this.drawGrid();
    }

    async create() {
        this.playerName = await Storage.get('playerName', 'PLAYER 1');
        const savedSide = await Storage.get('isPlayerRight', 'false');
        this.isPlayerRight = (savedSide === 'true');
        this.difficulty = await Storage.get('difficulty', 'MEDIUM');

        this.p1Health = 3;
        this.p2Health = 3;
        this.playerStats = [0, 0, 0];
        
        this.fatalityManager = new FatalityManager(this);

        this.buildGame();
        this.applyTheme(); 
        this.isPlayingRound = false; 
        this.createNextRondaBtn(this.scale.width, this.scale.height, "PLAY");
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

        const timerStyle = { fontSize: '12px', fontFamily: CONFIG.FONTS.MAIN, fill: CONFIG.COLORS.TEXT_MAIN };
        const barW = width * 0.4;
        const barH = 20;
        const radius = 10; 

        // Barra P1
        const bg1 = this.add.graphics();
        bg1.fillStyle(0x333333, 1);
        bg1.fillRoundedRect(width * 0.25 - barW/2, BAR_Y - barH/2, barW, barH, radius);
        bg1.lineStyle(2, 0xffffff, 1);
        bg1.strokeRoundedRect(width * 0.25 - barW/2, BAR_Y - barH/2, barW, barH, radius);
        this.timeBar1 = this.add.rectangle(width * 0.25, BAR_Y, barW, barH, CONFIG.COLORS.SUCCESS);
        const mask1 = this.add.graphics().setVisible(false);
        mask1.fillStyle(0xffffff);
        mask1.fillRoundedRect(width * 0.25 - barW/2, BAR_Y - barH/2, barW, barH, radius);
        this.timeBar1.setMask(mask1.createGeometryMask());
        this.timeText1 = this.add.text(width * 0.25, BAR_Y, '5s', timerStyle).setOrigin(0.5);

        // Barra P2
        const bg2 = this.add.graphics();
        bg2.fillStyle(0x333333, 1);
        bg2.fillRoundedRect(width * 0.75 - barW/2, BAR_Y - barH/2, barW, barH, radius);
        bg2.lineStyle(2, 0xffffff, 1);
        bg2.strokeRoundedRect(width * 0.75 - barW/2, BAR_Y - barH/2, barW, barH, radius);
        this.timeBar2 = this.add.rectangle(width * 0.75, BAR_Y, barW, barH, CONFIG.COLORS.SUCCESS);
        const mask2 = this.add.graphics().setVisible(false);
        mask2.fillStyle(0xffffff);
        mask2.fillRoundedRect(width * 0.75 - barW/2, BAR_Y - barH/2, barW, barH, radius);
        this.timeBar2.setMask(mask2.createGeometryMask());
        this.timeText2 = this.add.text(width * 0.75, BAR_Y, '5s', timerStyle).setOrigin(0.5);

        const cpuNames = ['JUAN', 'ANA', 'LUIS', 'SOFIA', 'CARLOS', 'MARIA', 'DAVID', 'ELENA', 'PEDRO', 'LAURA', 'DIEGO', 'LUCIA'];
        this.cpuName = Phaser.Utils.Array.GetRandom(cpuNames);

        const p1X = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2X = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        const statusStyle = { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.LARGE, fill: CONFIG.COLORS.TEXT_MAIN };
        this.p1Status = this.add.text(p1X, (height * 0.18 * 0.4) + SAFE_TOP, this.playerName, statusStyle).setOrigin(0.5);
        this.p2Status = this.add.text(p2X, (HEAD_H * 0.4) + SAFE_TOP, this.cpuName, statusStyle).setOrigin(0.5);
        
        this.p1Score = this.createHearts(p1X, (HEAD_H * 0.7) + SAFE_TOP);
        this.p2Score = this.createHearts(p2X, (HEAD_H * 0.7) + SAFE_TOP);
        
        const emojiStyle = { fontSize: CONFIG.FONTS.SIZES.EMOJI_BIG, padding: { x: 20, y: 20 } };
        this.p1Emoji = this.add.text(p1X, height * 0.45, '✊', emojiStyle).setOrigin(0.5).setScale(0);
        this.p2Emoji = this.add.text(p2X, height * 0.45, '✊', emojiStyle).setOrigin(0.5).setScale(0);

        this.p1X = this.add.text(p1X, height * 0.45, '❌', emojiStyle).setOrigin(0.5).setAlpha(0).setDepth(10);
        this.p2X = this.add.text(p2X, height * 0.45, '❌', emojiStyle).setOrigin(0.5).setAlpha(0).setDepth(10);

        this.sound.volume = 0.5;
        this.game.events.on('blur', () => this.pauseGame());
        this.game.events.on('focus', () => this.resumeGame());

        if (window.Capacitor && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('pause', () => this.pauseGame());
            window.Capacitor.Plugins.App.addListener('resume', () => this.resumeGame());
        }

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
        
        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
        this.checkTutorial();
    }

    async checkTutorial() {
        const tutorialSeen = await Storage.get('tutorial_seen', 'false');
        if (tutorialSeen === 'false') {
            this.showTutorial();
        }
    }

    showTutorial() {
        const { width, height } = this.scale;
        this.tutorialContainer = this.add.container(0, 0).setDepth(3000);
        const overlay = this.add.rectangle(0, 0, width, height, CONFIG.COLORS.BG_DARK, 0.8).setOrigin(0).setInteractive();
        const style = { fontFamily: CONFIG.FONTS.MAIN, fontSize: '18px', fill: CONFIG.COLORS.TEXT_MAIN, align: 'center', wordWrap: { width: width * 0.8 } };
        const text = this.add.text(width/2, height * 0.4, "CHOOSE YOUR WEAPON\nBEFORE TIME RUNS OUT!", style).setOrigin(0.5);
        const btn = this.add.container(width/2, height * 0.6);
        const bRect = this.add.rectangle(0, 0, 200, 60, CONFIG.COLORS.P1_BLUE).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
        const bText = this.add.text(0, 0, "GOT IT!", { fontFamily: CONFIG.FONTS.MAIN, fontSize: '16px' }).setOrigin(0.5);
        btn.add([bRect, bText]);
        bRect.on('pointerdown', async () => {
            await Storage.set('tutorial_seen', 'true');
            this.tweens.add({ targets: this.tutorialContainer, alpha: 0, duration: 300, onComplete: () => this.tutorialContainer.destroy() });
        });
        this.tutorialContainer.add([overlay, text, btn]);
        const handEmoji = this.add.text(width/2, height * 0.8, "👆", { fontSize: '60px' }).setOrigin(0.5);
        this.tutorialContainer.add(handEmoji);
        this.tweens.add({ targets: handEmoji, y: '+=30', duration: 500, yoyo: true, repeat: -1 });
    }

    pauseGame() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.sound.pauseAll();
        if (this.isPlayingRound) this.tweens.pauseAll();
        const { width, height } = this.scale;
        this.pauseOverlay = this.add.container(0, 0).setDepth(4000);
        const bg = this.add.rectangle(0, 0, width, height, CONFIG.COLORS.BG_DARK, 0.7).setOrigin(0).setInteractive();
        const txt = this.add.text(width/2, height/2, "PAUSED", { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.TITLE, fill: CONFIG.COLORS.TEXT_MAIN }).setOrigin(0.5);
        const subTxt = this.add.text(width/2, height/2 + 60, "TAP TO RESUME", { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.NORMAL, fill: CONFIG.COLORS.P1_BLUE }).setOrigin(0.5);
        this.pauseOverlay.add([bg, txt, subTxt]);
        bg.on('pointerdown', () => this.resumeGame());
    }

    resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.sound.resumeAll();
        if (this.isPlayingRound) this.tweens.resumeAll();
        if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
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
            this.tweens.add({ targets: hContainer, scale: 1.15, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 150 });
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
                this.tweens.add({ targets: hContainer, y: -20, scale: 1.5, duration: 200, yoyo: true, onComplete: () => {
                    hContainer.setAlpha(0.5); hContainer.setScale(1);
                    const gfx = hContainer.list[0];
                    gfx.clear(); gfx.fillStyle(0x333333, 1); gfx.lineStyle(2, 0x888888, 1);
                    this.redrawHeart(gfx);
                }});
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
        const leftColor = this.isPlayerRight ? CONFIG.COLORS.CPU_RED : CONFIG.COLORS.P1_BLUE; 
        const rightColor = this.isPlayerRight ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;
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
        this.p1ButtonsBg = []; this.p2ButtonsBg = [];
        this.p1ButtonsTxt = []; this.p2ButtonsTxt = [];
        const choices = ['ROCK', 'PAPER', 'SCISSORS'];
        const emojis = ['✊', '✋', '✌️'];
        const startY = footerTop || (height * 0.75);
        const p1X = this.isPlayerRight ? width * 0.75 : width * 0.25;
        const p2X = this.isPlayerRight ? width * 0.25 : width * 0.75;
        choices.forEach((name, i) => {
            const yPos = startY + 80 + (i * 100);
            this.makeSingleBtn(p1X, yPos, name, emojis[i], true, i);
            this.makeSingleBtn(p2X, yPos, name, emojis[i], false, i);
        });
    }

    makeSingleBtn(x, y, name, emoji, isP1, index) {
        let baseColor = isP1 ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;
        let container = this.add.container(x, y).setDepth(500); 
        const bg = this.add.circle(0, 0, 38, baseColor).setStrokeStyle(CONFIG.UI.BORDER_WIDTH, 0xffffff);
        const emo = this.add.text(0, 0, emoji, { fontSize: CONFIG.FONTS.SIZES.EMOJI, padding: { x: 10, y: 10 } }).setOrigin(0.5);
        const txt = this.add.text(0, 50, name, { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.SMALL, fill: CONFIG.COLORS.TEXT_MAIN }).setOrigin(0.5);
        container.add([bg, emo, txt]);
        const audioKeys = ['sfx_rock', 'sfx_paper', 'sfx_scissors'];
        if (isP1) {
            this.p1ButtonsBg[index] = bg; this.p1ButtonsTxt[index] = txt;
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
                if (!this.isPlayingRound || this.isResolving) return;
                this.tweens.add({ targets: container, scale: 0.9, duration: CONFIG.TIMING.BUTTON_BOUNCE, yoyo: true });
                this.sound.play(audioKeys[index]);
                if (navigator.vibrate) navigator.vibrate(20);
                this.handleInput(index);
            });
        } else {
            this.p2ButtonsBg[index] = bg; this.p2ButtonsTxt[index] = txt;
        }
    }

    createControls(width, height, safeBottom = 0) {
        const SAFE_BOTTOM = Math.max(safeBottom, 20);
        const BTN_Y = height - 60 - (SAFE_BOTTOM > 20 ? SAFE_BOTTOM / 2 : 0);
        this.configBtn = this.add.text(60, BTN_Y, '⚙️', { fontSize: '30px', padding: { x: 5, y: 5 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2000);
        this.configBtn.on('pointerdown', () => {
            this.tweens.add({ targets: this.configBtn, scale: 1.2, duration: 100, yoyo: true });
            this.scene.launch('SettingsScene');
            this.scene.get('SettingsScene').events.once('settings-closed', () => this.applyTheme());
        });
        // MUTE BUTTON
        // Sincronizar estado inicial con el motor de audio
        const currentMuteState = this.sound.mute;
        const icon = currentMuteState ? '🔊' : '🔇';
        
        this.muteBtn = this.add.text(width - 60, BTN_Y, icon, { fontSize: '30px', padding: { x: 5, y: 5 } })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(2000);
            
        this.muteBtn.on('pointerdown', () => {
            // Invertir el estado global de mute
            this.sound.mute = !this.sound.mute;
            
            // Actualizar icono según el nuevo estado
            this.muteBtn.setText(this.sound.mute ? '🔊' : '🔇');
            
            this.tweens.add({ targets: this.muteBtn, scale: 1.2, duration: 100, yoyo: true });
        });
        this.switchBtn = this.add.text(width / 2, height - 130 - (SAFE_BOTTOM > 20 ? SAFE_BOTTOM / 2 : 0), '⇄', { fontSize: '40px' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2000);
        this.switchBtn.on('pointerdown', () => {
            if (this.isPlayingRound || this.isSwitchingSide) return;
            this.switchSides();
            this.tweens.add({ targets: this.switchBtn, scale: 1.2, duration: 100, yoyo: true });
        });
        this.stopBtn = this.add.container(width / 2, BTN_Y);
        const sShadow = this.add.graphics(); sShadow.fillStyle(0x000000, 0.5); sShadow.fillRoundedRect(-115, -20, 240, 50, CONFIG.UI.BUTTON_RADIUS);
        const sBg = this.add.graphics(); sBg.fillStyle(CONFIG.COLORS.CPU_RED, 1); sBg.fillRoundedRect(-120, -25, 240, 50, CONFIG.UI.BUTTON_RADIUS); sBg.lineStyle(2, 0xffffff, 1); sBg.strokeRoundedRect(-120, -25, 240, 50, CONFIG.UI.BUTTON_RADIUS);
        let sText = this.add.text(0, 0, 'QUIT GAME', { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.SMALL, fill: CONFIG.COLORS.TEXT_MAIN }).setOrigin(0.5);
        const sHit = this.add.rectangle(0, 0, 240, 50, 0x000000, 0).setInteractive({ useHandCursor: true });
        this.stopBtn.add([sShadow, sBg, sText, sHit]);
        sHit.on('pointerdown', () => {
             if (navigator.vibrate) navigator.vibrate(20);
             this.tweens.add({ targets: this.stopBtn, scale: 0.95, duration: CONFIG.TIMING.BUTTON_BOUNCE, yoyo: true });
             this.tweens.add({ targets: this.cameras.main, alpha: 0, duration: 300, onComplete: () => this.scene.start('MainMenuScene') });
        });
    }

    handleInput(index) {
        if (this.isResolving) return;
        this.isResolving = true; this.playerStats[index]++; this.resetButtonColors();
        if (this.p1ButtonsBg[index]) { this.p1ButtonsBg[index].setFillStyle(0xFFFFFF); this.p1ButtonsTxt[index].setFill(CONFIG.COLORS.TEXT_DARK); }
        this.sound.play(['sfx_rock', 'sfx_paper', 'sfx_scissors'][index]);
        this.time.delayedCall(800, () => this.resolveRound(index));
    }

    startRound() {
        this.isResolving = false; this.isPlayingRound = true; 
        this.p1X.setAlpha(0); this.p2X.setAlpha(0);
        const { width, height } = this.scale;
        const CENTER_X = width / 2;
        const p1TargetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2TargetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        this.p1Emoji.setText('✊').setScale(1).setAlpha(1);
        this.p2Emoji.setText('✊').setScale(1).setAlpha(1);
        this.p1Emoji.setAngle(this.isPlayerRight ? -90 : 90).setFlipX(!this.isPlayerRight);
        this.p2Emoji.setAngle(this.isPlayerRight ? 90 : -90).setFlipX(this.isPlayerRight);
        this.p1Emoji.x = p1TargetX < CENTER_X ? -200 : width + 200;
        this.p2Emoji.x = p2TargetX < CENTER_X ? -200 : width + 200;
        this.tweens.add({ targets: [this.p1Emoji, this.p2Emoji], x: (target) => (target === this.p1Emoji ? p1TargetX : p2TargetX), duration: 500, ease: 'Back.easeOut', onStart: () => this.sound.play('sfx_reveal', { volume: 0.3 }) });
        [this.timeBar1, this.timeBar2].forEach(bar => { bar.setVisible(true).setFillStyle(CONFIG.COLORS.SUCCESS).width = (width * 0.4); });
        this.timeBar1.alpha = 0; this.timeBar2.alpha = 0; this.timeText1.alpha = 0; this.timeText2.alpha = 0;
        this.tweens.add({ targets: [this.timeBar1, this.timeBar2, this.timeText1, this.timeText2], alpha: 1, duration: 300 });
        this.tweens.add({ targets: [this.timeBar1, this.timeBar2], width: 0, duration: CONFIG.TIMING.ROUND_DURATION, onUpdate: (tween) => {
            const remaining = Math.ceil((1 - tween.progress) * 5);
            this.timeText1.setText(remaining + 's'); this.timeText2.setText(remaining + 's');
            if (tween.progress > 0.7) { this.timeBar1.setFillStyle(CONFIG.COLORS.CPU_RED); this.timeBar2.setFillStyle(CONFIG.COLORS.CPU_RED); }
        }, onComplete: () => this.resolveRound(-1) });
    }

    resolveRound(playerChoice) {
        this.isResolving = true;
        this.tweens.killTweensOf([this.timeBar1, this.timeBar2, this.p1Emoji, this.p2Emoji]);
        const cpuChoice = this.getCpuChoice();
        const p1BaseAngle = this.p1Emoji.angle;
        const p2BaseAngle = this.p2Emoji.angle;
        this.p1Emoji.setOrigin(0.5, 1); this.p2Emoji.setOrigin(0.5, 1);
        const offset = 60; 
        this.p1Emoji.x += (p1BaseAngle > 0 ? -offset : offset); 
        this.p2Emoji.x += (p2BaseAngle > 0 ? -offset : offset);
        this.tweens.add({ targets: this.p1Emoji, angle: p1BaseAngle - 90, duration: 150, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => {
            this.p1Emoji.setAngle(p1BaseAngle).setOrigin(0.5); this.p1Emoji.x -= (p1BaseAngle > 0 ? -offset : offset); 
        }});
        this.tweens.add({ targets: this.p2Emoji, angle: p2BaseAngle + 90, duration: 150, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => {
            this.p2Emoji.setAngle(p2BaseAngle).setOrigin(0.5); this.p2Emoji.x -= (p2BaseAngle > 0 ? -offset : offset); 
            this.showResults(playerChoice, cpuChoice);
        }});
    }

    getCpuChoice() { return OpponentAI.getChoice(this.difficulty, this.playerStats); }

    showResults(p1, p2) {
        this.sound.stopAll();
        const icons = ['✊', '✋', '✌️'];
        if (this.p1Emoji) this.p1Emoji.setText(p1 === -1 ? '❌' : icons[p1]);
        if (this.p2Emoji) this.p2Emoji.setText(icons[p2]);
        this.tweens.add({ targets: [this.p1Emoji, this.p2Emoji], scale: 1.5, duration: 100, yoyo: true, ease: 'Back.easeOut' });
        let resultText = ""; let color = CONFIG.COLORS.TEXT_MAIN;
        if (p1 === -1) { resultText = "TIME'S UP!"; color = "#ff0000"; this.p1Health--; this.sound.play('sfx_lose'); this.playImpactEffect(CONFIG.COLORS.CPU_RED, 0.8); }
        else if (p1 === p2) { resultText = "DRAW!"; this.sound.play('sfx_tie'); this.playImpactEffect(0xaaaaaa, 0.5); this.p2Status.setText("DRAW!").setFill(color).setScale(0); this.tweens.add({ targets: this.p2Status, scale: 1.2, duration: 400, ease: 'Bounce.easeOut' }); }
        else if ((p1 === 0 && p2 === 2) || (p1 === 1 && p2 === 0) || (p1 === 2 && p2 === 1)) { resultText = "YOU WIN!"; color = "#" + CONFIG.COLORS.P1_BLUE.toString(16); this.p2Health--; this.sound.play('sfx_win'); this.tweens.add({ targets: this.p2X, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Bounce.easeOut' }); this.playImpactEffect(CONFIG.COLORS.P1_BLUE, 1.0); }
        else { resultText = "YOU LOSE!"; color = "#" + CONFIG.COLORS.CPU_RED.toString(16); this.p1Health--; this.sound.play('sfx_lose'); this.tweens.add({ targets: this.p1X, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Bounce.easeOut' }); this.playImpactEffect(CONFIG.COLORS.CPU_RED, 0.8); }
        this.p1Status.setText(resultText).setFill(color).setScale(0);
        this.tweens.add({ targets: this.p1Status, scale: 1.2, duration: 400, ease: 'Bounce.easeOut' });
        this.updateHearts(this.p1Score, this.p1Health); this.updateHearts(this.p2Score, this.p2Health);
        if (this.p2Health <= 0) { this.time.delayedCall(500, () => this.triggerFatality(p1, this.p2Emoji, this.p1Emoji, true)); } 
        else if (this.p1Health <= 0) { this.time.delayedCall(500, () => this.triggerFatality(p2, this.p1Emoji, this.p2Emoji, false)); } 
        else { this.time.delayedCall(600, () => this.createNextRondaBtn(this.scale.width, this.scale.height)); }
    }

    triggerFatality(choiceIndex, target, attacker, isPlayerWin) {
        this.tweens.add({ targets: [this.p1Status, this.p2Status, this.p1Score, this.p2Score, this.timeText1, this.timeText2], alpha: 0, duration: 200 });
        this.fatalityManager.play(choiceIndex, target, attacker, isPlayerWin, (winState) => this.finishGame(winState));
    }

    async finishGame(isPlayerWin) {
        const winnerName = isPlayerWin ? this.playerName : this.cpuName;
        let currentStreak = parseInt(await Storage.get('streak_current', '0'));
        let bestStreak = parseInt(await Storage.get('streak_best', '0'));
        if (isPlayerWin) { currentStreak++; if (currentStreak > bestStreak) { bestStreak = currentStreak; await Storage.set('streak_best', bestStreak); } } else { currentStreak = 0; }
        await Storage.set('streak_current', currentStreak);
        this.tweens.add({ targets: this.cameras.main, alpha: 0, duration: CONFIG.TIMING.FADE_DURATION, onComplete: () => this.scene.start('GameOverScene', { winner: winnerName, streak: currentStreak, isNewRecord: (isPlayerWin && currentStreak === bestStreak && currentStreak > 0) }) });
    }

    playImpactEffect(color, intensity) {
        this.cameras.main.flash(200 * intensity, 255, 255, 255); this.cameras.main.shake(200 * intensity, 0.01 * intensity);
        if (this.vfx) {
            const midX = (this.p1Emoji.x + this.p2Emoji.x) / 2; const midY = (this.p1Emoji.y + this.p2Emoji.y) / 2;
            this.vfx.setPosition(midX, midY); this.vfx.forEachAlive(p => p.tint = color); this.vfx.explode(30 + (20 * intensity)); 
        }
    }

    createNextRondaBtn(width, height, labelText = "NEXT") {
        this.isPlayingRound = false; 
        const currentColor = CONFIG.COLORS.TEXT_MAIN;
        this.p1Status.setText(this.playerName).setFill(currentColor);
        
        if (this.nextRondaBtn) this.nextRondaBtn.destroy();
        
        this.nextRondaBtn = this.add.container(width / 2, height * 0.45).setDepth(2000);
        
        const circle = this.add.circle(0, 0, 75, CONFIG.COLORS.SUCCESS).setStrokeStyle(4, 0xffffff);
        const text = this.add.text(0, 0, labelText, { 
            fontFamily: CONFIG.FONTS.MAIN, 
            fontSize: labelText.length > 5 ? '18px' : '24px', 
            fill: '#ffffff' 
        }).setOrigin(0.5);
        
        this.nextRondaBtn.add([circle, text]);
        
        // Interactividad directa en el contenedor
        this.nextRondaBtn.setInteractive(new Phaser.Geom.Circle(0, 0, 75), Phaser.Geom.Circle.Contains);
        
        this.nextRondaBtn.setScale(0);
        this.tweens.add({ targets: this.nextRondaBtn, scale: 1, duration: 400, ease: 'Back.easeOut' });
        
        this.nextRondaBtn.on('pointerdown', () => { 
            this.nextRondaBtn.setScale(0.9); 
            if (navigator.vibrate) navigator.vibrate(20); 
        });
        
        this.nextRondaBtn.on('pointerup', () => { 
            this.nextRondaBtn.destroy(); 
            this.nextRondaBtn = null; 
            this.startRound(); 
        });
    }

    drawGrid() {
        this.gridGraphics.clear(); const { width, height } = this.scale; const CENTER_X = width / 2;
        const leftColor = this.isPlayerRight ? CONFIG.COLORS.CPU_RED : CONFIG.COLORS.P1_BLUE; 
        const rightColor = this.isPlayerRight ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;
        this.gridGraphics.lineStyle(4, 0xffffff, 0.3); this.gridGraphics.lineBetween(CENTER_X, 0, CENTER_X, height);
        this.gridGraphics.lineStyle(4, leftColor, 1); this.gridGraphics.lineBetween(0, height * 0.18 + 50, CENTER_X - 2, height * 0.18 + 50);
        this.gridGraphics.lineBetween(0, height * 0.72, CENTER_X - 2, height * 0.72);
        this.gridGraphics.lineStyle(4, rightColor, 1); this.gridGraphics.lineBetween(CENTER_X + 2, height * 0.18 + 50, width, height * 0.18 + 50);
        this.gridGraphics.lineBetween(CENTER_X + 2, height * 0.72, width, height * 0.72);
    }
    
    resetButtonColors() {
        if (!this.p1ButtonsBg || !this.p1ButtonsTxt) return;
        for (let i = 0; i < 3; i++) {
            if (this.p1ButtonsBg[i]) { this.p1ButtonsBg[i].setFillStyle(CONFIG.COLORS.P1_BLUE); this.p1ButtonsTxt[i].setFill(CONFIG.COLORS.TEXT_MAIN); }
            if (this.p2ButtonsBg[i]) { this.p2ButtonsBg[i].setFillStyle(CONFIG.COLORS.CPU_RED); this.p2ButtonsTxt[i].setFill(CONFIG.COLORS.TEXT_MAIN); }
        }
    }

    switchSides() {
        if (this.isSwitchingSide) return;
        this.isSwitchingSide = true; this.isPlayerRight = !this.isPlayerRight;
        Storage.set('isPlayerRight', this.isPlayerRight); this.drawGrid();
        const { width, height } = this.scale; this.updateMainMargins(width, height);
        const CENTER_X = width / 2; const p1X = this.isPlayerRight ? width * 0.75 : width * 0.25; const p2X = this.isPlayerRight ? width * 0.25 : width * 0.75;
        const p1EmojiX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5; const p2EmojiX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        this.p1Emoji.setFlipX(!this.isPlayerRight); this.p2Emoji.setFlipX(this.isPlayerRight);
        this.tweens.add({ targets: [this.p1Status, this.p1Score], x: p1EmojiX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p2Status, this.p2Score], x: p2EmojiX, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p1Emoji, this.p1X], x: p1EmojiX, angle: this.isPlayerRight ? -90 : 90, duration: 300, ease: 'Power2' });
        this.tweens.add({ targets: [this.p2Emoji, this.p2X], x: p2EmojiX, angle: this.isPlayerRight ? 90 : -90, duration: 300, ease: 'Power2' });
        this.p1ButtonsBg.forEach((btn, i) => { if(btn && btn.parentContainer) this.tweens.add({ targets: btn.parentContainer, x: p1X, duration: 300, ease: 'Back.easeOut' }); });
        this.p2ButtonsBg.forEach((btn, i) => { if(btn && btn.parentContainer) this.tweens.add({ targets: btn.parentContainer, x: p2X, duration: 300, ease: 'Back.easeOut' }); });
        this.time.delayedCall(310, () => { this.isSwitchingSide = false; });
    }
}