const { EmojiReactions, REACTION_EMOJIS, createEmojiDisplay } = require('./EmojiReactions.js');

class FakeObject {
    constructor(x = 0, y = 0, text = undefined) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.list = [];
        this.handlers = {};
        this.alpha = 1;
        this.destroyed = false;
    }
    setDepth() {
        return this;
    }
    setStrokeStyle() {
        return this;
    }
    setOrigin() {
        return this;
    }
    setInteractive() {
        return this;
    }
    setAlpha(value) {
        this.alpha = value;
        return this;
    }
    setText(value) {
        this.text = value;
        return this;
    }
    add(children) {
        this.list.push(...children);
        return this;
    }
    on(event, handler) {
        this.handlers[event] = handler;
        return this;
    }
    emit(event) {
        this.handlers[event]?.();
    }
    destroy() {
        this.destroyed = true;
    }
}

describe('EmojiReactions', () => {
    let scene;
    let delayed;

    beforeEach(() => {
        delayed = [];
        scene = {
            add: {
                container: jest.fn((x, y) => new FakeObject(x, y)),
                circle: jest.fn(() => new FakeObject()),
                text: jest.fn((x, y, value) => new FakeObject(x, y, value)),
            },
            tweens: { add: jest.fn() },
            time: {
                delayedCall: jest.fn((ms, callback) => {
                    const timer = { ms, callback, remove: jest.fn() };
                    delayed.push(timer);
                    return timer;
                }),
            },
        };
    });

    it('creates your display and one slot per emoji below it', () => {
        const reactions = new EmojiReactions(scene);
        const panel = reactions.create(185, 1030, 1163);

        expect(scene.add.container).toHaveBeenCalledWith(185, 0);
        expect(reactions.display.y).toBe(1030);
        expect(reactions.display.list[1].text).toBe('💬');
        expect(scene.add.circle).toHaveBeenCalledWith(0, 0, 95, 0x000000, 0.45);
        expect(panel.list).toHaveLength(REACTION_EMOJIS.length + 1);
        expect(reactions.slots.every((slot) => slot.y === 1163)).toBe(true);
        expect(reactions.slots.map((slot) => slot.list[1].text)).toEqual(REACTION_EMOJIS);
    });

    it('sends the tapped emoji, shows it in your display and blocks spam during cooldown', () => {
        const onSend = jest.fn();
        const reactions = new EmojiReactions(scene, { onSend, cooldownMs: 2000 });
        reactions.create(185, 1030, 1163);

        reactions.slots[3].list[0].emit('pointerdown');
        reactions.slots[0].list[0].emit('pointerdown');

        expect(onSend).toHaveBeenCalledTimes(1);
        expect(onSend).toHaveBeenCalledWith(REACTION_EMOJIS[3]);
        expect(reactions.display.list[1].text).toBe(REACTION_EMOJIS[3]);
        expect(reactions.slots.every((slot) => slot.alpha === 0.4)).toBe(true);

        const cooldown = delayed.find((timer) => timer.ms === 2000);
        cooldown.callback();
        expect(reactions.send(0)).toBe(true);
        expect(onSend).toHaveBeenLastCalledWith(REACTION_EMOJIS[0]);
    });

    it('restores the previous content of a display after showing an emoji', () => {
        const reactions = new EmojiReactions(scene, { holdMs: 2500 });
        const rivalDisplay = createEmojiDisplay(scene, 535, 1030, { placeholder: '?' });

        reactions.showInDisplay(rivalDisplay, '😡');
        reactions.showInDisplay(rivalDisplay, '😂');
        expect(rivalDisplay.list[1].text).toBe('😂');

        delayed[delayed.length - 1].callback();
        expect(rivalDisplay.list[1].text).toBe('?');
    });

    it('does not overwrite a display whose content changed meanwhile (e.g. revealed choice)', () => {
        const reactions = new EmojiReactions(scene, { holdMs: 2500 });
        const rivalDisplay = createEmojiDisplay(scene, 535, 1030, { placeholder: '?' });

        reactions.showInDisplay(rivalDisplay, '😡');
        rivalDisplay.list[1].setText('✌️');
        delayed[0].callback();

        expect(rivalDisplay.list[1].text).toBe('✌️');
        expect(reactions.showInDisplay(null, '😡')).toBe(false);
    });

    it('destroys its panel and pending timers', () => {
        const reactions = new EmojiReactions(scene);
        const panel = reactions.create(185, 1030, 1163);
        reactions.send(0);

        reactions.destroy();

        expect(panel.destroyed).toBe(true);
        expect(delayed.every((timer) => timer.remove.mock.calls.length === 1)).toBe(true);
        expect(reactions.slots).toHaveLength(0);
    });
});
