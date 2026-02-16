export class OpponentAI {
    /**
     * Predice el movimiento de la CPU basado en estadísticas y dificultad.
     * @param {string} difficulty - 'EASY', 'MEDIUM', 'HARD'
     * @param {number[]} playerStats - Array con conteo de [Rock, Paper, Scissors] usados por el jugador
     * @returns {number} 0, 1 o 2
     */
    static getChoice(difficulty, playerStats) {
        const diff = difficulty || 'MEDIUM';
        const totalPlays = playerStats.reduce((a, b) => a + b, 0);
        const randomChoice = Math.floor(Math.random() * 3);

        // Primeras rondas siempre aleatorias
        if (totalPlays < 3) return randomChoice;

        let smartChance = 0;
        if (diff === 'EASY') smartChance = 0;
        else if (diff === 'MEDIUM') smartChance = 0.4;
        else if (diff === 'HARD') smartChance = 0.7;

        // Tirada de inteligencia vs azar
        if (Math.random() < smartChance) {
            const mostUsed = playerStats.indexOf(Math.max(...playerStats)); // Lo que el jugador usa más
            const winningMove = (mostUsed + 1) % 3; // Lo que gana al más usado
            const losingMove = (mostUsed + 2) % 3; // Lo que pierde contra el más usado
            const tyingMove = mostUsed; // Lo que empata con el más usado
            
            let smartStrategy = [];
            if (diff === 'MEDIUM') {
                // 60% ganar, 20% empatar, 20% perder (simular variabilidad)
                smartStrategy = [winningMove, winningMove, winningMove, tyingMove, losingMove];
            } else if (diff === 'HARD') {
                // 80% ganar, 20% perder (más agresiva, con faroles ocasionales)
                smartStrategy = [winningMove, winningMove, winningMove, winningMove, losingMove];
            } else {
                // EASY u otros, aunque debería ser solo random
                smartStrategy = [randomChoice]; // Fallback, aunque EASY es siempre random
            }
            const strategyRandomValue = Math.random();
            const chosenIndex = Math.floor(strategyRandomValue * smartStrategy.length);
            const finalChoice = smartStrategy[chosenIndex];
            return finalChoice;
        }

        return randomChoice;
    }
}
