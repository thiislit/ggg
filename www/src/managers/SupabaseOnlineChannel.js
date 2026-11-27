import { OnlineChannel } from './OnlineChannel.js';
import { ONLINE_CONFIG, isOnlineConfigured } from '../data/onlineConfig.js';

const CHANNEL_PREFIX = 'rps-room-';
const SUBSCRIBE_TIMEOUT_MS = 10000;
const FIRST_SYNC_TIMEOUT_MS = 2500;
export const ROOM_CODE_LENGTH = 5;
export const MAX_PLAYERS = 2;

let cachedClient = null;

/** Cliente de Supabase (librería cargada en index.html como global `supabase`). */
export function getSupabaseClient() {
    if (cachedClient) return cachedClient;
    const lib = globalThis.supabase;
    if (!isOnlineConfigured() || !lib?.createClient) return null;
    cachedClient = lib.createClient(ONLINE_CONFIG.SUPABASE_URL, ONLINE_CONFIG.SUPABASE_ANON_KEY);
    return cachedClient;
}

/** Código numérico de sala, p. ej. "48213". */
export function generateRoomCode(random = Math.random) {
    const min = 10 ** (ROOM_CODE_LENGTH - 1);
    return String(min + Math.floor(random() * 9 * min));
}

function generatePlayerId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Datos públicos del jugador que ve el rival. */
export function createPlayerProfile({ name, avatar, species, planet }) {
    return { id: generatePlayerId(), name, avatar, species, planet };
}

/**
 * Canal real entre dos jugadores usando Supabase Realtime:
 * - Presence: saber quién está en la sala (máximo 2 jugadores).
 * - Broadcast: mensajes de juego (emojis, y más adelante las jugadas).
 * No necesita tablas en la base de datos.
 *
 * Eventos locales que emite (vía `on`): 'rival-joined', 'rival-left', 'room-full'
 * y 'connection' { connected } cuando se pierde o recupera la conexión.
 * Un rival que vuelve tras un corte (mismo id) vuelve a emitir 'rival-joined'.
 */
export class SupabaseOnlineChannel extends OnlineChannel {
    constructor({ client, roomCode, profile, now = Date.now }) {
        super();
        this.client = client;
        this.roomCode = roomCode;
        this.profile = profile;
        this.now = now;
        this.channel = null;
        this.entered = false;
        this.rival = null;
        this.pendingFirstSync = null;
        this.connected = true;
        this.trackedMeta = null;
    }

    /**
     * Se conecta a la sala SIN anunciarse todavía y devuelve quién está dentro.
     * Así el lobby puede decidir: sala ocupada, vacía o llena.
     */
    connect() {
        return new Promise((resolve, reject) => {
            let subscribed = false;
            let firstSyncTimer = null;
            const subscribeTimer = setTimeout(() => {
                fail(new Error('TIMEOUT'));
            }, SUBSCRIBE_TIMEOUT_MS);

            const done = () => {
                clearTimeout(subscribeTimer);
                clearTimeout(firstSyncTimer);
                this.pendingFirstSync = null;
            };
            const succeed = () => {
                if (!this.pendingFirstSync) return;
                done();
                resolve(this.getOthers());
            };
            const fail = (error) => {
                if (!this.pendingFirstSync) return;
                done();
                reject(error);
            };
            this.pendingFirstSync = { succeed };

            this.channel = this.client.channel(`${CHANNEL_PREFIX}${this.roomCode}`, {
                config: {
                    broadcast: { self: false },
                    presence: { key: this.profile.id },
                },
            });

            this.channel.on('presence', { event: 'sync' }, () => this.handleSync());
            this.channel.on('broadcast', { event: 'msg' }, ({ payload }) => {
                if (payload?.type) this.receive(payload.type, payload.data);
            });

            this.channel.subscribe((status) => {
                if (this.closed) return;
                if (status === 'SUBSCRIBED') {
                    if (!subscribed) {
                        subscribed = true;
                        // Si la sala está vacía puede que no llegue ningún 'sync': no esperamos para siempre.
                        firstSyncTimer = setTimeout(succeed, FIRST_SYNC_TIMEOUT_MS);
                    } else {
                        this.onReconnected();
                    }
                } else if (
                    status === 'CHANNEL_ERROR' ||
                    status === 'TIMED_OUT' ||
                    status === 'CLOSED'
                ) {
                    if (this.pendingFirstSync) fail(new Error(status));
                    else this.onDisconnected();
                }
            });
        });
    }

    /** Se anuncia en la sala: a partir de aquí el rival nos ve. */
    async enter() {
        if (!this.channel || this.closed) return;
        // Se guarda para volver a anunciarse igual (mismo joinedAt) tras una reconexión
        this.trackedMeta = { ...this.profile, joinedAt: this.now() };
        await this.channel.track(this.trackedMeta);
        this.entered = true;
        this.handleSync();
    }

    /**
     * Supabase reconecta solo y vuelve a entrar al canal, pero NO vuelve a anunciar
     * la presencia: hay que hacer track otra vez o el rival nos daría por desconectados.
     */
    onReconnected() {
        if (!this.connected) {
            this.connected = true;
            this.receive('connection', { connected: true });
        }
        if (this.entered && this.trackedMeta) {
            Promise.resolve(this.channel?.track(this.trackedMeta)).catch(() => {});
        }
    }

    onDisconnected() {
        if (!this.connected) return;
        this.connected = false;
        this.receive('connection', { connected: false });
    }

    /** Miembros de la sala ordenados por llegada (el primero es el anfitrión). */
    getMembers() {
        const state = this.channel?.presenceState?.() || {};
        return Object.values(state)
            .map((metas) => metas?.[0])
            .filter((member) => member?.id)
            .sort((a, b) => a.joinedAt - b.joinedAt || String(a.id).localeCompare(String(b.id)));
    }

    getOthers() {
        return this.getMembers().filter((member) => member.id !== this.profile.id);
    }

    handleSync() {
        if (this.pendingFirstSync) {
            this.pendingFirstSync.succeed();
            return;
        }
        if (!this.entered || this.closed) return;

        const members = this.getMembers();
        const players = members.slice(0, MAX_PLAYERS);
        const iAmPlaying = players.some((m) => m.id === this.profile.id);
        if (!iAmPlaying && members.some((m) => m.id === this.profile.id)) {
            this.receive('room-full');
            return;
        }

        const rival = players.find((m) => m.id !== this.profile.id) || null;
        if (rival && rival.id !== this.rival?.id) {
            this.rival = rival;
            this.receive('rival-joined', rival);
        } else if (!rival && this.rival) {
            const previous = this.rival;
            this.rival = null;
            this.receive('rival-left', previous);
        }
    }

    send(type, data) {
        if (this.closed || !this.channel) return;
        // Sin conexión no se envía: Supabase caería a su API REST (en vías de retirarse y
        // gasta cuota). OnlineMatch reenvía lo pendiente en cuanto se recupera la conexión.
        if (typeof this.channel.state === 'string' && this.channel.state !== 'joined') return;
        this.channel.send({ type: 'broadcast', event: 'msg', payload: { type, data } });
    }

    close() {
        if (this.closed) return;
        const channel = this.channel;
        this.channel = null;
        this.pendingFirstSync = null;
        super.close();
        if (channel) {
            channel.untrack?.();
            this.client.removeChannel?.(channel);
        }
    }
}
