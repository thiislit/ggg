const { OnlineMatch, hashChoice } = require('./OnlineMatch.js');
const { OnlineChannel } = require('./OnlineChannel.js');
const { CombatManager } = require('./CombatManager.js');

/** Dos canales unidos: lo que envía uno lo recibe el otro (en cola, como la red). */
class LinkedChannel extends OnlineChannel {
    constructor(queue) {
        super();
        this.queue = queue;
        this.peer = null;
        this.sent = [];
    }
    send(type, data) {
        this.sent.push({ type, data });
        this.queue.push(() => this.peer.receive(type, data));
    }
}

function createPair() {
    const queue = [];
    const a = new LinkedChannel(queue);
    const b = new LinkedChannel(queue);
    a.peer = b;
    b.peer = a;
    const flush = () => {
        while (queue.length) queue.shift()();
    };
    return { a, b, flush };
}

function createPlayer(channel, salt) {
    const events = { starts: [], resolved: [], rivalReady: 0, rivalLocked: 0 };
    const match = new OnlineMatch(channel, {
        salt: () => salt,
        setInterval: jest.fn(() => 1),
        clearInterval: jest.fn(),
        onRivalReady: () => events.rivalReady++,
        onRoundStart: (round) => events.starts.push(round),
        onRivalLocked: () => events.rivalLocked++,
        onRoundResolved: (mine, rival) => events.resolved.push([mine, rival]),
    });
    return { match, events };
}

describe('OnlineMatch', () => {
    it('starts the round only when both players are ready', () => {
        const { a, b, flush } = createPair();
        const p1 = createPlayer(a, 's1');
        const p2 = createPlayer(b, 's2');

        p1.match.markReady();
        flush();
        expect(p1.events.starts).toEqual([]);
        expect(p2.events.rivalReady).toBe(1);

        p2.match.markReady();
        flush();
        expect(p1.events.starts).toEqual([1]);
        expect(p2.events.starts).toEqual([1]);
    });

    it('resolves the same round on both devices with mirrored choices', () => {
        const { a, b, flush } = createPair();
        const p1 = createPlayer(a, 's1');
        const p2 = createPlayer(b, 's2');
        p1.match.markReady();
        p2.match.markReady();
        flush();

        p1.match.lock(0); // piedra
        flush();
        expect(p2.events.rivalLocked).toBe(1);
        expect(p1.events.resolved).toEqual([]); // aún falta el rival

        p2.match.lock(2); // tijera
        flush();
        expect(p1.events.resolved).toEqual([[0, 2]]);
        expect(p2.events.resolved).toEqual([[2, 0]]);

        // Y el resultado es coherente: uno gana y el otro pierde
        expect(CombatManager.getRoundResult(0, 2).result).toBe('WIN');
        expect(CombatManager.getRoundResult(2, 0).result).toBe('LOSE');
    });

    it('never sends the actual choice before both players are locked', () => {
        const { a, b, flush } = createPair();
        const p1 = createPlayer(a, 's1');
        createPlayer(b, 's2').match.markReady();
        p1.match.markReady();
        flush();

        p1.match.lock(1);
        flush();

        const commit = a.sent.find((m) => m.type === 'commit');
        expect(commit.data).toEqual({ round: 1, hash: hashChoice('1:1:s1'), reply: false });
        expect(a.sent.some((m) => m.type === 'reveal')).toBe(false);
    });

    it('treats a reveal that does not match the commitment as no choice', () => {
        const { a, b, flush } = createPair();
        const p1 = createPlayer(a, 's1');
        const p2 = createPlayer(b, 's2');
        p1.match.markReady();
        p2.match.markReady();
        flush();
        p1.match.lock(0);
        flush();

        // El rival se compromete con tijera pero "revela" papel (intento de trampa)
        p2.match.myChoice = 2;
        p2.match.mySalt = 's2';
        p2.match.myHash = hashChoice('1:2:s2');
        b.send('commit', { round: 1, hash: p2.match.myHash });
        b.send('reveal', { round: 1, choice: 1, salt: 's2' });
        flush();

        expect(p1.events.resolved).toEqual([[0, -1]]);
    });

    it('handles timeouts (-1) and plays several rounds in a row', () => {
        const { a, b, flush } = createPair();
        const p1 = createPlayer(a, 's1');
        const p2 = createPlayer(b, 's2');

        p1.match.markReady();
        p2.match.markReady();
        flush();
        p1.match.lock(-1);
        p2.match.lock(1);
        flush();
        expect(p1.events.resolved).toEqual([[-1, 1]]);
        expect(p2.events.resolved).toEqual([[1, -1]]);

        // El rival pulsa NEXT antes que nosotros: su 'ready' se guarda para la ronda 2
        p2.match.markReady();
        flush();
        p1.match.markReady();
        flush();
        expect(p1.events.starts).toEqual([1, 2]);
        expect(p2.events.starts).toEqual([1, 2]);

        p1.match.lock(2);
        p2.match.lock(2);
        flush();
        expect(p1.events.resolved[1]).toEqual([2, 2]);
    });

    it('ignores messages from other rounds and duplicated input', () => {
        const { a, b, flush } = createPair();
        const p1 = createPlayer(a, 's1');
        const p2 = createPlayer(b, 's2');
        p1.match.markReady();
        p2.match.markReady();
        flush();

        b.send('commit', { round: 7, hash: 'x' });
        flush();
        expect(p1.events.rivalLocked).toBe(0);

        p1.match.lock(0);
        p1.match.lock(1); // segundo toque ignorado
        flush();
        expect(a.sent.filter((m) => m.type === 'commit')).toHaveLength(1);
    });

    it('resends ready until the round starts and stops listening when destroyed', () => {
        const { a, b, flush } = createPair();
        const setIntervalFn = jest.fn((fn) => {
            setIntervalFn.tick = fn;
            return 42;
        });
        const clearIntervalFn = jest.fn();
        const match = new OnlineMatch(a, {
            setInterval: setIntervalFn,
            clearInterval: clearIntervalFn,
        });

        match.markReady();
        setIntervalFn.tick();
        expect(a.sent.filter((m) => m.type === 'ready')).toHaveLength(2);

        match.destroy();
        expect(clearIntervalFn).toHaveBeenCalledWith(42);
        b.send('ready', { round: 1 });
        flush();
        expect(match.rivalReady).toBe(false);
    });
});

