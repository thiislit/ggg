// www/src/managers/OpponentAI.test.js

import { OpponentAI } from './OpponentAI.js';

describe('OpponentAI', () => {
    let randomSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        // Spy on Math.random to control its output for deterministic tests
        randomSpy = jest.spyOn(Math, 'random');
    });

    afterEach(() => {
        randomSpy.mockRestore(); // Restore original Math.random after each test
    });

    describe('getChoice', () => {
        // Helper function to simulate random choices from smartStrategy
        const mockRandomForStrategy = (initialRandomChoiceValue, smartChanceResult, strategyRandomResult) => {
            randomSpy
                .mockReturnValueOnce(initialRandomChoiceValue) // For the first Math.random() in getChoice
                .mockReturnValueOnce(smartChanceResult)       // Control smartChance check
                .mockReturnValueOnce(strategyRandomResult);   // Control strategy choice
        };

        it('should return a random choice if totalPlays is less than 3', () => {
            randomSpy.mockReturnValueOnce(0.1); // Math.random() for initial randomChoice
            const choice = OpponentAI.getChoice('MEDIUM', [0, 0, 0]); // totalPlays = 0
            expect(choice).toBe(0); // Math.floor(0.1 * 3) = 0

            randomSpy.mockReturnValueOnce(0.8);
            const choice2 = OpponentAI.getChoice('MEDIUM', [1, 1, 0]); // totalPlays = 2
            expect(choice2).toBe(2); // Math.floor(0.8 * 3) = 2
        });

        it('should always return a random choice for EASY difficulty', () => {
            randomSpy.mockReturnValueOnce(0.1); // Math.random() for initial randomChoice
            const choice = OpponentAI.getChoice('EASY', [10, 5, 2]); // totalPlays > 3
            expect(choice).toBe(0);

            randomSpy.mockReturnValueOnce(0.8);
            const choice2 = OpponentAI.getChoice('EASY', [10, 5, 2]);
            expect(choice2).toBe(2);
        });

        describe('MEDIUM difficulty (smartChance = 0.4)', () => {
            it('should return a random choice if Math.random() > smartChance', () => {
                randomSpy.mockReturnValueOnce(0.1); // For initial randomChoice (0.1 * 3 = 0)
                randomSpy.mockReturnValueOnce(0.5); // Greater than 0.4, so random choice is taken (0.5 > 0.4)
                const choice = OpponentAI.getChoice('MEDIUM', [10, 5, 2]);
                expect(choice).toBe(0);
            });

            it('should return a smart choice if Math.random() < smartChance (player favors Rock)', () => {
                // PlayerStats: [Rock, Paper, Scissors] -> Rock (0) is most used
                // Most used (0 - Rock) -> Winning move for CPU (1 - Paper)
                randomSpy.mockReturnValueOnce(0.1); // 1st call: initial randomChoice (0.1 * 3 = 0)
                randomSpy.mockReturnValueOnce(0.3); // 2nd call: smartChance check (0.3 < 0.4, so smart branch)
                randomSpy.mockReturnValueOnce(0.1); // 3rd call: smartStrategy choice (0.1 * 5 = 0 -> smartStrategy[0] = 1)
                const choice = OpponentAI.getChoice('MEDIUM', [10, 5, 2]);
                expect(choice).toBe(1);
            });

            it('should return a smart choice if Math.random() < smartChance (player favors Paper)', () => {
                // PlayerStats: [Rock, Paper, Scissors] -> Paper (1) is most used
                // Most used (1 - Paper) -> Winning move for CPU (2 - Scissors)
                mockRandomForStrategy(0.1, 0.3, 0.1); // 0.1 for initial randomChoice, 0.3 < 0.4 (smart), 0.1 for strategy choice (0.1 * 5 = 0)
                const choice = OpponentAI.getChoice('MEDIUM', [5, 10, 2]);
                // smartStrategy for MEDIUM if mostUsed is Paper (1): [Scissors, Scissors, Scissors, Paper, Rock]
                // 0.1 * 5 = 0.5 -> floor(0.5) = 0 -> smartStrategy[0] = Scissors (2)
                expect(choice).toBe(2);
            });

            it('should return a smart choice if Math.random() < smartChance (player favors Scissors)', () => {
                // PlayerStats: [Rock, Paper, Scissors] -> Scissors (2) is most used
                // Most used (2 - Scissors) -> Winning move for CPU (0 - Rock)
                mockRandomForStrategy(0.1, 0.3, 0.1); // 0.1 for initial randomChoice, 0.3 < 0.4 (smart), 0.1 for strategy choice (0.1 * 5 = 0)
                const choice = OpponentAI.getChoice('MEDIUM', [2, 5, 10]);
                // smartStrategy for MEDIUM if mostUsed is Scissors (2): [Rock, Rock, Rock, Scissors, Paper]
                // 0.1 * 5 = 0.5 -> floor(0.5) = 0 -> smartStrategy[0] = Rock (0)
                expect(choice).toBe(0);
            });
        });

        describe('HARD difficulty (smartChance = 0.7)', () => {
            it('should return a random choice if Math.random() > smartChance', () => {
                randomSpy.mockReturnValueOnce(0.1); // For initial randomChoice (0.1 * 3 = 0)
                randomSpy.mockReturnValueOnce(0.8); // Greater than 0.7, so random choice is taken (0.8 > 0.7)
                const choice = OpponentAI.getChoice('HARD', [10, 5, 2]);
                expect(choice).toBe(0);
            });

            it('should return a smart choice if Math.random() < smartChance (player favors Rock)', () => {
                // PlayerStats: [Rock, Paper, Scissors] -> Rock (0) is most used
                // Most used (0 - Rock) -> Winning move for CPU (1 - Paper)
                mockRandomForStrategy(0.1, 0.6, 0.1); // 0.1 for initial randomChoice, 0.6 < 0.7 (smart), 0.1 for strategy choice (0.1 * 5 = 0)
                const choice = OpponentAI.getChoice('HARD', [10, 5, 2]);
                // smartStrategy for HARD if mostUsed is Rock (0): [Paper, Paper, Paper, Paper, Scissors]
                // 0.1 * 5 = 0.5 -> floor(0.5) = 0 -> smartStrategy[0] = Paper (1)
                expect(choice).toBe(1);
            });

            it('should return a smart choice if Math.random() < smartChance (player favors Paper)', () => {
                // PlayerStats: [Rock, Paper, Scissors] -> Paper (1) is most used
                // Most used (1 - Paper) -> Winning move for CPU (2 - Scissors)
                mockRandomForStrategy(0.1, 0.6, 0.1); // 0.1 for initial randomChoice, 0.6 < 0.7 (smart), 0.1 for strategy choice (0.1 * 5 = 0)
                const choice = OpponentAI.getChoice('HARD', [5, 10, 2]);
                // smartStrategy for HARD if mostUsed is Paper (1): [Scissors, Scissors, Scissors, Scissors, Rock]
                // 0.1 * 5 = 0.5 -> floor(0.5) = 0 -> smartStrategy[0] = Scissors (2)
                expect(choice).toBe(2);
            });

            it('should return a smart choice if Math.random() < smartChance (player favors Scissors)', () => {
                // PlayerStats: [Rock, Paper, Scissors] -> Scissors (2) is most used
                // Most used (2 - Scissors) -> Winning move for CPU (0 - Rock)
                mockRandomForStrategy(0.1, 0.6, 0.1); // 0.1 for initial randomChoice, 0.6 < 0.7 (smart), 0.1 for strategy choice (0.1 * 5 = 0)
                const choice = OpponentAI.getChoice('HARD', [2, 5, 10]);
                // smartStrategy for HARD if mostUsed is Scissors (2): [Rock, Rock, Rock, Rock, Paper]
                // 0.1 * 5 = 0.5 -> floor(0.5) = 0 -> smartStrategy[0] = Rock (0)
                expect(choice).toBe(0);
            });
        });
    });
});
