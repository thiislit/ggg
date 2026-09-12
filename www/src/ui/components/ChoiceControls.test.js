const { ChoiceControls } = require('./ChoiceControls.js');

class FakeObject {
    constructor() {
        this.list = [];
        this.handlers = {};
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
    add(children) {
        this.list.push(...children);
        return this;
    }
    setFillStyle() {
        return this;
    }
    on(event, handler) {
        this.handlers[event] = handler;
        return this;
    }
    emit(event) {
        this.handlers[event]?.();
    }
}

describe('ChoiceControls', () => {
    let scene;

    beforeEach(() => {
        scene = {
            add: {
                container: () => new FakeObject(),
                circle: () => new FakeObject(),
                text: () => new FakeObject(),
            },
            tweens: { add: jest.fn() },
        };
    });

    it('creates three player choices and three CPU choices', () => {
        const controls = new ChoiceControls(scene, jest.fn());
        const buttons = controls.create(800, 1200, 800, false);

        expect(buttons.playerButtons).toHaveLength(3);
        expect(buttons.cpuButtons).toHaveLength(3);
    });

    it('forwards an interaction from a player button to the scene callback', () => {
        const onPlayerChoice = jest.fn();
        const controls = new ChoiceControls(scene, onPlayerChoice);
        const { playerButtons } = controls.create(800, 1200, 800, false);

        playerButtons[1].list[0].emit('pointerdown');

        expect(onPlayerChoice).toHaveBeenCalledWith(1);
    });

    it('moves both columns when the player changes side', () => {
        const controls = new ChoiceControls(scene, jest.fn());
        controls.create(800, 1200, 800, false);

        controls.move(true, 800);

        expect(scene.tweens.add).toHaveBeenCalledTimes(6);
    });
});
