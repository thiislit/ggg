const { LocalOnlineChannel, createOnlineChannel } = require('./OnlineChannel.js');

describe('LocalOnlineChannel', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('simulates the rival replying with an emoji', () => {
        const channel = new LocalOnlineChannel({ emojis: ['😂', '😡'], random: () => 0 });
        const handler = jest.fn();
        channel.on('emoji', handler);

        channel.send('emoji', { emoji: '👍' });
        expect(handler).not.toHaveBeenCalled();

        jest.advanceTimersByTime(2000);
        expect(handler).toHaveBeenCalledWith({ emoji: '😂' });
    });

    it('does not reply when the roll exceeds the reply chance', () => {
        const channel = new LocalOnlineChannel({
            emojis: ['😂'],
            replyChance: 0.5,
            random: () => 0.9,
        });
        const handler = jest.fn();
        channel.on('emoji', handler);

        channel.send('emoji', { emoji: '👍' });
        jest.advanceTimersByTime(5000);

        expect(handler).not.toHaveBeenCalled();
    });

    it('cancels pending replies and listeners when closed', () => {
        const channel = createOnlineChannel({ emojis: ['😂'], random: () => 0 });
        const handler = jest.fn();
        channel.on('emoji', handler);

        channel.send('emoji', { emoji: '👍' });
        channel.close();
        jest.advanceTimersByTime(5000);

        expect(handler).not.toHaveBeenCalled();
    });

    it('lets a listener unsubscribe', () => {
        const channel = new LocalOnlineChannel();
        const handler = jest.fn();
        const off = channel.on('emoji', handler);

        off();
        channel.receive('emoji', { emoji: '😎' });

        expect(handler).not.toHaveBeenCalled();
    });
});
