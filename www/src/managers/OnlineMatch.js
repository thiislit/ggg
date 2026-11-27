/**
 * Sincroniza las rondas de una partida Online Versus entre los dos jugadores.
 *
 * Protocolo por ronda (mensajes por el OnlineChannel):
 *   1. 'ready'  { round }        → la ronda empieza cuando ambos están listos.
 *   2. 'commit' { round, hash }  → al elegir se envía solo la huella de la jugada.
 *   3. 'reveal' { round, choice, salt } → cuando ambos se comprometieron, se revela.
 * Cada lado verifica que la jugada revelada coincide con la huella recibida,
 * así nadie puede cambiar su jugada después de ver la del rival.
 *
 * Tolerancia a fallos de red (los mensajes broadcast pueden perderse en un corte):
 *   - Mientras algo propio está pendiente se reenvía cada RESEND_MS (ready, o commit+reveal).
 *   - Si llega un mensaje repetido del rival es que no recibió lo nuestro: se le reenvía.
 *   - Todos los mensajes son idempotentes (los duplicados se ignoran).
 *   - Tiempo límite propio (setTimeout): si el temporizador visual se congela (app en
 *     segundo plano), la ronda igualmente se cierra como "no eligió a tiempo".
 *
 * Elección -1 = no eligió a tiempo.
 */

/** Hash determinista (cyrb53). Igual en todos los dispositivos y sin depender de HTTPS. */
export function hashChoice(text) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function randomSalt() {
    const bytes = new Uint32Array(2);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
    else bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 2 ** 32)));
    return `${bytes[0].toString(36)}${bytes[1].toString(36)}`;
}

const VALID_CHOICES = [-1, 0, 1, 2];
export const RESEND_MS = 2000;
/** Margen sobre la duración de la ronda antes de cerrar por tiempo (el visual suele llegar antes). */
export const TIMEOUT_GRACE_MS = 750;

/**
 * @typedef {Object} OnlineMatchOptions
 * @property {() => void} [onRivalReady] El rival pulsó PLAY/NEXT
 * @property {(round: number) => void} [onRoundStart] Ambos listos: empieza la ronda
 * @property {() => void} [onRivalLocked] El rival ya eligió (sin saber qué)
 * @property {(myChoice: number, rivalChoice: number, round: number) => void} [onRoundResolved]
 * @property {(round: number) => void} [onLocalTimeout] Se acabó nuestro tiempo sin elegir
 * @property {number} [roundDurationMs] Duración de la ronda (activa el tiempo límite propio)
 * @property {() => string} [salt] Generador de sal (inyectable para tests)
 * @property {(fn: () => void, ms: number) => any} [setInterval]
 * @property {(id: any) => void} [clearInterval]
 * @property {(fn: () => void, ms: number) => any} [setTimeout]
 * @property {(id: any) => void} [clearTimeout]
 */

export class OnlineMatch {
    /**
     * @param {import('./OnlineChannel.js').OnlineChannel} channel
     * @param {OnlineMatchOptions} [options]
     */
    constructor(
        channel,
        {
            onRivalReady = () => {},
            onRoundStart = () => {},
            onRivalLocked = () => {},
            onRoundResolved = () => {},
            onLocalTimeout = () => {},
            roundDurationMs = null,
            salt = randomSalt,
            setInterval: setIntervalFn = globalThis.setInterval.bind(globalThis),
            clearInterval: clearIntervalFn = globalThis.clearInterval.bind(globalThis),
            setTimeout: setTimeoutFn = globalThis.setTimeout.bind(globalThis),
            clearTimeout: clearTimeoutFn = globalThis.clearTimeout.bind(globalThis),
        } = {}
    ) {
        this.channel = channel;
        this.callbacks = {
            onRivalReady,
            onRoundStart,
            onRivalLocked,
            onRoundResolved,
            onLocalTimeout,
        };
        this.roundDurationMs = roundDurationMs;
        this.makeSalt = salt;
        this.timers = { setIntervalFn, clearIntervalFn, setTimeoutFn, clearTimeoutFn };

        this.round = 0;
        this.meReady = false;
        this.rivalReady = false;
        this.roundTimer = null;
        this.destroyed = false;
        this.resetRoundState();

        this.unsubscribers = [
            channel.on('ready', (data) => this.onReady(data)),
            channel.on('commit', (data) => this.onCommit(data)),
            channel.on('reveal', (data) => this.onReveal(data)),
        ];
        // Un único "latido" que reenvía lo que esté pendiente (no envía nada si no hay nada)
        this.pulse = setIntervalFn(() => this.resendPending(), RESEND_MS);
    }

    resetRoundState() {
        this.myChoice = undefined;
        this.mySalt = null;
        this.myHash = null;
        this.rivalHash = null;
        this.rivalChoice = undefined;
        this.revealed = false;
        this.resolved = false;
    }

