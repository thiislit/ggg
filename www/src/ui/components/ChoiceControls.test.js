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
    setText(value) {
        this.text = value;
        return this;
    }
    setFill(value) {
        this.fill = value;
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
                container: jest.fn(() => new FakeObject()),
                circle: jest.fn(() => new FakeObject()),
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
        expect(buttons.onlineRivalDisplay).toBeNull();
    });

    it('creates a centered circular rival display with radius 150 and no label in online mode', () => {
        const controls = new ChoiceControls(scene, jest.fn());
        const buttons = controls.create(800, 1200, 800, false, true);

        expect(buttons.playerButtons).toHaveLength(3);
        expect(buttons.cpuButtons).toHaveLength(0);
        expect(buttons.onlineRivalDisplay).not.toBeNull();
        expect(buttons.onlineRivalDisplay.list).toHaveLength(2);
        expect(scene.add.container).toHaveBeenCalledWith(595, 995);
        expect(scene.add.circle).toHaveBeenCalledWith(0, 0, 150, 0x000000, 0.45);
    });

    it('reveals and resets the online rival choice display', () => {
        const controls = new ChoiceControls(scene, jest.fn());
        const { onlineRivalDisplay } = controls.create(800, 1200, 800, false, true);

        controls.showOnlineRivalChoice(2);
        expect(onlineRivalDisplay.list[1].text).toBe('✌️');

        controls.resetColors();
        expect(onlineRivalDisplay.list[1].text).toBe('?');
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

    it('moves player buttons and online rival display when changing side in online mode', () => {
        const controls = new ChoiceControls(scene, jest.fn());
        controls.create(800, 1200, 800, false, true);

        controls.move(true, 800);

        expect(scene.tweens.add).toHaveBeenCalledTimes(4);
    });
});
