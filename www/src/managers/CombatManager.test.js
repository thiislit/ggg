// Mock the dependencies used in CombatManager
jest.mock('../constants/AssetKeys.js', () => ({
    ASSET_KEYS: {
        AUDIO: {
            SFX_WIN: 'sfx_win',
            SFX_LOSE: 'sfx_lose',
            SFX_TIE: 'sfx_tie',
        },
    },
}));

jest.mock('../data/config.js', () => ({
    CONFIG: {
        THEME: {
            primaryStr: '#00ff41',
            secondaryStr: '#008f11',
        },
    },
}));

// Now, import the CombatManager
const { CombatManager } = require('./CombatManager.js');

describe('CombatManager', () => {
    describe('getRoundResult', () => {
        it('should return WIN if player wins (Rock vs Scissors)', () => {
            const result = CombatManager.getRoundResult(0, 2);
            expect(result.result).toBe('WIN');
            expect(result.text).toBe('YOU WIN!');
            expect(result.playerHealthChange).toBe(0);
            expect(result.cpuHealthChange).toBe(-1);
        });

        it('should return LOSE if player loses (Rock vs Paper)', () => {
            const result = CombatManager.getRoundResult(0, 1);
            expect(result.result).toBe('LOSE');
            expect(result.text).toBe('YOU LOSE!');
            expect(result.playerHealthChange).toBe(-1);
            expect(result.cpuHealthChange).toBe(0);
        });

        it('should return DRAW if player and CPU choose the same', () => {
            const result = CombatManager.getRoundResult(0, 0);
            expect(result.result).toBe('DRAW');
            expect(result.text).toBe('DRAW!');
            expect(result.playerHealthChange).toBe(0);
            expect(result.cpuHealthChange).toBe(0);
        });

        it('should return LOSE if player times out', () => {
            const result = CombatManager.getRoundResult(-1, 2);
            expect(result.result).toBe('LOSE');
            expect(result.text).toBe("TIME'S UP!");
            expect(result.playerHealthChange).toBe(-1);
            expect(result.cpuHealthChange).toBe(0);
        });
    });
});
