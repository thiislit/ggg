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
const READY_RESEND_MS = 2000;

export class OnlineMatch {
    constructor(
        channel,
        {
            onRivalReady = () => {},
            onRoundStart = () => {},
            onRivalLocked = () => {},
            onRoundResolved = () => {},
            salt = randomSalt,
            setInterval: setIntervalFn = globalThis.setInterval.bind(globalThis),
            clearInterval: clearIntervalFn = globalThis.clearInterval.bind(globalThis),
        } = {}
    ) {
        this.channel = channel;
        this.callbacks = { onRivalReady, onRoundStart, onRivalLocked, onRoundResolved };
        this.makeSalt = salt;
        this.setIntervalFn = setIntervalFn;
        this.clearIntervalFn = clearIntervalFn;

        this.round = 0;
        this.meReady = false;
        this.rivalReady = false;
        this.readyResend = null;
        this.resetRoundState();

        this.unsubscribers = [
            channel.on('ready', (data) => this.onReady(data)),
            channel.on('commit', (data) => this.onCommit(data)),
            channel.on('reveal', (data) => this.onReveal(data)),
        ];
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

    // --- LISTO PARA LA SIGUIENTE RONDA ---

    markReady() {
        if (this.meReady) return;
        this.meReady = true;
        const next = this.round + 1;
        this.channel.send('ready', { round: next });
        // Por si el rival aún no estaba escuchando (p. ej. todavía cargando la escena)
        this.readyResend = this.setIntervalFn(() => {
            this.channel.send('ready', { round: next });
        }, READY_RESEND_MS);
        this.maybeStartRound();
    }

    onReady(data) {
        if (data?.round !== this.round + 1 || this.rivalReady) return;
        this.rivalReady = true;
        this.callbacks.onRivalReady();
        this.maybeStartRound();
    }

    maybeStartRound() {
        if (!this.meReady || !this.rivalReady) return;
        this.stopReadyResend();
        this.round += 1;
        this.meReady = false;
        this.rivalReady = false;
        this.resetRoundState();
        this.callbacks.onRoundStart(this.round);
    }

    stopReadyResend() {
        if (this.readyResend) this.clearIntervalFn(this.readyResend);
        this.readyResend = null;
    }

    // --- ELEGIR (COMPROMISO) ---

    lock(choice) {
        if (this.round === 0 || this.myChoice !== undefined) return;
        this.myChoice = VALID_CHOICES.includes(choice) ? choice : -1;
        this.mySalt = this.makeSalt();
        this.myHash = hashChoice(`${this.round}:${this.myChoice}:${this.mySalt}`);
        this.channel.send('commit', { round: this.round, hash: this.myHash });
        this.maybeReveal();
    }

    onCommit(data) {
        if (data?.round !== this.round || this.rivalHash) return;
        this.rivalHash = String(data.hash);
        this.callbacks.onRivalLocked();
        this.maybeReveal();
    }

    // --- REVELAR ---

    maybeReveal() {
        if (this.revealed || !this.myHash || !this.rivalHash) return;
        this.revealed = true;
        this.channel.send('reveal', {
            round: this.round,
            choice: this.myChoice,
            salt: this.mySalt,
        });
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

    destroy() {
        this.stopReadyResend();
        this.unsubscribers.forEach((off) => off());
        this.unsubscribers = [];
    }
}
