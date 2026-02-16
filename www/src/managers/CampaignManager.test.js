// www/src/managers/CampaignManager.test.js

import { CampaignManager } from './CampaignManager.js';
import { DataManager } from './DataManager.js';

// Mock the DataManager module
jest.mock('./DataManager.js', () => ({
    DataManager: {
        setStoryCompleted: jest.fn(),
    },
}));

describe('CampaignManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the state to its default values before each test
        CampaignManager.state = {
            isActive: false,
            currentLevel: 1,
            winsInRow: 0,
            targetWins: 1,
        };
    });

    describe('init', () => {
        it('should reset the campaign state', () => {
            CampaignManager.state.isActive = true;
            CampaignManager.state.currentLevel = 2;
            CampaignManager.state.winsInRow = 5;

            CampaignManager.init();

            expect(CampaignManager.state.isActive).toBe(false);
            expect(CampaignManager.state.currentLevel).toBe(1); // init calls reset
            expect(CampaignManager.state.winsInRow).toBe(0);
        });
    });

    describe('startCampaign', () => {
        it('should set isActive to true and reset progress to level 1', () => {
            CampaignManager.startCampaign();
            expect(CampaignManager.state.isActive).toBe(true);
            expect(CampaignManager.state.currentLevel).toBe(1);
            expect(CampaignManager.state.winsInRow).toBe(0);
        });
    });

    describe('stopCampaign', () => {
        it('should set isActive to false and reset progress', () => {
            CampaignManager.state.isActive = true;
            CampaignManager.state.currentLevel = 2;
            CampaignManager.state.winsInRow = 5;

            CampaignManager.stopCampaign();

            expect(CampaignManager.state.isActive).toBe(false);
            expect(CampaignManager.state.currentLevel).toBe(1); // reset also sets level to 1
            expect(CampaignManager.state.winsInRow).toBe(0);
        });
    });

    describe('reset', () => {
        it('should reset isActive and winsInRow', () => {
            CampaignManager.state.isActive = true;
            CampaignManager.state.winsInRow = 5;

            CampaignManager.reset();

            expect(CampaignManager.state.isActive).toBe(false);
            expect(CampaignManager.state.winsInRow).toBe(0);
            expect(CampaignManager.state.currentLevel).toBe(1); // Should reset to initial, which is 1
        });
    });

    describe('registerWin', () => {
        beforeEach(() => {
            CampaignManager.startCampaign(); // Ensure campaign is active
            CampaignManager.state.targetWins = 2; // Set a target for testing advanceLevel
        });

        it('should return null if campaign is not active', () => {
            CampaignManager.state.isActive = false;
            expect(CampaignManager.registerWin()).toBeNull();
        });

        it('should increment winsInRow', () => {
            CampaignManager.registerWin();
            expect(CampaignManager.state.winsInRow).toBe(1);
        });

        it('should return CONTINUE_LEVEL status if target wins not reached', () => {
            const result = CampaignManager.registerWin();
            expect(result).toEqual({ status: 'CONTINUE_LEVEL', wins: 1 });
        });

        it('should advance level if target wins reached', async () => {
            jest.spyOn(CampaignManager, 'advanceLevel'); // Spy on advanceLevel
            CampaignManager.state.winsInRow = CampaignManager.state.targetWins - 1; // One win away
            await CampaignManager.registerWin();
            expect(CampaignManager.advanceLevel).toHaveBeenCalledTimes(1);
        });

        it('should advance to next level, reset wins, and return LEVEL_UP status', async () => {
            CampaignManager.state.currentLevel = 1;
            CampaignManager.state.winsInRow = CampaignManager.state.targetWins - 1; // One win away
            const result = await CampaignManager.registerWin();
            expect(CampaignManager.state.currentLevel).toBe(2);
            expect(CampaignManager.state.winsInRow).toBe(0);
            expect(result).toEqual({ status: 'LEVEL_UP', nextLevel: CampaignManager.LEVELS[2] });
        });

        it('should return CAMPAIGN_COMPLETE if advancing past last level', async () => {
            DataManager.setStoryCompleted.mockResolvedValueOnce(undefined);
            CampaignManager.state.currentLevel = 3;
            CampaignManager.state.winsInRow = CampaignManager.state.targetWins - 1; // One win away
            const result = await CampaignManager.registerWin();
            expect(DataManager.setStoryCompleted).toHaveBeenCalledWith(true);
            expect(result).toEqual({ status: 'CAMPAIGN_COMPLETE' });
        });
    });

    describe('registerLoss', () => {
        beforeEach(() => {
            CampaignManager.startCampaign(); // Ensure campaign is active
        });

        it('should return null if campaign is not active', () => {
            CampaignManager.state.isActive = false;
            expect(CampaignManager.registerLoss()).toBeNull();
        });

        it('should reset winsInRow to 0', () => {
            CampaignManager.state.winsInRow = 5;
            const result = CampaignManager.registerLoss();
            expect(CampaignManager.state.winsInRow).toBe(0);
            expect(result).toEqual({ status: 'RETRY_LEVEL', level: 1 });
        });
    });

    describe('getCurrentConfig', () => {
        it('should return null if campaign is not active', () => {
            CampaignManager.state.isActive = false;
            expect(CampaignManager.getCurrentConfig()).toBeNull();
        });

        it('should return the current level config if campaign is active', () => {
            CampaignManager.startCampaign();
            CampaignManager.state.currentLevel = 2;
            expect(CampaignManager.getCurrentConfig()).toEqual(CampaignManager.LEVELS[2]);
        });
    });

    describe('isActive', () => {
        it('should return true if campaign is active', () => {
            CampaignManager.state.isActive = true;
            expect(CampaignManager.isActive()).toBe(true);
        });

        it('should return false if campaign is not active', () => {
            CampaignManager.state.isActive = false;
            expect(CampaignManager.isActive()).toBe(false);
        });
    });
});
