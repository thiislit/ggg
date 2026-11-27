const {
    SupabaseOnlineChannel,
    generateRoomCode,
    createPlayerProfile,
} = require('./SupabaseOnlineChannel.js');

/** Canal falso que imita la API de Supabase Realtime (presence + broadcast). */
class FakeRealtimeChannel {
    constructor(name, options) {
        this.name = name;
        this.options = options;
        this.listeners = [];
        this.presence = {};
        this.state = 'closed'; // estado del canal, como en Supabase
        this.sent = [];
        this.untracked = false;
    }
    on(type, filter, callback) {
        this.listeners.push({ type, event: filter.event, callback });
        return this;
    }
    subscribe(callback) {
        this.statusCallback = callback;
        return this;
    }
    presenceState() {
        return this.presence;
    }
    async track(meta) {
        this.presence[meta.id] = [meta];
    }
    untrack() {
        this.untracked = true;
    }
    send(message) {
        this.sent.push(message);
    }
    // --- helpers de test ---
    setStatus(status) {
        this.state = status === 'SUBSCRIBED' ? 'joined' : 'errored';
        this.statusCallback(status);
    }
    setMembers(members) {
        this.presence = Object.fromEntries(members.map((m) => [m.id, [m]]));
    }
    emit(type, event, payload) {
        this.listeners
            .filter((l) => l.type === type && l.event === event)
            .forEach((l) => l.callback(payload));
    }
    sync() {
        this.emit('presence', 'sync');
    }
}

function setup(profileId = 'me') {
    let channel;
    const client = {
        channel: jest.fn((name, options) => (channel = new FakeRealtimeChannel(name, options))),
        removeChannel: jest.fn(),
    };
    let clock = 1000;
    const online = new SupabaseOnlineChannel({
        client,
        roomCode: '48213',
        profile: { id: profileId, name: 'AXEL' },
        now: () => clock++,
    });
    return { online, client, getChannel: () => channel };
}

