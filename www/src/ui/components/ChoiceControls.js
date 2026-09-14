import { CONFIG } from '../../data/config.js';
import { LAYOUT } from '../../data/Layout.js';

/** Botones de piedra, papel y tijera que pertenecen al jugador y a la CPU. */
export class ChoiceControls {
    constructor(scene, onPlayerChoice) {
        this.scene = scene;
        this.onPlayerChoice = onPlayerChoice;
        this.playerButtons = [];
        this.cpuButtons = [];
    }

    create(width, height, footerTop, isPlayerRight, isOnline = false) {
        const choices = ['ROCK', 'PAPER', 'SCISSORS'];
        const emojis = ['✊', '✋', '✌️'];
        const startY = footerTop || LAYOUT.getGridBottom(height);
        const playerX = LAYOUT.getColumnX(width, isPlayerRight);
        const cpuX = LAYOUT.getColumnX(width, !isPlayerRight);
        choices.forEach((name, index) => {
            const y = startY + LAYOUT.BUTTONS.START_OFFSET + index * LAYOUT.BUTTONS.SPACING;
            this.playerButtons[index] = this.createButton(
                playerX,
                y,
                name,
                emojis[index],
                true,
                index
            );
            if (!isOnline) {
                this.cpuButtons[index] = this.createButton(
                    cpuX,
                    y,
                    name,
                    emojis[index],
                    false,
                    index
                );
            }
        });
        return { playerButtons: this.playerButtons, cpuButtons: this.cpuButtons };
    }

    createButton(x, y, name, emoji, isPlayer, index) {
        const container = this.scene.add.container(x, y).setDepth(500);
        const background = this.scene.add
            .circle(0, 0, 38, 0x000000, 0.1)
            .setStrokeStyle(CONFIG.UI.BORDER_WIDTH, CONFIG.THEME.primary);
        const emojiText = this.scene.add
            .text(0, 0, emoji, { fontSize: CONFIG.FONTS.SIZES.EMOJI, padding: { x: 10, y: 10 } })
            .setOrigin(0.5);
        const filter = this.scene.add.circle(0, 0, 38, 0x000000, 0.4);
        const label = this.scene.add
            .text(0, 50, name, {
                fontFamily: CONFIG.FONTS.MAIN,
                fontSize: CONFIG.FONTS.SIZES.SMALL,
                fill: CONFIG.THEME.primaryStr,
            })
            .setOrigin(0.5);
        container.add([background, emojiText, filter, label]);
        if (isPlayer) {
            background.setInteractive({ useHandCursor: true });
            background.on('pointerdown', () => this.onPlayerChoice(index));
        }
        return container;
    }

    move(isPlayerRight, width) {
        const playerX = LAYOUT.getColumnX(width, isPlayerRight);
        const cpuX = LAYOUT.getColumnX(width, !isPlayerRight);
        this.playerButtons.forEach((button) => {
            if (button)
                this.scene.tweens.add({
                    targets: button,
                    x: playerX,
                    duration: 400,
                    ease: 'Back.easeOut',
                });
        });
        this.cpuButtons.forEach((button) => {
            if (button)
                this.scene.tweens.add({
                    targets: button,
                    x: cpuX,
                    duration: 400,
                    ease: 'Back.easeOut',
                });
        });
    }

    resetColors() {
        [this.playerButtons, this.cpuButtons].forEach((buttons) => {
            buttons.forEach((button) => {
                const background = button?.list[0];
                const label = button?.list[3];
                if (background) background.setFillStyle(0x000000, 0.1);
                if (label) label.setFill(CONFIG.THEME.primaryStr);
            });
        });
    }

    applyTheme() {
        this.playerButtons.forEach((button) =>
            button?.list[0]?.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, CONFIG.THEME.primary)
        );
        this.cpuButtons.forEach((button) =>
            button?.list[0]?.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, CONFIG.THEME.secondary)
        );
    }
}
