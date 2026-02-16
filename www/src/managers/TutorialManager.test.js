// www/src/managers/TutorialManager.test.js

import { TutorialManager } from './TutorialManager.js';
import { DataManager } from './DataManager.js';
import { CONFIG } from '../data/config.js'; // Import CONFIG for its structure

jest.mock('../data/config.js', () => ({
    CONFIG: {
        WIDTH: 800, // Matches mockScene.scale.width
        HEIGHT: 600, // Matches mockScene.scale.height
        COLORS: {
            BG_DARK: 0x000000,
            P1_BLUE: 0x0000ff,
            TEXT_MAIN: '#ffffff',
            // Add other COLORS properties used in TutorialManager if needed
        },
        FONTS: {
            MAIN: 'Press Start 2P',
            SIZES: {
                NORMAL: '16px',
            },
            // Add other FONTS properties used in TutorialManager if needed
        },
        THEME: {
            primary: 0x1a2b3c,
            // Add other THEME properties used in TutorialManager if needed
        },
    },
}));

// Mock DataManager
jest.mock('./DataManager.js', () => ({
    DataManager: {
        hasSeenTutorial: jest.fn(),
        setTutorialSeen: jest.fn(),
    },
}));

// Mock CONFIG for necessary properties
const mockConfigColors = {
    BG_DARK: 0x000000,
    P1_BLUE: 0x0000ff,
    TEXT_MAIN: '#ffffff',
};
const mockConfigFonts = {
    MAIN: 'Press Start 2P',
    SIZES: {
        NORMAL: '16px',
    },
};
const mockConfigTheme = {
    primary: 0x1a2b3c,
};



describe('TutorialManager', () => {
    let mockScene;
    let tutorialManager;
    let mockRectangle;
    let mockText;
    let mockContainer;
    let mockGraphics;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRectangle = {
            setOrigin: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            setStrokeStyle: jest.fn().mockReturnThis(),
            on: jest.fn(), // For pointerdown listener
            // add other methods as needed by the actual code
        };
        mockText = {
            setOrigin: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn(),
            setText: jest.fn().mockReturnThis(),
        };
        mockContainer = {
            setDepth: jest.fn().mockReturnThis(),
            add: jest.fn(), // Can be spied on if needed
            destroy: jest.fn(),
            alpha: 1, // For tween targets
        };
        mockGraphics = {
            fillStyle: jest.fn().mockReturnThis(),
            fillRect: jest.fn().mockReturnThis(),
            clear: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
        };

        mockScene = {
            scale: {
                width: 800,
                height: 600,
            },
            add: {
                container: jest.fn(() => mockContainer),
                rectangle: jest.fn(() => mockRectangle),
                text: jest.fn(() => mockText),
                graphics: jest.fn(() => mockGraphics),
            },
            tweens: {
                add: jest.fn(),
            },
            sys: {
                game: {
                    events: {
                        once: jest.fn(),
                        off: jest.fn(),
                    },
                },
            },
        };

        tutorialManager = new TutorialManager(mockScene);
    });


    describe('constructor', () => {
        it('should assign the scene and initialize tutorialContainer to null', () => {
            expect(tutorialManager.scene).toBe(mockScene);
            expect(tutorialManager.tutorialContainer).toBeNull();
        });
    });

    describe('checkTutorial', () => {
        it('should call showTutorial if DataManager.hasSeenTutorial returns false', () => {
            DataManager.hasSeenTutorial.mockReturnValueOnce(false);
            jest.spyOn(tutorialManager, 'showTutorial');

            tutorialManager.checkTutorial();

            expect(DataManager.hasSeenTutorial).toHaveBeenCalledTimes(1);
            expect(tutorialManager.showTutorial).toHaveBeenCalledTimes(1);
        });

        it('should not call showTutorial if DataManager.hasSeenTutorial returns true', () => {
            DataManager.hasSeenTutorial.mockReturnValueOnce(true);
            jest.spyOn(tutorialManager, 'showTutorial');

            tutorialManager.checkTutorial();

            expect(DataManager.hasSeenTutorial).toHaveBeenCalledTimes(1);
            expect(tutorialManager.showTutorial).not.toHaveBeenCalled();
        });
    });

    describe('showTutorial', () => {
        let btnRectMock; // To capture the interactive rect
        let onPointerDownCallback; // To capture the pointerdown callback

        beforeEach(() => {
            // Mock the button's interactive rect and capture its pointerdown
            mockScene.add.rectangle.mockImplementation((x, y, w, h, color) => {
                if (w === 200 && h === 60) { // This is the button rect
                    btnRectMock = {
                        setOrigin: jest.fn().mockReturnThis(),
                        setStrokeStyle: jest.fn().mockReturnThis(),
                        setInteractive: jest.fn((options) => {
                            if (options && options.useHandCursor) {
                                return btnRectMock;
                            }
                        }),
                        on: jest.fn((event, callback) => {
                            if (event === 'pointerdown') {
                                onPointerDownCallback = callback;
                            }
                        }),
                    };
                    return btnRectMock;
                }
                return mockRectangle; // Other rectangles
            });
            // Ensure tweens.add is always mocked if used
            mockScene.tweens.add.mockImplementation((config) => {
                if (config.onComplete) config.onComplete(); // Immediately call onComplete for simplicity
            });
        });

        it('should create tutorial UI elements', () => {
            tutorialManager.showTutorial();

            expect(mockScene.add.container).toHaveBeenCalledTimes(2);
            expect(mockScene.add.rectangle).toHaveBeenCalledTimes(2); // overlay and button rect
            expect(mockScene.add.text).toHaveBeenCalledTimes(3); // main text, button text, hand emoji
            expect(mockScene.add.rectangle).toHaveBeenCalledWith(
                0,
                0,
                mockScene.scale.width,
                mockScene.scale.height,
                mockConfigColors.BG_DARK,
                0.8
            );
            expect(mockScene.add.text).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                `CHOOSE YOUR WEAPON
BEFORE TIME RUNS OUT!`,
                expect.any(Object)
            );
            expect(mockScene.add.text).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                'GOT IT!',
                expect.any(Object)
            );
            expect(mockScene.add.text).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                '👆',
                expect.any(Object)
            );
            expect(mockScene.tweens.add).toHaveBeenCalledTimes(1); // hand emoji animation
        });

        it('should destroy tutorialContainer and set tutorial seen to true when button is clicked', async () => {
            tutorialManager.showTutorial();
            // Simulate button click
            if (onPointerDownCallback) {
                await onPointerDownCallback();
            }

            expect(DataManager.setTutorialSeen).toHaveBeenCalledWith(true);
            // Tween onComplete is mocked to call destroy immediately
            expect(mockContainer.destroy).toHaveBeenCalledTimes(1);
        });
    });
});