describe('CombatManager online timeouts', () => {
    it('gives the round to the player when only the rival timed out', () => {
        const result = CombatManager.getRoundResult(1, -1);
        expect(result).toMatchObject({ result: 'WIN', cpuHealthChange: -1, playerHealthChange: 0 });
    });

    it('is a draw without damage when both timed out', () => {
        const result = CombatManager.getRoundResult(-1, -1);
        expect(result).toMatchObject({ result: 'DRAW', cpuHealthChange: 0, playerHealthChange: 0 });
    });
});

describe('OnlineMatch con red que pierde mensajes', () => {
    /** Red simulada: `drop(type, data, from)` decide qué mensajes se pierden. */
    function createLossyNetwork() {
        const queue = [];
        const log = [];
        const net = { drop: () => false, queue, log };
        const make = (name) => {
            const ch = new LinkedChannel(queue);
            ch.send = (type, data) => {
                log.push({ from: name, type, data });
                if (net.drop(type, data, name)) return;
                queue.push(() => ch.peer.receive(type, data));
            };
            return ch;
        };
        net.a = make('A');
        net.b = make('B');
        net.a.peer = net.b;
        net.b.peer = net.a;
        net.flush = () => {
            while (queue.length) queue.shift()();
        };
        return net;
    }

    function createLossyPlayer(channel, salt) {
        let pulse = null;
        const events = { starts: [], resolved: [] };
        const match = new OnlineMatch(channel, {
            salt: () => salt,
            setInterval: (fn) => {
                pulse = fn;
                return 1;
            },
            clearInterval: () => {},
            onRoundStart: (round) => events.starts.push(round),
            onRoundResolved: (mine, rival) => events.resolved.push([mine, rival]),
        });
        return { match, events, tick: () => pulse() };
    }

    function startRound(net, p1, p2) {
        p1.match.markReady();
        p2.match.markReady();
        net.flush();
    }

    it('recupera un commit perdido gracias al reenvío periódico', () => {
        const net = createLossyNetwork();
        const p1 = createLossyPlayer(net.a, 's1');
        const p2 = createLossyPlayer(net.b, 's2');
        startRound(net, p1, p2);

        let lost = false;
        net.drop = (type, _d, from) => {
            if (type === 'commit' && from === 'A' && !lost) return (lost = true);
            return false;
        };
        p1.match.lock(0);
        p2.match.lock(2);
        net.flush();
        expect(p1.events.resolved).toEqual([]); // el commit de A se perdió

        p1.tick(); // latido: A reenvía su commit
        net.flush();
        expect(p1.events.resolved).toEqual([[0, 2]]);
        expect(p2.events.resolved).toEqual([[2, 0]]);
    });

    it('recupera un reveal perdido aunque el otro ya haya resuelto la ronda', () => {
        const net = createLossyNetwork();
        const p1 = createLossyPlayer(net.a, 's1');
        const p2 = createLossyPlayer(net.b, 's2');
        startRound(net, p1, p2);

        // Se pierde el reveal de B: A queda esperando, B ya resolvió
        net.drop = (type, _d, from) => type === 'reveal' && from === 'B';
        p1.match.lock(1);
        p2.match.lock(1);
        net.flush();
        expect(p2.events.resolved).toEqual([[1, 1]]);
        expect(p1.events.resolved).toEqual([]);

        net.drop = () => false; // la red vuelve
        p1.tick(); // A reenvía commit -> B ve un duplicado y le responde con su reveal
        net.flush();
        expect(p1.events.resolved).toEqual([[1, 1]]);
    });

    it('recupera un ready perdido cuando el otro ya empezó la ronda', () => {
        const net = createLossyNetwork();
        const p1 = createLossyPlayer(net.a, 's1');
        const p2 = createLossyPlayer(net.b, 's2');

        p2.match.markReady();
        net.flush();
        net.drop = (type, _d, from) => type === 'ready' && from === 'A';
        p1.match.markReady(); // A empieza (B estaba listo) pero su ready no llega
        net.flush();
        expect(p1.events.starts).toEqual([1]);
        expect(p2.events.starts).toEqual([]);

        net.drop = () => false;
        p2.tick(); // B reenvía ready -> A responde
        net.flush();
        expect(p2.events.starts).toEqual([1]);
    });

    it('no entra en un bucle de respuestas cuando hay duplicados en vuelo', () => {
        const net = createLossyNetwork();
        const p1 = createLossyPlayer(net.a, 's1');
        const p2 = createLossyPlayer(net.b, 's2');
        startRound(net, p1, p2);
        p1.match.lock(0);
        p2.match.lock(1);
        net.flush();

        // Duplicados tardíos de ambos lados tras resolver
        net.a.send('commit', { round: 1, hash: p1.match.myHash, reply: false });
        net.b.send('ready', { round: 1, reply: false });
        const before = net.log.length;
        net.flush();
        net.flush();

        expect(net.log.length - before).toBeLessThanOrEqual(4);
        expect(net.queue).toHaveLength(0);
    });

    it('no envía nada en el latido si no hay nada pendiente', () => {
        const net = createLossyNetwork();
        const p1 = createLossyPlayer(net.a, 's1');
        const p2 = createLossyPlayer(net.b, 's2');
        startRound(net, p1, p2);
        p1.match.lock(0);
        p2.match.lock(1);
        net.flush();

        const before = net.log.length;
        p1.tick();
        p2.tick();
        expect(net.log.length).toBe(before);
    });

    it('avisa del tiempo agotado una sola vez aunque el visual esté congelado', () => {
        jest.useFakeTimers();
        const { a, b, flush } = createPair();
        const onLocalTimeout = jest.fn();
        const p1 = new OnlineMatch(a, { roundDurationMs: 5000, onLocalTimeout });
        const p2 = new OnlineMatch(b, { roundDurationMs: 5000 });
        p1.markReady();
        p2.markReady();
        flush();

        jest.advanceTimersByTime(5000);
        expect(onLocalTimeout).not.toHaveBeenCalled(); // margen para el temporizador visual
        jest.advanceTimersByTime(1000);
        expect(onLocalTimeout).toHaveBeenCalledTimes(1);
        expect(onLocalTimeout).toHaveBeenCalledWith(1);

        p1.destroy();
        p2.destroy();
        jest.useRealTimers();
    });

    it('no avisa del tiempo agotado si el jugador ya eligió', () => {
        jest.useFakeTimers();
        const { a, b, flush } = createPair();
        const onLocalTimeout = jest.fn();
        const p1 = new OnlineMatch(a, { roundDurationMs: 5000, onLocalTimeout });
        const p2 = new OnlineMatch(b, {});
        p1.markReady();
        p2.markReady();
        flush();
        p1.lock(2);

        jest.advanceTimersByTime(10000);
        expect(onLocalTimeout).not.toHaveBeenCalled();
        p1.destroy();
        p2.destroy();
        jest.useRealTimers();
    });
});
