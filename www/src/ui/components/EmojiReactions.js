import { CONFIG } from '../../data/config.js';
import { LAYOUT } from '../../data/Layout.js';

export const REACTION_EMOJIS = ['😂', '😡', '😎', '👍', '💀'];

/**
 * Contenedor circular para mostrar un emoji grande (jugada o reacción).
 * Lo usan tanto el contenedor del rival como el tuyo, para que sean idénticos.
 */
export function createEmojiDisplay(
    scene,
    x,
    y,
    {
        placeholder = '?',
        strokeColor = CONFIG.THEME.primary,
        textColor = CONFIG.THEME.primaryStr,
    } = {}
) {
    const radius = LAYOUT.ONLINE.DISPLAY_RADIUS;
    const container = scene.add.container(x, y).setDepth(500);
    const background = scene.add
        .circle(0, 0, radius, 0x000000, 0.45)
        .setStrokeStyle(4, strokeColor);
    const icon = scene.add
        .text(0, 0, placeholder, {
            fontFamily: CONFIG.FONTS.MAIN,
            fontSize: '80px',
            fill: textColor,
            padding: { x: 16, y: 16 },
        })
        .setOrigin(0.5);
    container.add([background, icon]);
    return container;
}

/**
 * Panel de comunicación del jugador en Online Versus (parte inferior):
 * un contenedor donde se ven tus emojis y, debajo, la barra para elegirlos.
 * Con `showInDisplay` también se pintan los emojis del rival en su contenedor.
 */
export class EmojiReactions {
    constructor(
        scene,
        { emojis = REACTION_EMOJIS, cooldownMs = 2000, holdMs = 2500, onSend = () => {} } = {}
    ) {
        this.scene = scene;
        this.emojis = emojis;
        this.cooldownMs = cooldownMs;
        this.holdMs = holdMs;
        this.onSend = onSend;
        this.panel = null;
        this.display = null;
        this.slots = [];
        this.onCooldown = false;
        this.cooldownTimer = null;
        this.displayTimers = new Map();
    }

    /** Crea el panel en la columna `x`: contenedor en `displayY` y barra en `barY`. */
    create(x, displayY, barY) {
        const { SLOT_RADIUS, SPACING } = LAYOUT.EMOJI_BAR;
        this.panel = this.scene.add.container(x, 0).setDepth(600);
        this.display = createEmojiDisplay(this.scene, 0, displayY, { placeholder: '💬' });

        const firstX = -((this.emojis.length - 1) * SPACING) / 2;
        this.slots = this.emojis.map((emoji, index) => {
            const slot = this.scene.add.container(firstX + index * SPACING, barY);
            const background = this.scene.add
                .circle(0, 0, SLOT_RADIUS, 0x000000, 0.5)
                .setStrokeStyle(2, CONFIG.THEME.primary, 0.8);
            const icon = this.scene.add
                .text(0, 0, emoji, { fontSize: '26px', padding: { x: 6, y: 6 } })
                .setOrigin(0.5);
            slot.add([background, icon]);
            background.setInteractive({ useHandCursor: true });
            background.on('pointerdown', () => this.send(index));
            return slot;
        });

        this.panel.add([this.display, ...this.slots]);
        return this.panel;
    }

    /** Envía el emoji `index` y lo muestra en tu contenedor. Devuelve false si está en enfriamiento. */
    send(index) {
        const emoji = this.emojis[index];
        if (this.onCooldown || !emoji) return false;

        this.onCooldown = true;
        const slot = this.slots[index];
        if (slot) {
            this.scene.tweens.add({
                targets: slot,
                scale: 0.8,
                duration: 80,
                yoyo: true,
                ease: 'Quad.easeOut',
            });
        }
        this.slots.forEach((s) => s.setAlpha(0.4));
        this.cooldownTimer = this.scene.time.delayedCall(this.cooldownMs, () => {
            this.onCooldown = false;
            this.cooldownTimer = null;
            this.slots.forEach((s) => s.setAlpha(1));
        });

        this.showInDisplay(this.display, emoji);
        this.onSend(emoji);
        return true;
    }

    /**
     * Muestra `emoji` dentro de un contenedor (el tuyo o el del rival) durante
     * `holdMs` y luego restaura lo que había (placeholder o la jugada revelada).
     * Si mientras tanto el contenido cambió (p. ej. se reveló la jugada), no lo pisa.
     */
    showInDisplay(display, emoji) {
        const icon = display?.list?.[1];
        if (!icon || !emoji) return false;

        const pending = this.displayTimers.get(display);
        const previous = pending ? pending.previous : icon.text;
        pending?.timer?.remove?.(false);

        icon.setText(emoji);
        this.scene.tweens.add({
            targets: display,
            scale: 1.12,
            duration: 150,
            yoyo: true,
            ease: 'Back.easeOut',
        });

        const timer = this.scene.time.delayedCall(this.holdMs, () => {
            this.displayTimers.delete(display);
            if (icon.text === emoji) icon.setText(previous);
        });
        this.displayTimers.set(display, { timer, previous });
        return true;
    }

    /** Sigue al jugador cuando se cambia de lado. */
    move(x) {
        if (!this.panel) return;
        this.scene.tweens.add({ targets: this.panel, x, duration: 400, ease: 'Back.easeOut' });
    }

    applyTheme() {
        this.display?.list?.[0]?.setStrokeStyle(4, CONFIG.THEME.primary);
        this.slots.forEach((slot) => slot.list?.[0]?.setStrokeStyle(2, CONFIG.THEME.primary, 0.8));
    }

    destroy() {
        this.cooldownTimer?.remove?.(false);
        this.cooldownTimer = null;
        this.displayTimers.forEach(({ timer }) => timer?.remove?.(false));
        this.displayTimers.clear();
        this.panel?.destroy();
        this.panel = null;
        this.display = null;
        this.slots = [];
    }
}
