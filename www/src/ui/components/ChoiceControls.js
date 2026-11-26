import { CONFIG } from '../../data/config.js';
import { LAYOUT } from '../../data/Layout.js';
import { createEmojiDisplay } from './EmojiReactions.js';

/**
 * Botones de piedra, papel y tijera que pertenecen al jugador y a la CPU.
 *
 * En Online Versus los botones del jugador forman una fila horizontal bajo su
 * avatar y la parte inferior del rival muestra un contenedor con su jugada
 * (y sus emojis, que pinta `EmojiReactions`).
 */
export class ChoiceControls {
    constructor(scene, onPlayerChoice) {
        this.scene = scene;
        this.onPlayerChoice = onPlayerChoice;
        this.playerButtons = [];
        this.cpuButtons = [];
        this.onlineRivalDisplay = null;
        this.isOnline = false;
    }

    create(width, height, footerTop, isPlayerRight, isOnline = false) {
        const choices = ['ROCK', 'PAPER', 'SCISSORS'];
        const emojis = ['✊', '✋', '✌️'];
        const startY = footerTop || LAYOUT.getGridBottom(height);
        const playerX = LAYOUT.getColumnX(width, isPlayerRight);
        const cpuX = LAYOUT.getColumnX(width, !isPlayerRight);
        this.isOnline = isOnline;
        this.onlineRivalDisplay = null;

        if (isOnline) {
            const rowY = LAYOUT.getOnlineChoiceRowY(height);
            choices.forEach((name, index) => {
                this.playerButtons[index] = this.createButton(
                    this.getOnlineChoiceX(playerX, index),
                    rowY,
                    name,
                    emojis[index],
                    true,
                    index
                );
            });
            this.onlineRivalDisplay = createEmojiDisplay(
                this.scene,
                LAYOUT.getOnlinePanelX(width, !isPlayerRight),
                LAYOUT.getOnlineDisplayY(startY),
                {
                    placeholder: '?',
                    strokeColor: CONFIG.THEME.secondary,
                    textColor: CONFIG.THEME.secondaryStr,
                }
            );
        } else {
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
                this.cpuButtons[index] = this.createButton(
                    cpuX,
                    y,
                    name,
                    emojis[index],
                    false,
                    index
                );
            });
        }

        return {
            playerButtons: this.playerButtons,
            cpuButtons: this.cpuButtons,
            onlineRivalDisplay: this.onlineRivalDisplay,
        };
    }

    /** X de cada botón en la fila horizontal online (piedra a la izquierda, tijera a la derecha). */
    getOnlineChoiceX(columnX, index) {
        return columnX + (index - 1) * LAYOUT.ONLINE.CHOICE_SPACING;
    }

    showOnlineRivalChoice(choiceIndex) {
        if (!this.onlineRivalDisplay) return;
        const emojis = ['✊', '✋', '✌️'];
        const [background, icon] = this.onlineRivalDisplay.list || [];

        const hasValidChoice = choiceIndex >= 0 && choiceIndex < emojis.length;
        if (background) {
            background.setFillStyle(CONFIG.THEME.secondary, 0.35);
            background.setStrokeStyle(4, CONFIG.THEME.primary);
        }
        if (icon) {
            icon.setText(hasValidChoice ? emojis[choiceIndex] : '❌');
        }

        this.scene.tweens.add({
            targets: this.onlineRivalDisplay,
            scale: 1.12,
            duration: 150,
            yoyo: true,
            ease: 'Back.easeOut',
        });
    }

    resetOnlineRivalDisplay() {
        if (!this.onlineRivalDisplay) return;
        const [background, icon] = this.onlineRivalDisplay.list || [];
        if (background) {
            background.setFillStyle(0x000000, 0.45);
            background.setStrokeStyle(4, CONFIG.THEME.secondary);
        }
        if (icon) {
            icon.setText('?');
            icon.setFill(CONFIG.THEME.secondaryStr);
        }
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
        this.playerButtons.forEach((button, index) => {
            if (button)
                this.scene.tweens.add({
                    targets: button,
                    x: this.isOnline ? this.getOnlineChoiceX(playerX, index) : playerX,
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
        if (this.onlineRivalDisplay) {
            this.scene.tweens.add({
                targets: this.onlineRivalDisplay,
                x: LAYOUT.getOnlinePanelX(width, !isPlayerRight),
                duration: 400,
                ease: 'Back.easeOut',
            });
        }
    }

    resetColors() {
        [this.playerButtons, this.cpuButtons].forEach((buttons) => {
            buttons.forEach((button) => {
                if (!button) return;
                const background = button.list ? button.list[0] : null;
                const label = button.list ? button.list[3] : null;
                if (background) background.setFillStyle(0x000000, 0.1);
                if (label) label.setFill(CONFIG.THEME.primaryStr);
            });
        });
        this.resetOnlineRivalDisplay();
    }

    applyTheme() {
        this.playerButtons.forEach((button) =>
            button?.list[0]?.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, CONFIG.THEME.primary)
        );
        this.cpuButtons.forEach((button) =>
            button?.list[0]?.setStrokeStyle(CONFIG.UI.BORDER_WIDTH, CONFIG.THEME.secondary)
        );
        if (this.onlineRivalDisplay) {
            const [background, icon] = this.onlineRivalDisplay.list || [];
            background?.setStrokeStyle(4, CONFIG.THEME.secondary);
            icon?.setFill?.(CONFIG.THEME.secondaryStr);
        }
    }
}
