import { CONFIG } from '../data/config.js';
import { RetroButton } from './components/RetroButton.js';
import { HeartBar } from './components/HeartBar.js';
import { DataManager } from '../managers/DataManager.js';

export class OnlineCombatUI {
    constructor(scene, p2Name = 'OPPONENT') {
        this.scene = scene;
        this.p2Name = p2Name;
        this.elements = {};
    }

    create(width, height) {
        // --- 1. TOP HUD (P1 & P2 LIVES) ---
        const topY = height * 0.08;
        const halfWidth = width / 2;

        // P1 Header & Lives (Left)
        this.elements.p1Text = this.scene.add
            .text(width * 0.25, topY - 25, DataManager.getName(), {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.SMALL,
                fill: CONFIG.THEME.primaryStr,
            })
            .setOrigin(0.5);
        this.elements.p1Hearts = new HeartBar(this.scene, width * 0.25, topY + 10);

        // Divider
        this.scene.add
            .graphics()
            .lineStyle(2, CONFIG.THEME.primary, 0.5)
            .lineBetween(halfWidth, topY - 35, halfWidth, topY + 30);

        // P2 Header & Lives (Right)
        this.elements.p2Text = this.scene.add
            .text(width * 0.75, topY - 25, this.p2Name, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.SMALL,
                fill: CONFIG.THEME.secondaryStr,
            })
            .setOrigin(0.5);
        this.elements.p2Hearts = new HeartBar(this.scene, width * 0.75, topY + 10);

        // --- 2. TIMER SECTION ---
        const timerY = height * 0.19;
        const timerBox = this.scene.add.graphics();
        timerBox.lineStyle(3, CONFIG.THEME.primary, 1);
        timerBox.fillStyle(0x000000, 0.8);
        timerBox.strokeRoundedRect(width * 0.05, timerY - 30, width * 0.9, 60, 10);
        timerBox.fillRoundedRect(width * 0.05, timerY - 30, width * 0.9, 60, 10);

        this.elements.timerText = this.scene.add
            .text(width / 2, timerY, '⏱️ TIME: 10', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.MEDIUM,
                fill: '#ffffff',
            })
            .setOrigin(0.5);

        // --- 3. ARENA SECTION (P1 BOX VS P2 BOX) ---
        const arenaY = height * 0.38;
        const boxSize = width * 0.38;
        const p1BoxX = width * 0.24;
        const p2BoxX = width * 0.76;

        // P1 Action Box
        const p1Box = this.scene.add.graphics();
        p1Box.lineStyle(3, CONFIG.THEME.primary, 1);
        p1Box.fillStyle(0x111122, 0.9);
        p1Box.strokeRect(p1BoxX - boxSize / 2, arenaY - boxSize / 2, boxSize, boxSize);
        p1Box.fillRect(p1BoxX - boxSize / 2, arenaY - boxSize / 2, boxSize, boxSize);

        this.elements.p1ChoiceDisplay = this.scene.add
            .text(p1BoxX, arenaY, '❓', { fontSize: '64px' })
            .setOrigin(0.5);

        // VS Circle Badge
        const vsBadge = this.scene.add.graphics();
        vsBadge.lineStyle(3, 0xffd700, 1);
        vsBadge.fillStyle(0x000000, 1);
        vsBadge.strokeCircle(width / 2, arenaY, 30);
        vsBadge.fillCircle(width / 2, arenaY, 30);

        this.scene.add
            .text(width / 2, arenaY, 'VS', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.SMALL,
                fill: '#ffd700',
            })
            .setOrigin(0.5);

        // P2 Action Box
        const p2Box = this.scene.add.graphics();
        p2Box.lineStyle(3, CONFIG.THEME.secondary, 1);
        p2Box.fillStyle(0x221111, 0.9);
        p2Box.strokeRect(p2BoxX - boxSize / 2, arenaY - boxSize / 2, boxSize, boxSize);
        p2Box.fillRect(p2BoxX - boxSize / 2, arenaY - boxSize / 2, boxSize, boxSize);

        this.elements.p2ChoiceDisplay = this.scene.add
            .text(p2BoxX, arenaY, '⏳', { fontSize: '64px' })
            .setOrigin(0.5);

        // --- 4. EMOTES SECTION ---
        const emoteY = height * 0.58;
        const emoteBoxH = height * 0.12;

        const p1EmoteBg = this.scene.add.graphics();
        p1EmoteBg.lineStyle(2, CONFIG.THEME.primary, 0.6);
        p1EmoteBg.strokeRect(width * 0.05, emoteY, width * 0.43, emoteBoxH);
        this.elements.p1EmoteText = this.scene.add
            .text(width * 0.265, emoteY + emoteBoxH / 2, 'EMOTES P1', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.MICRO,
                fill: CONFIG.THEME.primaryStr,
            })
            .setOrigin(0.5);

        const p2EmoteBg = this.scene.add.graphics();
        p2EmoteBg.lineStyle(2, CONFIG.THEME.secondary, 0.6);
        p2EmoteBg.strokeRect(width * 0.52, emoteY, width * 0.43, emoteBoxH);
        this.elements.p2EmoteText = this.scene.add
            .text(width * 0.735, emoteY + emoteBoxH / 2, 'EMOTES P2', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.MICRO,
                fill: CONFIG.THEME.secondaryStr,
            })
            .setOrigin(0.5);

        // --- 5. BOTTOM CONTROLS (ROCK, PAPER, SCISSORS) ---
        const controlsY = height * 0.78;
        const btnWidth = width * 0.27;
        const choices = [
            { name: 'ROCK', emoji: '✊', index: 0 },
            { name: 'PAPER', emoji: '✋', index: 1 },
            { name: 'SCISSORS', emoji: '✌️', index: 2 },
        ];

        this.elements.buttons = choices.map((c, i) => {
            const posX = width * 0.18 + i * (btnWidth + width * 0.05);
            const btn = new RetroButton(
                this.scene,
                posX,
                controlsY,
                `${c.emoji}\n${c.name}`,
                CONFIG.THEME.primary,
                () => {
                    if (this.onChoiceSelected) this.onChoiceSelected(c.index);
                }
            );
            return btn;
        });

        // --- 6. BOTTOM BANNER / ADS SPACE ---
        const adY = height * 0.93;
        const adBox = this.scene.add.graphics();
        adBox.lineStyle(1, 0x666666, 0.8);
        adBox.strokeRect(width * 0.05, adY - 20, width * 0.9, 40);

        this.scene.add
            .text(width / 2, adY, '[ ADS / INFO SPACE ]', {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.MICRO,
                fill: '#666666',
            })
            .setOrigin(0.5);
    }
}
