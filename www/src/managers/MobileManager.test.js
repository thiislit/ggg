// www/src/managers/MobileManager.test.js

import Phaser from 'phaser'; // eslint-disable-line no-unused-vars -- Import Phaser to make it available for mocking

// Mock Capacitor App Plugin
const mockCapacitorApp = {
    addListener: jest.fn(),
    exitApp: jest.fn(),
};

// Mock the global window.Capacitor object
Object.defineProperty(window, 'Capacitor', {
    writable: true,
    value: {
        Plugins: {
            App: mockCapacitorApp,
        },
    },
});

// Mock Phaser Game and Scene
const mockGame = {
    scene: {
        getScenes: jest.fn(),
    },
    sound: {
        pauseAll: jest.fn(),
        resumeAll: jest.fn(),
    },
};

// Import the module to be tested
import { MobileManager } from './MobileManager.js';

describe('MobileManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mocks on mockCapacitorApp for each test
        mockCapacitorApp.addListener.mockClear();
        mockCapacitorApp.exitApp.mockClear();
        // Reset mocks on mockGame for each test
        mockGame.scene.getScenes.mockClear();
        mockGame.sound.pauseAll.mockClear();
        mockGame.sound.resumeAll.mockClear();

        // Ensure window.Capacitor is defined for most tests by default
        Object.defineProperty(window, 'Capacitor', {
            writable: true,
            value: {
                Plugins: {
                    App: mockCapacitorApp,
                },
            },
        });
    });

    it('should not initialize if window.Capacitor is not defined', () => {
        window.Capacitor = undefined; // Simulate non-Capacitor environment
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); // Change to warn

        MobileManager.init(mockGame);

        expect(consoleSpy).toHaveBeenCalledWith(
            'Capacitor no detectado. Saltando inicialización de MobileManager.'
        );
        expect(mockCapacitorApp.addListener).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should not initialize if Capacitor.Plugins.App is not defined', () => {
        Object.defineProperty(window, 'Capacitor', {
            writable: true,
            value: {
                Plugins: {}, // App plugin missing
            },
        });
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        MobileManager.init(mockGame);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'Capacitor App plugin no disponible. Algunas funcionalidades móviles no estarán activas.'
        );
        expect(mockCapacitorApp.addListener).not.toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
    });

    it('should initialize backButton, pause, and resume listeners when Capacitor is available', () => {
        MobileManager.init(mockGame);

        expect(mockCapacitorApp.addListener).toHaveBeenCalledTimes(3);
        expect(mockCapacitorApp.addListener).toHaveBeenCalledWith(
            'backButton',
            expect.any(Function)
        );
        expect(mockCapacitorApp.addListener).toHaveBeenCalledWith('pause', expect.any(Function));
        expect(mockCapacitorApp.addListener).toHaveBeenCalledWith('resume', expect.any(Function));
    });

    describe('backButton handler', () => {
        let backButtonCallback;

        beforeEach(() => {
            MobileManager.init(mockGame);
            backButtonCallback = mockCapacitorApp.addListener.mock.calls.find(
                (call) => call[0] === 'backButton'
            )[1];
            jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn from handler
        });

        afterEach(() => {
            jest.restoreAllMocks(); // Restore console.log
        });

        it('should exit app if no active scenes', () => {
            mockGame.scene.getScenes.mockReturnValueOnce([]);
            backButtonCallback();
            expect(mockCapacitorApp.exitApp).toHaveBeenCalledTimes(1);
        });

        it('should exit app from MainMenuScene', () => {
            mockGame.scene.getScenes.mockReturnValueOnce([{ scene: { key: 'MainMenuScene' } }]);
            backButtonCallback();
            expect(mockCapacitorApp.exitApp).toHaveBeenCalledTimes(1);
        });

        it('should start MainMenuScene from ProfileScene', () => {
            const mockProfileScene = { scene: { key: 'ProfileScene', start: jest.fn() } };
            mockGame.scene.getScenes.mockReturnValueOnce([mockProfileScene]);
            backButtonCallback();
            expect(mockProfileScene.scene.start).toHaveBeenCalledWith('MainMenuScene');
        });

        it('should emit "settings-closed" and stop SettingsScene from SettingsScene', () => {
            const mockSettingsScene = {
                scene: { key: 'SettingsScene', stop: jest.fn() },
                events: { emit: jest.fn() },
            };
            mockGame.scene.getScenes.mockReturnValueOnce([mockSettingsScene]);
            backButtonCallback();
            expect(mockSettingsScene.events.emit).toHaveBeenCalledWith('settings-closed');
            expect(mockSettingsScene.scene.stop).toHaveBeenCalledTimes(1);
        });

        it('should start MainMenuScene from GameScene', () => {
            const mockGameScene = { scene: { key: 'GameScene', start: jest.fn() } };
            mockGame.scene.getScenes.mockReturnValueOnce([mockGameScene]);
            backButtonCallback();
            expect(mockGameScene.scene.start).toHaveBeenCalledWith('MainMenuScene');
        });

        it('should start MainMenuScene from GameOverScene', () => {
            const mockGameOverScene = { scene: { key: 'GameOverScene', start: jest.fn() } };
            mockGame.scene.getScenes.mockReturnValueOnce([mockGameOverScene]);
            backButtonCallback();
            expect(mockGameOverScene.scene.start).toHaveBeenCalledWith('MainMenuScene');
        });
    });

    describe('app lifecycle handlers', () => {
        let pauseCallback;
        let resumeCallback;

        beforeEach(() => {
            MobileManager.init(mockGame);
            pauseCallback = mockCapacitorApp.addListener.mock.calls.find(
                (call) => call[0] === 'pause'
            )[1];
            resumeCallback = mockCapacitorApp.addListener.mock.calls.find(
                (call) => call[0] === 'resume'
            )[1];
        });

        it('should pause all game sound on "pause" event', () => {
            pauseCallback();
            expect(mockGame.sound.pauseAll).toHaveBeenCalledTimes(1);
        });

        it('should resume all game sound on "resume" event', () => {
            resumeCallback();
            expect(mockGame.sound.resumeAll).toHaveBeenCalledTimes(1);
        });
    });
});
