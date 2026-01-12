import { CONFIG } from '../data/config.js';
import { Storage } from '../managers/Storage.js';
import { FatalityManager } from '../managers/FatalityManager.js';
import { OpponentAI } from '../managers/OpponentAI.js';
import { AudioManager } from '../managers/AudioManager.js';
import { DIALOGUES } from '../managers/DialogueManager.js';
import { OPPONENTS } from '../data/Opponents.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { CombatUI } from '../ui/CombatUI.js';
import { DialogueBox } from '../ui/components/DialogueBox.js';
import { LAYOUT } from '../data/Layout.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.p1Health = 3;
        this.p2Health = 3;
        this.canPlay = true; 
        this.playerStats = [0, 0, 0];
        this.playerName = 'PLAYER 1';

        this.dialogueDecks = { P1: {}, CPU: {} };
        this.isSwitchingSide = false;
    }

    getDialoguePhrase(speaker, type) {
        if (speaker === 'CPU') {
            const enemy = OPPONENTS.ZORG; 
            const typeKey = type.toLowerCase();
            if (enemy.dialogues && enemy.dialogues[typeKey]) {
                return enemy.dialogues[typeKey];
            }
        }
        
        if (!this.dialogueDecks[speaker][type] || this.dialogueDecks[speaker][type].length === 0) {
            this.dialogueDecks[speaker][type] = Phaser.Utils.Array.Shuffle([...DIALOGUES[speaker][type]]);
        }
        return this.dialogueDecks[speaker][type].pop();
    }

    applyTheme() {
        const theme = CONFIG.THEME; 
        
        Storage.get('bgDim', false).then(bgDim => {
            const bgColor = bgDim ? 'rgba(0,10,0,0.8)' : 'rgba(0,0,0,0)';
            if (this.cameras && this.cameras.main) {
                this.cameras.main.setBackgroundColor(bgColor);
            }
        });
        
        this.ui.applyTheme();
        
        if (this.p1ButtonsBg) {
            this.p1ButtonsBg.forEach(bg => {
                if (bg) bg.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, theme.PRIMARY);
            });
        }
        if (this.p2ButtonsBg) {
            this.p2ButtonsBg.forEach(bg => {
                if (bg) bg.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, theme.SECONDARY);
            });
        }
        
        this.updateMuteIcon();
    }

    updateMuteIcon() {
        if (this.ui.elements.muteBtn) {
            this.ui.elements.muteBtn.setText(this.sound.mute ? '🔇' : '🔊');
        }
    }

    async create() {
        this.ui = new CombatUI(this);
        
        this.playerName = PlayerManager.getName();
        this.playerSpecies = PlayerManager.getSpecies();
        this.playerPlanet = PlayerManager.getPlanet();
        this.playerAvatar = PlayerManager.getAvatar();
        
        this.isPlayerRight = await Storage.get('isPlayerRight', false);
        this.difficulty = await Storage.get('difficulty', 'MEDIUM');

        this.p1Health = 3;
        this.p2Health = OPPONENTS.ZORG.stats.health;
        this.playerStats = [0, 0, 0];
        this.activeBubbles = [];

        this.fatalityManager = new FatalityManager(this);

        this.buildGame();
        this.applyTheme(); 
        this.isPlayingRound = false; 
        
        this.nextRondaBtn = this.ui.createNextRondaBtn("PLAY", this.barY);
        this.setupNextRoundBtnListeners();

        const tutorialSeen = await Storage.get('tutorial_seen', false);
        if (!tutorialSeen) {
            this.showTutorial();
        }
    }

    buildGame() {
        const { width, height } = this.scale;
        const safeTop = this.game.registry.get('safeTop') || 0;
        const SAFE_TOP = Math.max(safeTop, 40); 
        const CENTER_X = width / 2;
        const FOOT_Y = LAYOUT.getGridBottom(height);
        this.barY = FOOT_Y + LAYOUT.COMBAT.TIMER_BAR_OFFSET; 

        // 1. Márgenes y Grilla
        this.ui.updateMainMargins(width, height);
        this.ui.drawGrid();

        const HUD_BASE_Y = SAFE_TOP + LAYOUT.HUD.OFFSET_Y; 
        const HEARTS_Y = LAYOUT.getHeartsY(height); 

        const p1X = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2X = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        // 2. HUD y Avatares
        this.ui.initHUD(p1X, p2X, HUD_BASE_Y, HEARTS_Y);
        this.ui.initAvatars(p1X, p2X, LAYOUT.getAvatarY(height));

        // 3. Emojis y Barras de Tiempo
        this.ui.initRoundElements(p1X, p2X, LAYOUT.getEmojiY(height));
        this.ui.initTimerBars(width, this.barY);
        this.ui.updateBarPositions(this.isPlayerRight, width);

        // 4. Botones y Controles
        this.createResponsiveButtons(width, height, FOOT_Y);
        this.ui.initControls(width, height, 20);

        // Aliases para compatibilidad
        this.p1Emoji = this.ui.elements.p1Emoji;
        this.p2Emoji = this.ui.elements.p2Emoji;
        this.p1X = this.ui.elements.p1X;
        this.p2X = this.ui.elements.p2X;
        this.timeBar1 = this.ui.elements.timeBar1;
        this.timeBar2 = this.ui.elements.timeBar2;
        this.timeText1 = this.ui.elements.timeText1;
        this.timeText2 = this.ui.elements.timeText2;
        this.p1Status = this.ui.elements.p1NameTxt;
        this.p2Status = this.ui.elements.p2NameTxt;
        this.switchBtn = this.ui.elements.switchBtn;

        this.cameras.main.alpha = 0;
        this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: CONFIG.TIMING.FADE_DURATION });
    }

    async checkTutorial() {
        const tutorialSeen = await Storage.get('tutorial_seen', 'false');
        if (tutorialSeen === 'false') { this.showTutorial(); }
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
            await Storage.set('tutorial_seen', true);
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

    createResponsiveButtons(width, height, footerTop) {
        this.p1Buttons = []; this.p2Buttons = [];
        const choices = ['ROCK', 'PAPER', 'SCISSORS'];
        const emojis = ['✊', '✋', '✌️'];
        const startY = footerTop || (height * 0.75);
        const p1X = this.isPlayerRight ? width * 0.75 : width * 0.25;
        const p2X = this.isPlayerRight ? width * 0.25 : width * 0.75;
        choices.forEach((name, i) => {
            const yPos = startY + 80 + (i * 100);
            this.p1Buttons[i] = this.makeSingleBtn(p1X, yPos, name, emojis[i], true, i);
            this.p2Buttons[i] = this.makeSingleBtn(p2X, yPos, name, emojis[i], false, i);
        });
    }

    makeSingleBtn(x, y, name, emoji, isP1, index) {
        let container = this.add.container(x, y).setDepth(500); 
        const borderColor = CONFIG.THEME.primary;
        const bg = this.add.circle(0, 0, 38, 0x000000, 0.1).setStrokeStyle(CONFIG.UI.BORDER_WIDTH, borderColor);
        
        const emo = this.add.text(0, 0, emoji, { fontSize: CONFIG.FONTS.SIZES.EMOJI, padding: { x: 10, y: 10 } }).setOrigin(0.5);
        const filter = this.add.circle(0, 0, 34, 0x000000, 0.4);
        const txt = this.add.text(0, 50, name, { fontFamily: CONFIG.FONTS.MAIN, fontSize: CONFIG.FONTS.SIZES.SMALL, fill: CONFIG.THEME.primaryStr }).setOrigin(0.5);
        
        container.add([bg, emo, filter, txt]);
        const audioKeys = ['sfx_rock', 'sfx_paper', 'sfx_scissors'];
        if (isP1) {
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
                if (!this.isPlayingRound || this.isResolving) return;
                this.tweens.add({ targets: container, scale: 0.9, duration: CONFIG.TIMING.BUTTON_BOUNCE, yoyo: true });
                AudioManager.playSFX(this, audioKeys[index]);
                if (navigator.vibrate) navigator.vibrate(20);
                this.handleInput(index);
            });
        }
        return container;
    }

    handleInput(index) {
        if (this.isResolving) return;
        this.isResolving = true; this.playerStats[index]++; this.resetButtonColors();
        
        const btn = this.p1Buttons[index];
        if (btn) {
            const bg = btn.list[0];
            const txt = btn.list[3];
            if (bg) bg.setFillStyle(0xFFFFFF); 
            if (txt) txt.setFill('#000000'); 
        }
        this.time.delayedCall(800, () => this.resolveRound(index));
    }

    resetButtonColors() {
        const textMain = CONFIG.THEME.primaryStr;
        [this.p1Buttons, this.p2Buttons].forEach(group => {
            if (group) {
                group.forEach(btn => {
                    if (btn) {
                        const bg = btn.list[0];
                        const txt = btn.list[3];
                        if (bg) bg.setFillStyle(0x000000, 0.1);
                        if (txt) txt.setFill(textMain);
                    }
                });
            }
        });
    }

    startRound() {
        if (this.nextRoundTimer) { this.nextRoundTimer.remove(false); this.nextRoundTimer = null; }
        this.tweens.killTweensOf([this.p1Emoji, this.p2Emoji, this.timeBar1, this.timeBar2, this.p1Status, this.p2Status, this.nextRondaBtn]);
        if (this.activeBubbles) { this.activeBubbles.forEach(b => { if (b && b.destroy) b.destroy(); }); this.activeBubbles = []; }

        this.isResolving = false; this.isPlayingRound = true; 
        this.p1X.setAlpha(0); this.p2X.setAlpha(0);
        
        const { width, height } = this.scale;
        const CENTER_X = width / 2;
        const p1TargetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2TargetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        
        this.p1Emoji.setText('✊').setScale(1).setAlpha(1).setOrigin(0.5);
        this.p2Emoji.setText('✊').setScale(1).setAlpha(1).setOrigin(0.5);
        this.p1Emoji.setAngle(this.isPlayerRight ? -90 : 90).setFlipX(!this.isPlayerRight);
        this.p2Emoji.setAngle(this.isPlayerRight ? 90 : -90).setFlipX(this.isPlayerRight);
        this.p1Emoji.x = p1TargetX < CENTER_X ? -200 : width + 200;
        this.p2Emoji.x = p2TargetX < CENTER_X ? -200 : width + 200;
        
        this.tweens.add({ targets: [this.p1Emoji, this.p2Emoji], x: (target) => (target === this.p1Emoji ? p1TargetX : p2TargetX), duration: 500, ease: 'Back.easeOut', onStart: () => AudioManager.playSFX(this, 'sfx_reveal', { volume: 0.3 * AudioManager.volumes.sfx }) });
        [this.timeBar1, this.timeBar2].forEach(bar => { bar.setVisible(true).setFillStyle(CONFIG.THEME.primary).width = (width * 0.4); });
        this.timeBar1.alpha = 0; this.timeBar2.alpha = 0; this.timeText1.alpha = 0; this.timeText2.alpha = 0;
        this.tweens.add({ targets: [this.timeBar1, this.timeBar2, this.timeText1, this.timeText2], alpha: 1, duration: 300 });
        
        this.timeBar1.scaleX = 1; this.timeBar2.scaleX = 1;

        this.tweens.add({ 
            targets: [this.timeBar1, this.timeBar2], scaleX: 0, duration: CONFIG.TIMING.ROUND_DURATION, 
            onUpdate: (tween) => {
                const remaining = Math.ceil((1 - tween.progress) * 5);
                this.timeText1.setText(remaining + 's'); this.timeText2.setText(remaining + 's');
                if (tween.progress > 0.7) { this.timeBar1.setFillStyle(0xff0000); this.timeBar2.setFillStyle(0xff0000); }
            }, 
            onComplete: () => this.resolveRound(-1) 
        });
    }

    resolveRound(playerChoice) {
        this.isResolving = true;
        this.tweens.killTweensOf([this.timeBar1, this.timeBar2, this.p1Emoji, this.p2Emoji]);
        const cpuChoice = this.getCpuChoice();
        
        const p1StartAngle = this.isPlayerRight ? -90 : 90;
        const p2StartAngle = this.isPlayerRight ? 90 : -90;
        this.p1Emoji.setAngle(p1StartAngle).setOrigin(0.5, 1);
        this.p2Emoji.setAngle(p2StartAngle).setOrigin(0.5, 1);
        
        const { width } = this.scale;
        const CENTER_X = width / 2;
        const p1FixedX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2FixedX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;
        this.p1Emoji.x = p1FixedX; this.p2Emoji.x = p2FixedX;

        const offset = 60; 
        this.p1Emoji.x += (p1StartAngle > 0 ? -offset : offset); 
        this.p2Emoji.x += (p2StartAngle > 0 ? -offset : offset);

        this.tweens.add({
            targets: this.p1Emoji, angle: p1StartAngle - 90, duration: 150, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', 
            onComplete: () => { this.p1Emoji.setAngle(p1StartAngle).setOrigin(0.5); this.p1Emoji.x = p1FixedX; }
        });

        this.tweens.add({
            targets: this.p2Emoji, angle: p2StartAngle + 90, duration: 150, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', 
            onComplete: () => { this.p2Emoji.setAngle(p2StartAngle).setOrigin(0.5); this.p2Emoji.x = p2FixedX; this.showResults(playerChoice, cpuChoice); }
        });
    }

    getCpuChoice() { return OpponentAI.getChoice(this.difficulty, this.playerStats); }

    showResults(p1, p2) {
        const icons = ['✊', '✋', '✌️'];
        if (this.p1Emoji) this.p1Emoji.setText(p1 === -1 ? '❌' : icons[p1]);
        if (this.p2Emoji) this.p2Emoji.setText(icons[p2]);
        this.tweens.add({ targets: [this.p1Emoji, this.p2Emoji], scale: 1.5, duration: 100, yoyo: true, ease: 'Back.easeOut' });
        
        let resultText = ""; let color = CONFIG.THEME.primaryStr;
        if (p1 === -1) { resultText = "TIME'S UP!"; color = "#ff0000"; this.p1Health--; AudioManager.playSFX(this, 'sfx_lose'); this.playImpactEffect("#ff0000", 0.8); this.time.delayedCall(1000, () => { this.showDialogue(true, 'LOSE'); this.showDialogue(false, 'WIN'); }); } 
        else if (p1 === p2) { resultText = "DRAW!"; AudioManager.playSFX(this, 'sfx_tie'); this.playImpactEffect(CONFIG.THEME.secondaryStr, 0.5); this.p2Status.setText("DRAW!").setFill(color).setScale(0); this.tweens.add({ targets: this.p2Status, scale: 1.2, duration: 400, ease: 'Bounce.easeOut' }); this.time.delayedCall(1000, () => { this.showDialogue(true, 'DRAW'); this.showDialogue(false, 'DRAW'); }); } 
        else if ((p1 === 0 && p2 === 2) || (p1 === 1 && p2 === 0) || (p1 === 2 && p2 === 1)) { resultText = "YOU WIN!"; color = CONFIG.THEME.primaryStr; this.p2Health--; AudioManager.playSFX(this, 'sfx_win'); this.tweens.add({ targets: this.p2X, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Bounce.easeOut' }); this.playImpactEffect(CONFIG.THEME.primary, 1.0); this.time.delayedCall(1000, () => { this.showDialogue(true, 'WIN'); this.showDialogue(false, 'LOSE'); }); } 
        else { resultText = "YOU LOSE!"; color = CONFIG.THEME.secondaryStr; this.p1Health--; AudioManager.playSFX(this, 'sfx_lose'); this.tweens.add({ targets: this.p1X, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Bounce.easeOut' }); this.playImpactEffect(CONFIG.THEME.secondaryStr, 0.8); this.time.delayedCall(1000, () => { this.showDialogue(true, 'LOSE'); this.showDialogue(false, 'WIN'); }); }

        this.p1Status.setText(resultText).setFill(color).setScale(0);
        this.tweens.add({ targets: this.p1Status, scale: 1.2, duration: 400, ease: 'Bounce.easeOut' });
        this.ui.updateHeartsUI(this.ui.elements.p1Hearts, this.p1Health); 
        this.ui.updateHeartsUI(this.ui.elements.p2Hearts, this.p2Health);
        
        if (this.p2Health <= 0) { this.time.delayedCall(500, () => this.triggerFatality(p1, this.p2Emoji, this.p1Emoji, true)); } 
        else if (this.p1Health <= 0) { this.time.delayedCall(500, () => this.triggerFatality(p2, this.p1Emoji, this.p2Emoji, false)); } 
        else { this.nextRoundTimer = this.time.delayedCall(1500, () => {
            this.nextRondaBtn = this.ui.createNextRondaBtn("NEXT", this.barY);
            this.setupNextRoundBtnListeners();
        }); }
    }

    triggerFatality(choiceIndex, target, attacker, isPlayerWin) {
        this.tweens.add({ targets: [this.p1Status, this.p2Status, this.ui.elements.p1Hearts, this.ui.elements.p2Hearts, this.timeText1, this.timeText2], alpha: 0, duration: 200 });
        this.fatalityManager.play(choiceIndex, target, attacker, isPlayerWin, (winState) => this.finishGame(winState));
    }

    async finishGame(isPlayerWin) {
        const winnerName = isPlayerWin ? this.playerName : this.cpuName;
        let currentStreak = await Storage.get('streak_current', 0);
        let isNewRecord = false;

        if (isPlayerWin) {
            currentStreak++;
            isNewRecord = await PlayerManager.setBestStreak(currentStreak);
        } else {
            currentStreak = 0;
        }

        await Storage.set('streak_current', currentStreak);
        
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: CONFIG.TIMING.FADE_DURATION,
            onComplete: () => {
                this.scene.start('GameOverScene', { 
                    winner: winnerName, 
                    streak: currentStreak,
                    isNewRecord: isNewRecord
                });
            }
        });
    }

    playImpactEffect(color, intensity) {
        this.cameras.main.flash(200 * intensity, 255, 255, 255); this.cameras.main.shake(200 * intensity, 0.01 * intensity);
        if (this.vfx) {
            const midX = (this.p1Emoji.x + this.p2Emoji.x) / 2; const midY = (this.p1Emoji.y + this.p2Emoji.y) / 2;
            this.vfx.setPosition(midX, midY); this.vfx.forEachAlive(p => p.tint = color); this.vfx.explode(30 + (20 * intensity)); 
        }
    }

    resetButtonColors() {
        const textMain = CONFIG.THEME.primaryStr;
        [this.p1Buttons, this.p2Buttons].forEach(group => {
            if (group) {
                group.forEach(btn => {
                    if (btn) {
                        const bg = btn.list[0];
                        const txt = btn.list[3];
                        if (bg) bg.setFillStyle(0x000000, 0.1);
                        if (txt) txt.setFill(textMain);
                    }
                });
            }
        });
    }

    updateBarPositions() {
        const { width } = this.scale;
        if (this.isPlayerRight) {
            this.timeBar1.setOrigin(0, 0.5).setX(width * 0.5 + 20).setMask(this.ui.elements.maskRight.createGeometryMask());
            this.timeBar2.setOrigin(1, 0.5).setX(width * 0.5 - 20).setMask(this.ui.elements.maskLeft.createGeometryMask());
        } else {
            this.timeBar1.setOrigin(1, 0.5).setX(width * 0.5 - 20).setMask(this.ui.elements.maskLeft.createGeometryMask());
            this.timeBar2.setOrigin(0, 0.5).setX(width * 0.5 + 20).setMask(this.ui.elements.maskRight.createGeometryMask());
        }
    }

    switchSides() {
        if (this.isSwitchingSide) return;
        this.isSwitchingSide = true; 
        
        this.isPlayerRight = !this.isPlayerRight;
        Storage.set('isPlayerRight', this.isPlayerRight); 
        this.ui.drawGrid();

        const { width, height } = this.scale; 
        this.ui.updateMainMargins(width, height);
        
        const CENTER_X = width / 2;
        const p1X = this.isPlayerRight ? width * 0.75 : width * 0.25;
        const p2X = this.isPlayerRight ? width * 0.25 : width * 0.75;
        
        const p1TargetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        const p2TargetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        // --- 1. MOVER HUD Y AVATARES ---
        this.tweens.add({ targets: [this.ui.elements.p1Profile, this.ui.elements.p1Avatar, this.ui.elements.p1Hearts], x: p1TargetX, duration: 400, ease: 'Power2' });
        this.tweens.add({ targets: [this.ui.elements.p2Profile, this.ui.elements.p2Avatar, this.ui.elements.p2Hearts], x: p2TargetX, duration: 400, ease: 'Power2' });

        // --- 2. MOVER EMOJIS ---
        this.p1Emoji.setFlipX(!this.isPlayerRight);
        this.p2Emoji.setFlipX(this.isPlayerRight);
        
        this.tweens.add({ targets: [this.p1Emoji, this.p1X], x: p1TargetX, angle: this.isPlayerRight ? -90 : 90, duration: 400, ease: 'Power2' });
        this.tweens.add({ targets: [this.p2Emoji, this.p2X], x: p2TargetX, angle: this.isPlayerRight ? 90 : -90, duration: 400, ease: 'Power2' });

        // --- 3. ACTUALIZAR BARRAS DE TIEMPO ---
        this.updateBarPositions();
        this.tweens.add({ targets: this.timeText1, x: this.isPlayerRight ? width * 0.75 : width * 0.25, duration: 400, ease: 'Power2' });
        this.tweens.add({ targets: this.timeText2, x: this.isPlayerRight ? width * 0.25 : width * 0.75, duration: 400, ease: 'Power2' });

        // --- 4. MOVER BOTONES ---
        this.p1Buttons.forEach(btn => { if (btn) this.tweens.add({ targets: btn, x: p1X, duration: 400, ease: 'Back.easeOut' }); });
        this.p2Buttons.forEach(btn => { if (btn) this.tweens.add({ targets: btn, x: p2X, duration: 400, ease: 'Back.easeOut' }); });

        // --- 5. MOVER BURBUJAS ---
        if (this.activeBubbles) {
            this.activeBubbles.forEach(bubble => {
                if (bubble && bubble.active) {
                    const bubbleTargetX = (bubble.x < CENTER_X) ? p1TargetX : p2TargetX;
                    this.tweens.add({ targets: bubble, x: bubbleTargetX, duration: 400, ease: 'Power2' });
                }
            });
        }

        this.time.delayedCall(410, () => { this.isSwitchingSide = false; });
    }

    setupNextRoundBtnListeners() {
        if (!this.nextRondaBtn) return;
        this.nextRondaBtn.on('pointerdown', () => { 
            AudioManager.playSFX(this, 'sfx_button');
            this.nextRondaBtn.setScale(0.9); 
            if (navigator.vibrate) navigator.vibrate(20); 
        });
        
        this.nextRondaBtn.on('pointerup', () => { 
            this.nextRondaBtn.destroy(); 
            this.nextRondaBtn = null; 
            this.startRound(); 
        });
    }

    showDialogue(isP1, type) {
        const speakerKey = isP1 ? 'P1' : 'CPU';
        const text = this.getDialoguePhrase(speakerKey, type);
        
        const { width, height } = this.scale;
        const CENTER_X = width / 2;
        let targetX;
        if (isP1) targetX = this.isPlayerRight ? CENTER_X * 1.5 : CENTER_X * 0.5;
        else targetX = this.isPlayerRight ? CENTER_X * 0.5 : CENTER_X * 1.5;

        const targetY = LAYOUT.getAvatarY(height) + 140;

        const color = isP1 ? CONFIG.COLORS.P1_BLUE : CONFIG.COLORS.CPU_RED;
        
        const bubble = new DialogueBox(this, targetX, targetY, text, color);
        if (!this.activeBubbles) this.activeBubbles = [];
        this.activeBubbles.push(bubble);
    }
}