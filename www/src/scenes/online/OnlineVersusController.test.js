jest.mock('../../managers/AudioManager.js', () => ({ AudioManager: { playSFX: jest.fn() } }));
jest.mock('../../ui/components/DialogueBox.js', () => ({
    DialogueBox: jest
        .fn()
        .mockImplementation((scene, x, y, text) => ({ text, destroy: jest.fn() })),
}));

const {
    OnlineVersusController,
    RIVAL_GRACE_MS,
    LINGER_MS,
} = require('./OnlineVersusController.js');
const { OnlineChannel } = require('../../managers/OnlineChannel.js');
const { GAME_STATE } = require('../../constants/game.js');

class FakeObject {
    constructor(x = 0, y = 0, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.list = [];
        this.handlers = {};
        this.visible = true;
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
    setAlpha() {
        return this;
    }
    setText(value) {
        this.text = value;
        return this;
    }
    setVisible(value) {
        this.visible = value;
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
    destroy() {
        this.destroyed = true;
    }
}

/** Canales unidos: lo que envía uno lo recibe el otro (en cola, como la red). */
class LinkedChannel extends OnlineChannel {
    constructor(queue) {
        super();
        this.queue = queue;
        this.peer = null;
    }
    send(type, data) {
        this.queue.push(() => this.peer.receive(type, data));
    }
}

function createLinkedChannels() {
    const queue = [];
    const a = new LinkedChannel(queue);
    const b = new LinkedChannel(queue);
    a.peer = b;
    b.peer = a;
    return {
        a,
        b,
        flush: () => {
            while (queue.length) queue.shift()();
        },
    };
}

function createScene() {
    const scene = {
        scale: { width: 720, height: 1280 },
        barY: 896,
        currentState: GAME_STATE.IDLE,
        activeBubbles: [],
        nextRondaBtn: { destroy: jest.fn() },
        choiceControls: { onlineRivalDisplay: null },
        add: {
            container: jest.fn((x, y) => new FakeObject(x, y)),
            circle: jest.fn(() => new FakeObject()),
            text: jest.fn((x, y, value) => new FakeObject(x, y, value)),
        },
        tweens: { add: jest.fn() },
        time: { delayedCall: jest.fn((ms, cb) => ({ ms, cb, remove: jest.fn() })) },
        scene: { start: jest.fn() },
        ui: {
            updateAIIndicator: jest.fn(),
            resetAIIndicator: jest.fn(),
            stopTimer: jest.fn(),
        },
        setState: jest.fn((state) => {
            scene.currentState = state;
        }),
        startRound: jest.fn(() => {
            scene.currentState = GAME_STATE.COUNTDOWN;
        }),
        resolveRound: jest.fn(),
    };
    return scene;
}

const BUILD = { width: 720, footerTop: 921.6, isPlayerRight: false };

describe('OnlineVersusController', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('practice mode (no channel) keeps the CPU opponent and local rounds', () => {
        const controller = new OnlineVersusController(createScene());
        controller.build(BUILD);

        expect(controller.isRealMatch).toBe(false);
        expect(controller.getOpponent()).toBeNull();
        expect(controller.controlsRounds).toBe(false);
        controller.destroy();
    });

    it('real match uses the rival profile as opponent', () => {
        const { a } = createLinkedChannels();
        const controller = new OnlineVersusController(createScene(), {
            channel: a,
            rival: { name: 'AMIGO', avatar: 'av', species: 'HUMAN', planet: 'mars' },
        });

        expect(controller.getOpponent()).toMatchObject({
            name: 'AMIGO',
            stats: { health: 3 },
            planet: { name: 'MARS', texture: 'planet_mars' },
        });
    });

    it('plays a full round between two players and resolves mirrored choices', () => {
        const { a, b, flush } = createLinkedChannels();
        const sceneA = createScene();
        const sceneB = createScene();
        const host = new OnlineVersusController(sceneA, { channel: a, rival: { name: 'B' } });
        const guest = new OnlineVersusController(sceneB, { channel: b, rival: { name: 'A' } });
        host.build(BUILD);
        guest.build({ ...BUILD, isPlayerRight: true });
        expect(host.controlsRounds).toBe(true);

        // A pulsa PLAY: espera al rival
        host.requestRound();
        flush();
        expect(sceneA.nextRondaBtn).toBeNull();
        expect(sceneA.startRound).not.toHaveBeenCalled();
        expect(sceneB.ui.updateAIIndicator).toHaveBeenCalled(); // B ve que A está listo

        // B pulsa PLAY: la ronda arranca en ambos
        guest.requestRound();
        flush();
        expect(sceneA.startRound).toHaveBeenCalledTimes(1);
        expect(sceneB.startRound).toHaveBeenCalledTimes(1);

        // A elige papel, B no elige a tiempo
        host.lockChoice(1);
        guest.lockChoice(-1);
        flush();

        expect(sceneA.resolveRound).toHaveBeenCalledWith(1, -1);
        expect(sceneB.resolveRound).toHaveBeenCalledWith(-1, 1);
        expect(sceneA.setState).toHaveBeenCalledWith(GAME_STATE.LOCKED);
    });

    it('forwards rival emojis to the rival display', () => {
        const { a, b, flush } = createLinkedChannels();
        const scene = createScene();
        const rivalDisplay = new FakeObject();
        rivalDisplay.add([new FakeObject(), new FakeObject(0, 0, '?')]);
        scene.choiceControls.onlineRivalDisplay = rivalDisplay;
        const controller = new OnlineVersusController(scene, { channel: a });
        controller.build(BUILD);

        b.send('emoji', { emoji: '😎' });
        flush();

        expect(rivalDisplay.list[1].text).toBe('😎');
    });

    const findTimer = (scene, ms) => scene.time.delayedCall.mock.calls.find(([t]) => t === ms);

    it('waits for a disconnected rival, then returns to the lobby if they never come back', () => {
        const { a } = createLinkedChannels();
        const scene = createScene();
        const controller = new OnlineVersusController(scene, { channel: a, rival: { id: 'r1' } });
        controller.build(BUILD);

        a.receive('rival-left');

        // Periodo de gracia: aviso visible, la partida sigue
        expect(controller.alertText.text).toBe('RIVAL DISCONNECTED\nWAITING FOR THEM...');
        expect(scene.currentState).toBe(GAME_STATE.IDLE);
        expect(scene.activeBubbles).toHaveLength(0);

        findTimer(scene, RIVAL_GRACE_MS)[1](); // no volvió a tiempo
        expect(scene.activeBubbles[0].text).toBe('YOUR RIVAL LEFT THE ROOM');
        expect(scene.currentState).toBe(GAME_STATE.GAME_OVER);
        findTimer(scene, 3000)[1]();
        expect(scene.scene.start).toHaveBeenCalledWith('OnlineLobbyScene');
    });

    it('keeps playing when the rival reconnects within the grace period', () => {
        const { a } = createLinkedChannels();
        const scene = createScene();
        const controller = new OnlineVersusController(scene, { channel: a, rival: { id: 'r1' } });
        controller.build(BUILD);

        a.receive('rival-left');
        const grace = scene.time.delayedCall.mock.results.find(
            (_, i) => scene.time.delayedCall.mock.calls[i][0] === RIVAL_GRACE_MS
        ).value;
        a.receive('rival-joined', { id: 'r1' });

        expect(grace.remove).toHaveBeenCalled();
        expect(controller.alertText.visible).toBe(false);
        expect(controller.controlsRounds).toBe(true);
        expect(scene.currentState).toBe(GAME_STATE.IDLE);
    });

    it('shows a reconnecting notice while our own connection is down', () => {
        const { a } = createLinkedChannels();
        const controller = new OnlineVersusController(createScene(), { channel: a });
        controller.build(BUILD);

        a.receive('connection', { connected: false });
        expect(controller.alertText.text).toBe('CONNECTION LOST\nRECONNECTING...');

        a.receive('connection', { connected: true });
        expect(controller.alertText.visible).toBe(false);
    });

    it('closes the round on its own if the visual timer froze (app in background)', () => {
        const { a, b, flush } = createLinkedChannels();
        const sceneA = createScene();
        const host = new OnlineVersusController(sceneA, { channel: a });
        const guest = new OnlineVersusController(createScene(), { channel: b });
        host.build(BUILD);
        guest.build(BUILD);
        host.requestRound();
        guest.requestRound();
        flush();
        expect(sceneA.currentState).toBe(GAME_STATE.COUNTDOWN);

        jest.advanceTimersByTime(10000); // ningún toque, Phaser congelado

        expect(sceneA.currentState).toBe(GAME_STATE.LOCKED);
        expect(host.match.myChoice).toBe(-1);
    });

    it('ignores the rival leaving once the match is already over', () => {
        const { a } = createLinkedChannels();
        const scene = createScene();
        const controller = new OnlineVersusController(scene, { channel: a });
        controller.build(BUILD);
        scene.currentState = GAME_STATE.FATALITY;

        a.receive('rival-left');

        expect(scene.activeBubbles).toHaveLength(0);
        expect(scene.scene.start).not.toHaveBeenCalled();
    });

    it('after the final round, keeps the room open so a rival who lost our reveal still gets the result', () => {
        const { a, b, flush } = createLinkedChannels();
        const sceneA = createScene();
        const sceneB = createScene();
        const host = new OnlineVersusController(sceneA, { channel: a });
        const guest = new OnlineVersusController(sceneB, { channel: b });
        host.build(BUILD);
        guest.build(BUILD);
        host.requestRound();
        guest.requestRound();
        flush();

        // Microcorte: al invitado no le llega la revelación del anfitrión
        const send = a.send.bind(a);
        let dropReveal = true;
        a.send = (type, data) => {
            if (type === 'reveal' && dropReveal) return;
            send(type, data);
        };
        guest.lockChoice(2);
        flush();
        host.lockChoice(0);
        flush();
        expect(sceneA.resolveRound).toHaveBeenCalledWith(0, 2);
        expect(sceneB.resolveRound).not.toHaveBeenCalled();
        expect(guest.statusText.text).toBe('WAITING FOR RIVAL...');

        // El anfitrión ganó la partida y se va a GAME OVER (su escena se cierra)
        sceneA.currentState = GAME_STATE.GAME_OVER;
        host.destroy();
        expect(a.closed).toBe(false);

        // Vuelve la red: el reintento del invitado recibe la jugada que le faltaba
        dropReveal = false;
        jest.advanceTimersByTime(2000);
        flush();
        expect(sceneB.resolveRound).toHaveBeenCalledWith(2, 0);
        expect(sceneA.resolveRound).toHaveBeenCalledTimes(1); // la escena cerrada no se toca

        jest.advanceTimersByTime(LINGER_MS);
        expect(a.closed).toBe(true);
    });

    it('closes the room right away when the match is abandoned midway', () => {
        const { a } = createLinkedChannels();
        const scene = createScene();
        const controller = new OnlineVersusController(scene, { channel: a });
        controller.build(BUILD);
        scene.currentState = GAME_STATE.LOCKED;

        controller.destroy();

        expect(a.closed).toBe(true);
    });

    it('closes the room when destroyed', () => {
        const { a } = createLinkedChannels();
        const controller = new OnlineVersusController(createScene(), { channel: a });
        controller.build(BUILD);

        controller.destroy();
        controller.destroy(); // idempotente

        expect(a.closed).toBe(true);
        expect(controller.controlsRounds).toBe(false);
    });
});