describe('SupabaseOnlineChannel', () => {
    it('connects to the room channel and reports who is already inside', async () => {
        const { online, client, getChannel } = setup();
        const connecting = online.connect();

        expect(client.channel).toHaveBeenCalledWith('rps-room-48213', {
            config: { broadcast: { self: false }, presence: { key: 'me' } },
        });
        getChannel().setStatus('SUBSCRIBED');
        getChannel().setMembers([{ id: 'host', name: 'ZED', joinedAt: 1 }]);
        getChannel().sync();

        await expect(connecting).resolves.toEqual([{ id: 'host', name: 'ZED', joinedAt: 1 }]);
    });

    it('rejects when the channel cannot connect', async () => {
        const { online, getChannel } = setup();
        const connecting = online.connect();
        getChannel().setStatus('CHANNEL_ERROR');
        await expect(connecting).rejects.toThrow('CHANNEL_ERROR');
    });

    it('emits rival-joined and rival-left as presence changes', async () => {
        const { online, getChannel } = setup();
        const connecting = online.connect();
        getChannel().setStatus('SUBSCRIBED');
        getChannel().sync();
        await connecting;

        const joined = jest.fn();
        const left = jest.fn();
        online.on('rival-joined', joined);
        online.on('rival-left', left);
        await online.enter();

        const rival = { id: 'rival', name: 'ZED', joinedAt: 5000 };
        getChannel().presence.rival = [rival];
        getChannel().sync();
        expect(joined).toHaveBeenCalledWith(rival);
        expect(online.rival).toEqual(rival);

        delete getChannel().presence.rival;
        getChannel().sync();
        expect(left).toHaveBeenCalledWith(rival);
        expect(online.rival).toBeNull();
    });

    it('emits room-full when two other players arrived first', async () => {
        const { online, getChannel } = setup();
        const connecting = online.connect();
        getChannel().setStatus('SUBSCRIBED');
        getChannel().sync();
        await connecting;
        const full = jest.fn();
        online.on('room-full', full);

        getChannel().setMembers([
            { id: 'a', joinedAt: 1 },
            { id: 'b', joinedAt: 2 },
        ]);
        await online.enter(); // joinedAt 1000 -> tercero

        expect(full).toHaveBeenCalled();
    });

    it('sends and receives game messages through broadcast', async () => {
        const { online, getChannel } = setup();
        const connecting = online.connect();
        getChannel().setStatus('SUBSCRIBED');
        getChannel().sync();
        await connecting;

        const onEmoji = jest.fn();
        online.on('emoji', onEmoji);
        online.send('emoji', { emoji: '😎' });
        getChannel().emit('broadcast', 'msg', {
            payload: { type: 'emoji', data: { emoji: '💀' } },
        });

        expect(getChannel().sent).toEqual([
            { type: 'broadcast', event: 'msg', payload: { type: 'emoji', data: { emoji: '😎' } } },
        ]);
        expect(onEmoji).toHaveBeenCalledWith({ emoji: '💀' });
    });

    it('leaves the room and stops delivering messages when closed', async () => {
        const { online, client, getChannel } = setup();
        const connecting = online.connect();
        const channel = getChannel();
        channel.setStatus('SUBSCRIBED');
        channel.sync();
        await connecting;
        const onEmoji = jest.fn();
        online.on('emoji', onEmoji);

        online.close();
        channel.emit('broadcast', 'msg', { payload: { type: 'emoji', data: { emoji: '💀' } } });

        expect(channel.untracked).toBe(true);
        expect(client.removeChannel).toHaveBeenCalledWith(channel);
        expect(onEmoji).not.toHaveBeenCalled();
    });

    it('reports connection loss and re-announces presence after reconnecting', async () => {
        const { online, getChannel } = setup();
        const connecting = online.connect();
        const channel = getChannel();
        channel.setStatus('SUBSCRIBED');
        channel.sync();
        await connecting;
        await online.enter();
        const firstMeta = channel.presence.me[0];
        const onConnection = jest.fn();
        online.on('connection', onConnection);

        // Corte: el servidor deja de vernos
        channel.setStatus('CHANNEL_ERROR');
        delete channel.presence.me;
        expect(onConnection).toHaveBeenLastCalledWith({ connected: false });

        // Supabase reconecta solo y vuelve a llamar con SUBSCRIBED
        channel.setStatus('SUBSCRIBED');
        await Promise.resolve();
        expect(onConnection).toHaveBeenLastCalledWith({ connected: true });
        expect(channel.presence.me[0]).toEqual(firstMeta); // mismo joinedAt: conserva su puesto
    });

    it('emits rival-joined again when the same rival comes back after a drop', async () => {
        const { online, getChannel } = setup();
        const connecting = online.connect();
        getChannel().setStatus('SUBSCRIBED');
        getChannel().sync();
        await connecting;
        await online.enter();
        const joined = jest.fn();
        const left = jest.fn();
        online.on('rival-joined', joined);
        online.on('rival-left', left);
        const rival = { id: 'rival', name: 'ZED', joinedAt: 5000 };

        getChannel().presence.rival = [rival];
        getChannel().sync();
        delete getChannel().presence.rival;
        getChannel().sync();
        getChannel().presence.rival = [rival];
        getChannel().sync();

        expect(left).toHaveBeenCalledTimes(1);
        expect(joined).toHaveBeenCalledTimes(2);
    });

    it('does not send while disconnected (game messages are resent after reconnecting)', async () => {
        const { online, getChannel } = setup();
        const connecting = online.connect();
        const channel = getChannel();
        channel.setStatus('SUBSCRIBED');
        channel.sync();
        await connecting;

        channel.setStatus('CHANNEL_ERROR');
        online.send('commit', { round: 1 });
        expect(channel.sent).toHaveLength(0);

        channel.setStatus('SUBSCRIBED');
        online.send('commit', { round: 1 });
        expect(channel.sent).toHaveLength(1);
    });

    it('does not report a disconnection after being closed on purpose', async () => {
        const { online, getChannel } = setup();
        const connecting = online.connect();
        const channel = getChannel();
        channel.setStatus('SUBSCRIBED');
        channel.sync();
        await connecting;
        const onConnection = jest.fn();
        online.on('connection', onConnection);

        online.close();
        channel.setStatus('CLOSED');

        expect(onConnection).not.toHaveBeenCalled();
    });
});

describe('room helpers', () => {
    it('generates 5-digit room codes', () => {
        expect(generateRoomCode(() => 0)).toBe('10000');
        expect(generateRoomCode(() => 0.999999)).toMatch(/^\d{5}$/);
    });

    it('creates a player profile with a unique id', () => {
        const a = createPlayerProfile({
            name: 'AXEL',
            avatar: 'av',
            species: 'S',
            planet: 'EARTH',
        });
        const b = createPlayerProfile({
            name: 'AXEL',
            avatar: 'av',
            species: 'S',
            planet: 'EARTH',
        });
        expect(a).toMatchObject({ name: 'AXEL', avatar: 'av', species: 'S', planet: 'EARTH' });
        expect(a.id).not.toBe(b.id);
    });
});
