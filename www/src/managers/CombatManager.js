import { ASSET_KEYS } from '../constants/AssetKeys.js';
import { CONFIG } from '../data/config.js';

export const CombatManager = {
    /**
     * Determina el resultado de una ronda de Piedra, Papel o Tijera.
     * @param {number} playerChoice La elección del jugador (0: Roca, 1: Papel, 2: Tijera, -1: Tiempo fuera).
     * @param {number} cpuChoice La elección de la CPU (0: Roca, 1: Papel, 2: Tijera).
     * @returns {{result: string, text: string, color: string, sound: string, playerHealthChange: number, cpuHealthChange: number}} El objeto de resultado.
     */
    getRoundResult(playerChoice, cpuChoice) {
        if (playerChoice === -1) {
            return {
                result: 'LOSE',
                text: "TIME'S UP!",
                color: '#ff0000',
                sound: ASSET_KEYS.AUDIO.SFX_LOSE,
                playerHealthChange: -1,
                cpuHealthChange: 0
            };
        }
        
        if (playerChoice === cpuChoice) {
            return {
                result: 'DRAW',
                text: 'DRAW!',
                color: CONFIG.THEME.primaryStr,
                sound: ASSET_KEYS.AUDIO.SFX_TIE,
                playerHealthChange: 0,
                cpuHealthChange: 0
            };
        }

        if ((playerChoice === 0 && cpuChoice === 2) || (playerChoice === 1 && cpuChoice === 0) || (playerChoice === 2 && cpuChoice === 1)) {
            return {
                result: 'WIN',
                text: 'YOU WIN!',
                color: CONFIG.THEME.primaryStr,
                sound: ASSET_KEYS.AUDIO.SFX_WIN,
                playerHealthChange: 0,
                cpuHealthChange: -1
            };
        }

        return {
            result: 'LOSE',
            text: 'YOU LOSE!',
            color: CONFIG.THEME.secondaryStr,
            sound: ASSET_KEYS.AUDIO.SFX_LOSE,
            playerHealthChange: -1,
            cpuHealthChange: 0
        };
    }
};
