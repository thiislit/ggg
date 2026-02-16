// www/src/managers/DataManager.test.js

import { DataManager } from './DataManager.js';
import { Storage } from './Storage.js';
import { CONFIG } from '../data/config.js'; // Import CONFIG for mocking theme updates
import { GAME_DATA } from '../data/GameData.js'; // Import GAME_DATA for default values

// Mock the Storage module
jest.mock('./Storage.js', () => ({
    Storage: {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn(),
    },
}));

// Mock the CONFIG.THEME.setFromPalette method
// Since CONFIG is a plain object, we need to mock it carefully
const mockSetFromPalette = jest.fn();
// Re-assign CONFIG.THEME to ensure our mock is used
CONFIG.THEME = {
    ...CONFIG.THEME, // Keep existing properties if any
    setFromPalette: mockSetFromPalette,
};

describe('DataManager', () => {
    // Original default states to restore for each test
    const defaultProfile = {
        name: 'PLAYER 1',
        species: GAME_DATA.SPECIES.HUMAN,
        planet: GAME_DATA.PLANETS.EARTH,
        avatar: GAME_DATA.AVATARS.PLAYER_AVATAR_MICHAEL,
        bestStreak: 0,
    };
    const defaultSettings = {
        difficulty: 'MEDIUM',
        bgTheme: 'bg_purple',
        isMuted: false,
        vibrate: true,
        bgDim: false,
        isPlayerRight: false,
    };
    const defaultSession = {
        currentStreak: 0,
        introSeen: false,
        tutorialSeen: false,
        storyCompleted: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset DataManager's internal state to defaults
        DataManager.profile = JSON.parse(JSON.stringify(defaultProfile));
        DataManager.settings = JSON.parse(JSON.stringify(defaultSettings));
        DataManager.session = JSON.parse(JSON.stringify(defaultSession));

        // Ensure Storage.get returns default values unless specified otherwise
        Storage.get.mockImplementation((key, defaultValue) => Promise.resolve(defaultValue));
        Storage.set.mockResolvedValue(undefined); // Mock successful set operation
        Storage.clear.mockResolvedValue(undefined); // Mock successful clear operation
    });

    // --- init() tests ---
    describe('init', () => {
        it('should load all profile data from Storage', async () => {
            Storage.get
                .mockResolvedValueOnce('TEST_PLAYER')
                .mockResolvedValueOnce(GAME_DATA.SPECIES.ALIEN)
                .mockResolvedValueOnce(GAME_DATA.PLANETS.MARS)
                .mockResolvedValueOnce(GAME_DATA.AVATARS.PLAYER_AVATAR_JOHN)
                .mockResolvedValueOnce(10); // bestStreak

            await DataManager.init();

            expect(DataManager.profile.name).toBe('TEST_PLAYER');
            expect(DataManager.profile.species).toBe(GAME_DATA.SPECIES.ALIEN);
            expect(DataManager.profile.planet).toBe(GAME_DATA.PLANETS.MARS);
            expect(DataManager.profile.avatar).toBe(GAME_DATA.AVATARS.PLAYER_AVATAR_JOHN);
            expect(DataManager.profile.bestStreak).toBe(10);
        });

        it('should load all settings data from Storage', async () => {
            Storage.get
                .mockResolvedValueOnce(defaultProfile.name) // profile data
                .mockResolvedValueOnce(defaultProfile.species)
                .mockResolvedValueOnce(defaultProfile.planet)
                .mockResolvedValueOnce(defaultProfile.avatar)
                .mockResolvedValueOnce(defaultProfile.bestStreak)
                .mockResolvedValueOnce('HARD') // difficulty
                .mockResolvedValueOnce('bg_stars') // bgTheme
                .mockResolvedValueOnce(true) // isMuted
                .mockResolvedValueOnce(false) // vibrate
                .mockResolvedValueOnce(true) // bgDim
                .mockResolvedValueOnce(true); // isPlayerRight

            await DataManager.init();

            expect(DataManager.settings.difficulty).toBe('HARD');
            expect(DataManager.settings.bgTheme).toBe('bg_stars');
            expect(DataManager.settings.isMuted).toBe(true);
            expect(DataManager.settings.vibrate).toBe(false);
            expect(DataManager.settings.bgDim).toBe(true);
            expect(DataManager.settings.isPlayerRight).toBe(true);
        });

        it('should load all session data from Storage', async () => {
            Storage.get
                .mockResolvedValueOnce(defaultProfile.name) // profile data
                .mockResolvedValueOnce(defaultProfile.species)
                .mockResolvedValueOnce(defaultProfile.planet)
                .mockResolvedValueOnce(defaultProfile.avatar)
                .mockResolvedValueOnce(defaultProfile.bestStreak)
                .mockResolvedValueOnce(defaultSettings.difficulty) // settings data
                .mockResolvedValueOnce(defaultSettings.bgTheme)
                .mockResolvedValueOnce(defaultSettings.isMuted)
                .mockResolvedValueOnce(defaultSettings.vibrate)
                .mockResolvedValueOnce(defaultSettings.bgDim)
                .mockResolvedValueOnce(defaultSettings.isPlayerRight)
                .mockResolvedValueOnce(5) // currentStreak
                .mockResolvedValueOnce(true) // introSeen
                .mockResolvedValueOnce(true) // tutorialSeen
                .mockResolvedValueOnce(true); // storyCompleted

            await DataManager.init();

            expect(DataManager.session.currentStreak).toBe(5);
            expect(DataManager.session.introSeen).toBe(true);
            expect(DataManager.session.tutorialSeen).toBe(true);
            expect(DataManager.session.storyCompleted).toBe(true);
        });

        it('should use default values if Storage returns null/undefined for any key', async () => {
            // Simulate Storage returning null from persistence, so DataManager falls back to its own defaults
            Storage.get.mockImplementation((key, defaultValue) => Promise.resolve(defaultValue));

            await DataManager.init();

            expect(DataManager.profile).toEqual(defaultProfile);
            expect(DataManager.settings).toEqual(defaultSettings);
            expect(DataManager.session).toEqual(defaultSession);
        });

        it('should log a warning if DataManager initialized', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn');
            await DataManager.init();
            expect(consoleWarnSpy).toHaveBeenCalledWith('DataManager initialized.');
            consoleWarnSpy.mockRestore();
        });
    });

    // --- SETTERS tests ---
    describe('setters', () => {
        it('setName should update profile name and save to Storage (uppercase and trim)', async () => {
            await DataManager.setName('   test player   ');
            expect(DataManager.profile.name).toBe('TEST PLAYE'); // Expect truncated name
            expect(Storage.set).toHaveBeenCalledWith('playerName', 'TEST PLAYE'); // Expect truncated name in Storage
        });

        it('setSpecies should update profile species and save to Storage', async () => {
            await DataManager.setSpecies(GAME_DATA.SPECIES.ALIEN);
            expect(DataManager.profile.species).toBe(GAME_DATA.SPECIES.ALIEN);
            expect(Storage.set).toHaveBeenCalledWith('playerSpecies', GAME_DATA.SPECIES.ALIEN);
        });

        it('setPlanet should update profile planet and save to Storage', async () => {
            await DataManager.setPlanet(GAME_DATA.PLANETS.MARS);
            expect(DataManager.profile.planet).toBe(GAME_DATA.PLANETS.MARS);
            expect(Storage.set).toHaveBeenCalledWith('playerPlanet', GAME_DATA.PLANETS.MARS);
        });

        it('setAvatar should update profile avatar and save to Storage', async () => {
            await DataManager.setAvatar(GAME_DATA.AVATARS.PLAYER_AVATAR_JOHN);
            expect(DataManager.profile.avatar).toBe(GAME_DATA.AVATARS.PLAYER_AVATAR_JOHN);
            expect(Storage.set).toHaveBeenCalledWith(
                'playerAvatar',
                GAME_DATA.AVATARS.PLAYER_AVATAR_JOHN
            );
        });

        describe('setBestStreak', () => {
            it('should update bestStreak and save if new score is higher', async () => {
                DataManager.profile.bestStreak = 5;
                const isNewRecord = await DataManager.setBestStreak(10);
                expect(DataManager.profile.bestStreak).toBe(10);
                expect(Storage.set).toHaveBeenCalledWith('streak_best', 10);
                expect(isNewRecord).toBe(true);
            });

            it('should not update bestStreak or save if new score is not higher', async () => {
                DataManager.profile.bestStreak = 10;
                const isNewRecord = await DataManager.setBestStreak(5);
                expect(DataManager.profile.bestStreak).toBe(10);
                expect(Storage.set).not.toHaveBeenCalled();
                expect(isNewRecord).toBe(false);
            });
        });

        it('setDifficulty should update settings difficulty and save to Storage', async () => {
            await DataManager.setDifficulty('HARD');
            expect(DataManager.settings.difficulty).toBe('HARD');
            expect(Storage.set).toHaveBeenCalledWith('difficulty', 'HARD');
        });

        it('setBgTheme should update settings bgTheme, save to Storage, and update CONFIG.THEME', async () => {
            await DataManager.setBgTheme('bg_stars');
            expect(DataManager.settings.bgTheme).toBe('bg_stars');
            expect(Storage.set).toHaveBeenCalledWith('bg_theme', 'bg_stars');
            expect(mockSetFromPalette).toHaveBeenCalledWith('bg_stars');
        });

        it('setIsMuted should update settings isMuted and save to Storage', async () => {
            await DataManager.setIsMuted(true);
            expect(DataManager.settings.isMuted).toBe(true);
            expect(Storage.set).toHaveBeenCalledWith('isMuted', true);
        });

        it('setVibrate should update settings vibrate and save to Storage', async () => {
            await DataManager.setVibrate(false);
            expect(DataManager.settings.vibrate).toBe(false);
            expect(Storage.set).toHaveBeenCalledWith('vibrate', false);
        });

        it('setBgDim should update settings bgDim and save to Storage', async () => {
            await DataManager.setBgDim(true);
            expect(DataManager.settings.bgDim).toBe(true);
            expect(Storage.set).toHaveBeenCalledWith('bgDim', true);
        });

        it('setIsPlayerRight should update settings isPlayerRight and save to Storage', async () => {
            await DataManager.setIsPlayerRight(true);
            expect(DataManager.settings.isPlayerRight).toBe(true);
            expect(Storage.set).toHaveBeenCalledWith('isPlayerRight', true);
        });

        it('setCurrentStreak should update session currentStreak and save to Storage', async () => {
            await DataManager.setCurrentStreak(5);
            expect(DataManager.session.currentStreak).toBe(5);
            expect(Storage.set).toHaveBeenCalledWith('streak_current', 5);
        });

        it('setIntroSeen should update session introSeen and save to Storage', async () => {
            await DataManager.setIntroSeen(true);
            expect(DataManager.session.introSeen).toBe(true);
            expect(Storage.set).toHaveBeenCalledWith('intro_seen', true);
        });

        it('setTutorialSeen should update session tutorialSeen and save to Storage', async () => {
            await DataManager.setTutorialSeen(true);
            expect(DataManager.session.tutorialSeen).toBe(true);
            expect(Storage.set).toHaveBeenCalledWith('tutorial_seen', true);
        });

        it('setStoryCompleted should update session storyCompleted and save to Storage', async () => {
            await DataManager.setStoryCompleted(true);
            expect(DataManager.session.storyCompleted).toBe(true);
            expect(Storage.set).toHaveBeenCalledWith('storyCompleted', true);
        });
    });

    // --- Game Logic tests ---
    describe('game logic methods', () => {
        describe('registerQuickPlayWin', () => {
            it('should increment currentStreak, update bestStreak if applicable, and save', async () => {
                DataManager.session.currentStreak = 2;
                DataManager.profile.bestStreak = 1;
                const { streak, isNewRecord } = await DataManager.registerQuickPlayWin();

                expect(DataManager.session.currentStreak).toBe(3);
                expect(Storage.set).toHaveBeenCalledWith('streak_current', 3);
                expect(DataManager.profile.bestStreak).toBe(3);
                expect(Storage.set).toHaveBeenCalledWith('streak_best', 3);
                expect(isNewRecord).toBe(true);
                expect(streak).toBe(3);
            });

            it('should increment currentStreak but not bestStreak if new score is not higher', async () => {
                DataManager.session.currentStreak = 2;
                DataManager.profile.bestStreak = 5;
                Storage.set.mockClear(); // Clear previous set calls from setBestStreak
                const { streak, isNewRecord } = await DataManager.registerQuickPlayWin();

                expect(DataManager.session.currentStreak).toBe(3);
                expect(Storage.set).toHaveBeenCalledWith('streak_current', 3);
                expect(DataManager.profile.bestStreak).toBe(5); // Best streak remains 5
                expect(Storage.set).not.toHaveBeenCalledWith('streak_best', expect.any(Number));
                expect(isNewRecord).toBe(false);
                expect(streak).toBe(3);
            });
        });

        it('registerQuickPlayLoss should reset currentStreak and save', async () => {
            DataManager.session.currentStreak = 5;
            await DataManager.registerQuickPlayLoss();
            expect(DataManager.session.currentStreak).toBe(0);
            expect(Storage.set).toHaveBeenCalledWith('streak_current', 0);
        });

        it('clear should clear all data from Storage', async () => {
            await DataManager.clear();
            expect(Storage.clear).toHaveBeenCalledTimes(1);
        });

        it('clear should log a warning', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn');
            await DataManager.clear();
            expect(consoleWarnSpy).toHaveBeenCalledWith('DataManager data cleared.');
            consoleWarnSpy.mockRestore();
        });
    });

    // --- GETTERS tests ---
    describe('getters', () => {
        it('getName should return profile name', () => {
            DataManager.profile.name = 'TEST_NAME';
            expect(DataManager.getName()).toBe('TEST_NAME');
        });

        it('getSpecies should return profile species', () => {
            DataManager.profile.species = GAME_DATA.SPECIES.ALIEN;
            expect(DataManager.getSpecies()).toBe(GAME_DATA.SPECIES.ALIEN);
        });

        it('getPlanet should return profile planet', () => {
            DataManager.profile.planet = GAME_DATA.PLANETS.KEPLER;
            expect(DataManager.getPlanet()).toBe(GAME_DATA.PLANETS.KEPLER);
        });

        it('getAvatar should return profile avatar', () => {
            DataManager.profile.avatar = GAME_DATA.AVATARS.PLAYER_AVATAR_JOHN;
            expect(DataManager.getAvatar()).toBe(GAME_DATA.AVATARS.PLAYER_AVATAR_JOHN);
        });

        it('getBestStreak should return profile bestStreak', () => {
            DataManager.profile.bestStreak = 15;
            expect(DataManager.getBestStreak()).toBe(15);
        });

        it('getDifficulty should return settings difficulty', () => {
            DataManager.settings.difficulty = 'EASY';
            expect(DataManager.getDifficulty()).toBe('EASY');
        });

        it('getBgTheme should return settings bgTheme', () => {
            DataManager.settings.bgTheme = 'bg_desert';
            expect(DataManager.getBgTheme()).toBe('bg_desert');
        });

        it('isMuted should return settings isMuted', () => {
            DataManager.settings.isMuted = true;
            expect(DataManager.isMuted()).toBe(true);
        });

        it('isVibrateEnabled should return settings vibrate', () => {
            DataManager.settings.vibrate = false;
            expect(DataManager.isVibrateEnabled()).toBe(false);
        });

        it('isBgDim should return settings bgDim', () => {
            DataManager.settings.bgDim = true;
            expect(DataManager.isBgDim()).toBe(true);
        });

        it('isPlayerRight should return settings isPlayerRight', () => {
            DataManager.settings.isPlayerRight = true;
            expect(DataManager.isPlayerRight()).toBe(true);
        });

        it('getCurrentStreak should return session currentStreak', () => {
            DataManager.session.currentStreak = 7;
            expect(DataManager.getCurrentStreak()).toBe(7);
        });

        it('hasSeenIntro should return session introSeen', () => {
            DataManager.session.introSeen = true;
            expect(DataManager.hasSeenIntro()).toBe(true);
        });

        it('hasSeenTutorial should return session tutorialSeen', () => {
            DataManager.session.tutorialSeen = true;
            expect(DataManager.hasSeenTutorial()).toBe(true);
        });

        it('hasCompletedStory should return session storyCompleted', () => {
            DataManager.session.storyCompleted = true;
            expect(DataManager.hasCompletedStory()).toBe(true);
        });
    });
});
