// www/src/managers/AudioManager.test.js

import { AudioManager } from './AudioManager.js';
import { Storage } from './Storage.js'; // Import real Storage for mocking

// Mock the Storage module
jest.mock('./Storage.js', () => ({
    Storage: {
        get: jest.fn(),
        set: jest.fn(),
    },
}));

describe('AudioManager', () => {
    let mockScene;
    let mockBgmInstance;

    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test

        // Reset AudioManager's internal state
        AudioManager.volumes = { music: 0.5, sfx: 0.5 };
        AudioManager.bgm = null;

        // Mock a BGM instance
        mockBgmInstance = {
            key: 'test_bgm',
            isPlaying: false,
            stop: jest.fn(),
            play: jest.fn(),
            setVolume: jest.fn(),
        };

        // Mock a Phaser Scene and its sound manager
        mockScene = {
            sound: {
                add: jest.fn().mockReturnValue(mockBgmInstance),
                play: jest.fn(),
                pauseAll: jest.fn(),
                resumeAll: jest.fn(),
            },
        };
    });

    describe('init', () => {
        it('should load saved music and sfx volumes from Storage', async () => {
            Storage.get.mockImplementation((key, defaultValue) => {
                if (key === 'vol_music') return Promise.resolve('0.7');
                if (key === 'vol_sfx') return Promise.resolve('0.3');
                return Promise.resolve(defaultValue);
            });

            await AudioManager.init(mockScene);

            expect(Storage.get).toHaveBeenCalledWith('vol_music', '0.5');
            expect(Storage.get).toHaveBeenCalledWith('vol_sfx', '0.5');
            expect(AudioManager.volumes.music).toBe(0.7);
            expect(AudioManager.volumes.sfx).toBe(0.3);
        });

        it('should use default volumes if Storage returns undefined or null', async () => {
            Storage.get.mockImplementation((key, defaultValue) => {
                // Simulate that the value is not found, so Storage.get returns the defaultValue
                return Promise.resolve(defaultValue);
            });

            await AudioManager.init(mockScene);

            expect(AudioManager.volumes.music).toBe(0.5);
            expect(AudioManager.volumes.sfx).toBe(0.5);
        });
    });

    describe('setMusicVolume', () => {
        it('should update music volume and save it to Storage', () => {
            AudioManager.setMusicVolume(0.8);
            expect(AudioManager.volumes.music).toBe(0.8);
            expect(Storage.set).toHaveBeenCalledWith('vol_music', 0.8);
        });

        it('should update bgm volume if bgm is active', () => {
            AudioManager.bgm = mockBgmInstance;
            AudioManager.setMusicVolume(0.6);
            expect(mockBgmInstance.setVolume).toHaveBeenCalledWith(0.6);
        });

        it('should not update bgm volume if bgm is not active', () => {
            AudioManager.bgm = null;
            AudioManager.setMusicVolume(0.6);
            expect(mockBgmInstance.setVolume).not.toHaveBeenCalled(); // Still not called if bgm is null
        });
    });

    describe('setSfxVolume', () => {
        it('should update sfx volume and save it to Storage', () => {
            AudioManager.setSfxVolume(0.2);
            expect(AudioManager.volumes.sfx).toBe(0.2);
            expect(Storage.set).toHaveBeenCalledWith('vol_sfx', 0.2);
        });
    });

    describe('playMusic', () => {
        const musicKey = 'bgm_track';

        it('should add and play new music if no bgm is active', () => {
            AudioManager.playMusic(mockScene, musicKey);
            expect(mockScene.sound.add).toHaveBeenCalledWith(
                musicKey,
                expect.objectContaining({ loop: true, volume: 0.5 })
            );
            expect(mockBgmInstance.play).toHaveBeenCalledTimes(1);
            expect(AudioManager.bgm).toBe(mockBgmInstance);
        });

        it('should stop current bgm and play new music if different key', () => {
            AudioManager.bgm = { ...mockBgmInstance, key: 'old_bgm', isPlaying: true };
            AudioManager.playMusic(mockScene, musicKey);
            expect(AudioManager.bgm.stop).toHaveBeenCalledTimes(1);
            expect(mockScene.sound.add).toHaveBeenCalledWith(musicKey, expect.any(Object));
            expect(mockBgmInstance.play).toHaveBeenCalledTimes(1);
        });

        it('should not play if the same music is already playing', () => {
            AudioManager.bgm = { ...mockBgmInstance, key: musicKey, isPlaying: true };
            AudioManager.playMusic(mockScene, musicKey);
            expect(mockScene.sound.add).not.toHaveBeenCalled();
            expect(mockBgmInstance.stop).not.toHaveBeenCalled();
            expect(mockBgmInstance.play).not.toHaveBeenCalled();
        });

        it('should pass additional options to scene.sound.add', () => {
            const options = { delay: 100 };
            AudioManager.playMusic(mockScene, musicKey, options);
            expect(mockScene.sound.add).toHaveBeenCalledWith(
                musicKey,
                expect.objectContaining({ loop: true, volume: 0.5, delay: 100 })
            );
        });
    });

    describe('playSFX', () => {
        const sfxKey = 'sfx_blaster';

        it('should play the sfx with current sfx volume', () => {
            AudioManager.playSFX(mockScene, sfxKey);
            expect(mockScene.sound.play).toHaveBeenCalledWith(
                sfxKey,
                expect.objectContaining({ volume: 0.5 })
            );
        });

        it('should pass additional options to scene.sound.play', () => {
            const options = { detune: 50 };
            AudioManager.playSFX(mockScene, sfxKey, options);
            expect(mockScene.sound.play).toHaveBeenCalledWith(
                sfxKey,
                expect.objectContaining({ volume: 0.5, detune: 50 })
            );
        });
    });

    describe('stopMusic', () => {
        it('should stop the currently playing bgm', () => {
            AudioManager.bgm = mockBgmInstance;
            AudioManager.stopMusic();
            expect(mockBgmInstance.stop).toHaveBeenCalledTimes(1);
        });

        it('should do nothing if no bgm is active', () => {
            AudioManager.bgm = null;
            AudioManager.stopMusic();
            expect(mockBgmInstance.stop).not.toHaveBeenCalled(); // Ensure mock function wasn't called
        });
    });
});
