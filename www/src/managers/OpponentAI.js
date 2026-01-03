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
            // Lógica simple: Contrarrestar lo que el jugador usa más
            const mostUsed = playerStats.indexOf(Math.max(...playerStats));
            return (mostUsed + 1) % 3;
        }
        
        return randomChoice;
    }
}