    // --- ENVÍOS ---

    // `reply: true` marca una respuesta a un duplicado: las respuestas nunca generan
    // otra respuesta, así dos clientes no pueden quedar rebotándose mensajes.

    sendReady(round, reply = false) {
        this.channel.send('ready', { round, reply });
    }

    sendCommit(reply = false) {
        this.channel.send('commit', { round: this.round, hash: this.myHash, reply });
    }

    sendReveal() {
        this.channel.send('reveal', {
            round: this.round,
            choice: this.myChoice,
            salt: this.mySalt,
        });
    }

    /** Reenvía lo que el rival podría no haber recibido. */
    resendPending() {
        if (this.destroyed) return;
        if (this.meReady) {
            this.sendReady(this.round + 1);
        } else if (this.myHash && !this.resolved) {
            this.sendCommit();
            if (this.revealed) this.sendReveal();
        }
    }

    // --- LISTO PARA LA SIGUIENTE RONDA ---

    markReady() {
        if (this.meReady || this.destroyed) return;
        this.meReady = true;
        this.sendReady(this.round + 1);
        this.maybeStartRound();
    }

    onReady(data) {
        const round = data?.round;
        // El rival sigue esperando a que empiece una ronda que nosotros ya empezamos:
        // no le llegó nuestro 'ready'. Se lo repetimos.
        if (round === this.round && this.round > 0) {
            if (!data.reply) this.sendReady(this.round, true);
            return;
        }
        if (round !== this.round + 1 || this.rivalReady) return;
        this.rivalReady = true;
        this.callbacks.onRivalReady();
        this.maybeStartRound();
    }

    maybeStartRound() {
        if (!this.meReady || !this.rivalReady) return;
        this.round += 1;
        this.meReady = false;
        this.rivalReady = false;
        this.resetRoundState();
        this.armRoundTimer();
        this.callbacks.onRoundStart(this.round);
    }

    armRoundTimer() {
        this.clearRoundTimer();
        if (!this.roundDurationMs) return;
        const round = this.round;
        this.roundTimer = this.timers.setTimeoutFn(() => {
            this.roundTimer = null;
            if (this.destroyed || this.round !== round || this.myChoice !== undefined) return;
            this.callbacks.onLocalTimeout(round);
        }, this.roundDurationMs + TIMEOUT_GRACE_MS);
    }

    clearRoundTimer() {
        if (this.roundTimer) this.timers.clearTimeoutFn(this.roundTimer);
        this.roundTimer = null;
    }

    // --- ELEGIR (COMPROMISO) ---

    lock(choice) {
        if (this.destroyed || this.round === 0 || this.myChoice !== undefined) return;
        this.clearRoundTimer();
        this.myChoice = VALID_CHOICES.includes(choice) ? choice : -1;
        this.mySalt = this.makeSalt();
        this.myHash = hashChoice(`${this.round}:${this.myChoice}:${this.mySalt}`);
        this.sendCommit();
        this.maybeReveal();
    }

    onCommit(data) {
        if (data?.round !== this.round) return;
        if (this.rivalHash) {
            // Duplicado: el rival sigue reenviando porque le falta algo nuestro
            if (data.reply) return;
            if (this.myHash) this.sendCommit(true);
            if (this.revealed) this.sendReveal();
            return;
        }
        this.rivalHash = String(data.hash);
        this.callbacks.onRivalLocked();
        this.maybeReveal();
    }

    // --- REVELAR ---

    maybeReveal() {
        if (this.revealed || !this.myHash || !this.rivalHash) return;
        this.revealed = true;
        this.sendReveal();
        this.maybeResolve();
    }

    onReveal(data) {
        if (data?.round !== this.round || this.rivalChoice !== undefined || !this.rivalHash) return;
        const choice = Number(data.choice);
        const matches =
            VALID_CHOICES.includes(choice) &&
            hashChoice(`${this.round}:${choice}:${data.salt}`) === this.rivalHash;
        // Si no coincide con su compromiso, la jugada no vale (cuenta como no elegida)
        this.rivalChoice = matches ? choice : -1;
        this.maybeResolve();
    }

    maybeResolve() {
        if (this.resolved || !this.revealed || this.rivalChoice === undefined) return;
        this.resolved = true;
        this.callbacks.onRoundResolved(this.myChoice, this.rivalChoice, this.round);
    }

    /**
     * Deja de avisar a la escena (ya cerrada) pero sigue respondiendo al rival:
     * reenvía nuestra jugada si sus reintentos indican que no le llegó.
     */
    silence() {
        this.clearRoundTimer();
        Object.keys(this.callbacks).forEach((key) => (this.callbacks[key] = () => {}));
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.clearRoundTimer();
        this.timers.clearIntervalFn(this.pulse);
        this.unsubscribers.forEach((off) => off());
        this.unsubscribers = [];
    }
}
