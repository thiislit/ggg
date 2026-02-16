// www/src/managers/FatalityManager.test.js

import { FatalityManager } from './FatalityManager.js';
import { AudioManager } from './AudioManager.js'; // Import AudioManager for mocking

// Mock the AudioManager module
jest.mock('./AudioManager.js', () => ({
    AudioManager: {
        playSFX: jest.fn(),
    },
}));

describe('FatalityManager', () => {
    let mockScene;
    let fatalityManager;
    let mockTarget;
    let mockAttacker;
    let mockGraphics; // For slash in scissor fatality

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock a Phaser Scene
        mockGraphics = {
            lineStyle: jest.fn().mockReturnThis(),
            beginPath: jest.fn().mockReturnThis(),
            moveTo: jest.fn().mockReturnThis(),
            lineTo: jest.fn().mockReturnThis(),
            strokePath: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
        };

        mockScene = {
            cameras: {
                main: {
                    shake: jest.fn(),
                    flash: jest.fn(),
                    alpha: 1,
                },
            },
            scale: {
                width: 800,
                height: 600,
            },
            add: {
                graphics: jest.fn(() => mockGraphics),
                sprite: jest.fn(() => ({
                    setDepth: jest.fn().mockReturnThis(),
                    setTint: jest.fn().mockReturnThis(),
                    setScale: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                })),
            },
            tweens: {
                add: jest.fn(),
            },
        };

        mockTarget = {
            x: 100,
            y: 100,
            setTint: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setAngle: jest.fn().mockReturnThis(),
        };

        mockAttacker = {
            x: 200,
            y: 200,
            setDepth: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setTint: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
        };

        fatalityManager = new FatalityManager(mockScene);
    });

    describe('constructor', () => {
        it('should correctly assign the scene', () => {
            expect(fatalityManager.scene).toBe(mockScene);
        });
    });

    describe('play', () => {
        it('should trigger rock fatality for choiceIndex 0', () => {
            fatalityManager.play(0, mockTarget, mockAttacker, true, jest.fn());
            expect(AudioManager.playSFX).toHaveBeenCalledWith(mockScene, 'fatality_rock');
        });

        it('should trigger paper fatality for choiceIndex 1', () => {
            fatalityManager.play(1, mockTarget, mockAttacker, true, jest.fn());
            expect(AudioManager.playSFX).toHaveBeenCalledWith(mockScene, 'fatality_paper');
        });

        it('should trigger scissor fatality for choiceIndex 2', () => {
            fatalityManager.play(2, mockTarget, mockAttacker, true, jest.fn());
            expect(AudioManager.playSFX).toHaveBeenCalledWith(mockScene, 'fatality_scissor');
        });
    });

    describe('playRockFatality', () => {
        it('should play sfx, shake camera, flash camera, and animate attacker', () => {
            const onComplete = jest.fn();
            fatalityManager.playRockFatality(mockTarget, mockAttacker, true, onComplete);

            expect(AudioManager.playSFX).toHaveBeenCalledWith(mockScene, 'fatality_rock');
            expect(mockScene.cameras.main.shake).toHaveBeenCalledWith(4000, 0.05);
            expect(mockScene.cameras.main.flash).toHaveBeenCalledWith(500, 255, 255, 255);
            expect(mockAttacker.setDepth).toHaveBeenCalledWith(100);
            expect(mockScene.tweens.add).toHaveBeenCalledTimes(1);

            const tweenConfig = mockScene.tweens.add.mock.calls[0][0];
            expect(tweenConfig.targets).toBe(mockAttacker);
            expect(tweenConfig.scale).toBe(5);
            expect(tweenConfig.x).toBe(mockScene.scale.width / 2);
            expect(tweenConfig.y).toBe(mockScene.scale.height / 2);
            expect(tweenConfig.duration).toBe(3400);
            expect(tweenConfig.ease).toBe('Back.easeIn');

            // Simulate tween completion
            tweenConfig.onComplete();
            expect(mockTarget.setVisible).toHaveBeenCalledWith(false);
            expect(onComplete).toHaveBeenCalledWith(true);
        });
    });

    describe('playPaperFatality', () => {
        it('should play sfx, tint target, and animate target and attacker', () => {
            const onComplete = jest.fn();
            fatalityManager.playPaperFatality(mockTarget, mockAttacker, true, onComplete);

            expect(AudioManager.playSFX).toHaveBeenCalledWith(mockScene, 'fatality_paper');
            expect(mockTarget.setTint).toHaveBeenCalledWith(0x888888);
            expect(mockAttacker.setDepth).toHaveBeenCalledWith(100);
            expect(mockScene.tweens.add).toHaveBeenCalledTimes(2);

            // Target tween
            const targetTweenConfig = mockScene.tweens.add.mock.calls[0][0];
            expect(targetTweenConfig.targets).toBe(mockTarget);
            expect(targetTweenConfig.scale).toBe(0);
            expect(targetTweenConfig.angle).toBe(720);
            expect(targetTweenConfig.duration).toBe(4500);
            expect(targetTweenConfig.ease).toBe('Power2');
            targetTweenConfig.onComplete();
            expect(mockTarget.setVisible).toHaveBeenCalledWith(false);
            expect(onComplete).toHaveBeenCalledWith(true);

            // Attacker tween
            const attackerTweenConfig = mockScene.tweens.add.mock.calls[1][0];
            expect(attackerTweenConfig.targets).toBe(mockAttacker);
            expect(attackerTweenConfig.scale).toBe(20);
            expect(attackerTweenConfig.alpha).toBe(0.5);
            expect(attackerTweenConfig.duration).toBe(4500);
        });
    });

    describe('playScissorFatality', () => {
        it('should play sfx, create and animate slash, shake camera, and animate target', () => {
            const onComplete = jest.fn();
            fatalityManager.playScissorFatality(mockTarget, mockAttacker, true, onComplete);

            expect(AudioManager.playSFX).toHaveBeenCalledWith(mockScene, 'fatality_scissor');
            expect(mockScene.add.graphics).toHaveBeenCalledTimes(1);
            expect(mockGraphics.lineStyle).toHaveBeenCalledWith(10, 0xffffff);
            expect(mockGraphics.beginPath).toHaveBeenCalledTimes(1);
            expect(mockGraphics.moveTo).toHaveBeenCalledWith(mockTarget.x - 100, mockTarget.y - 100);
            expect(mockGraphics.lineTo).toHaveBeenCalledWith(mockTarget.x + 100, mockTarget.y + 100);
            expect(mockGraphics.setDepth).toHaveBeenCalledWith(200);
            expect(mockGraphics.strokePath).toHaveBeenCalledTimes(1);
            expect(mockGraphics.setAlpha).toHaveBeenCalledWith(0);

            expect(mockScene.tweens.add).toHaveBeenCalledTimes(2);

            // Slash tween
            const slashTweenConfig = mockScene.tweens.add.mock.calls[0][0];
            expect(slashTweenConfig.targets).toBe(mockGraphics);
            expect(slashTweenConfig.alpha).toEqual({ from: 1, to: 0 });
            expect(slashTweenConfig.duration).toBe(2000);
            expect(slashTweenConfig.onStart).toBeInstanceOf(Function);
            slashTweenConfig.onStart();
            expect(mockScene.cameras.main.shake).toHaveBeenCalledWith(2000, 0.02);
            slashTweenConfig.onComplete();
            expect(mockGraphics.destroy).toHaveBeenCalledTimes(1);

            // Target tween
            const targetTweenConfig = mockScene.tweens.add.mock.calls[1][0];
            expect(targetTweenConfig.targets).toBe(mockTarget);
            expect(targetTweenConfig.x).toBe('+=50');
            expect(targetTweenConfig.y).toBe('+=50');
            expect(targetTweenConfig.alpha).toBe(0);
            expect(targetTweenConfig.duration).toBe(3600);
            expect(targetTweenConfig.ease).toBe('Power1');
            expect(targetTweenConfig.delay).toBe(2100);
            targetTweenConfig.onComplete();
            expect(onComplete).toHaveBeenCalledWith(true);
        });
    });
});
