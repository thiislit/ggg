/**
 * Canal de comunicación entre los dos jugadores del modo Online Versus.
 *
 * La escena solo conoce esta interfaz (`send`, `on`, `close`). Hoy se usa
 * `LocalOnlineChannel`, que simula al rival; cuando exista un backend real
 * (WebSocket, Firebase, Supabase Realtime...) basta con crear otra clase que
 * extienda `OnlineChannel` y devolverla desde `createOnlineChannel`.
 */
export class OnlineChannel {
    constructor() {
        this.handlers = {};
        this.closed = false;
    }

    /** Registra un listener para mensajes del rival. Devuelve una función para quitarlo. */
    on(type, handler) {
        (this.handlers[type] ||= []).push(handler);
        return () => {
            this.handlers[type] = (this.handlers[type] || []).filter((h) => h !== handler);
        };
    }

    /** Envía un mensaje al rival. Las subclases implementan el transporte. */
    send(_type, _payload) {
        throw new Error('OnlineChannel.send() debe implementarse en una subclase');
    }

    /** Entrega un mensaje recibido del rival a los listeners registrados. */
    receive(type, payload) {
        if (this.closed) return;
        (this.handlers[type] || []).forEach((handler) => handler(payload));
    }

    close() {
        this.closed = true;
        this.handlers = {};
    }
}

/** Rival simulado: a veces responde a tus emojis con uno propio. */
export class LocalOnlineChannel extends OnlineChannel {
    constructor({ emojis = [], replyChance = 0.6, random = Math.random } = {}) {
        super();
        this.emojis = emojis;
        this.replyChance = replyChance;
        this.random = random;
        this.timers = new Set();
    }

    send(type, _payload) {
        if (this.closed || type !== 'emoji' || this.emojis.length === 0) return;
        if (this.random() > this.replyChance) return;

        const emoji = this.emojis[Math.floor(this.random() * this.emojis.length)];
        const delay = 800 + Math.floor(this.random() * 1200);
        const timer = setTimeout(() => {
            this.timers.delete(timer);
            this.receive('emoji', { emoji });
        }, delay);
        this.timers.add(timer);
    }

    close() {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
        super.close();
    }
}

export function createOnlineChannel(options) {
    return new LocalOnlineChannel(options);
}
