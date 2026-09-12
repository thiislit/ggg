const { CombatTimer } = require('./CombatTimer.js');

class FakeObject {
    constructor() {
        this.text = '';
    }

    setDepth() {
        return this;
    }
    fillStyle() {
        return this;
    }
    lineStyle() {
        return this;
    }
    beginPath() {
        return this;
    }
    moveTo() {
        return this;
    }
    lineTo() {
        return this;
    }
    arc() {
        return this;
    }
    closePath() {
        return this;
    }
    fillPath() {
        return this;
    }
    strokePath() {
        return this;
    }
    setVisible() {
        return this;
    }
    setOrigin() {
        return this;
    }
    setX() {
        return this;
    }
    setMask() {
        return this;
    }
    createGeometryMask() {
        return {};
    }
    setFillStyle() {
        return this;
    }
    setText(text) {
        this.text = text;
        return this;
    }
}

describe('CombatTimer', () => {
    let scene;
    let elements;

    beforeEach(() => {
        scene = {
            add: {
                graphics: () => new FakeObject(),
                rectangle: () => new FakeObject(),
                text: () => new FakeObject(),
            },
            tweens: { add: jest.fn(), killTweensOf: jest.fn() },
        };
        elements = {};
    });

    it('updates both countdown labels and triggers the timeout callback', () => {
        const onTimeout = jest.fn();
        const timer = new CombatTimer(scene, elements);
        timer.init(800, 700);
        timer.start(5000, onTimeout);
        const tweenConfig = scene.tweens.add.mock.calls[0][0];

        tweenConfig.onUpdate({ progress: 0.8 });
        tweenConfig.onComplete();

        expect(elements.timeText1.text).toBe('1s');
        expect(elements.timeText2.text).toBe('1s');
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('stops the timer tweens without affecting unrelated tweens', () => {
        const timer = new CombatTimer(scene, elements);
        timer.init(800, 700);

        timer.stop();

        expect(scene.tweens.killTweensOf).toHaveBeenCalledWith([
            elements.timeBar1,
            elements.timeBar2,
        ]);
    });
});
