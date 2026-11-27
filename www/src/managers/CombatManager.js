import { ASSET_KEYS } from '../constants/AssetKeys.js';
import { CONFIG } from '../data/config.js';

export const CombatManager = {
    /**
     * Determina el resultado de una ronda de Piedra, Papel o Tijera.
     * @param {number} playerChoice La elección del jugador (0: Roca, 1: Papel, 2: Tijera, -1: Tiempo fuera).
     * @param {number} cpuChoice La elección del rival (0: Roca, 1: Papel, 2: Tijera, -1: Tiempo fuera; solo online).
     * @returns {{result: string, text: string, color: string, sound: string, playerHealthChange: number, cpuHealthChange: number}} El objeto de resultado.
     */
    getRoundResult(playerChoice, cpuChoice) {
        // Online: si ninguno eligió, nadie pierde vida (mismo resultado en ambos dispositivos)
        if (playerChoice === -1 && cpuChoice === -1) {
            return {
                result: 'DRAW',
                text: 'BOTH TIMED OUT!',
                color: CONFIG.THEME.primaryStr,
                sound: ASSET_KEYS.AUDIO.SFX_TIE,
                playerHealthChange: 0,
                cpuHealthChange: 0,
            };
        }

        if (playerChoice === -1) {
            return {
                result: 'LOSE',
                text: "TIME'S UP!",
                color: '#ff0000',
                sound: ASSET_KEYS.AUDIO.SFX_LOSE,
                playerHealthChange: -1,
                cpuHealthChange: 0,
            };
        }

        // Online: el rival no eligió a tiempo
        if (cpuChoice === -1) {
            return {
                result: 'WIN',
                text: 'RIVAL TIMED OUT!',
                color: CONFIG.THEME.primaryStr,
                sound: ASSET_KEYS.AUDIO.SFX_WIN,
                playerHealthChange: 0,
                cpuHealthChange: -1,
            };
        }

        if (playerChoice === cpuChoice) {
            return {
                result: 'DRAW',
                text: 'DRAW!',
                color: CONFIG.THEME.primaryStr,
                sound: ASSET_KEYS.AUDIO.SFX_TIE,
                playerHealthChange: 0,
                cpuHealthChange: 0,
            };
        }

        if (
            (playerChoice === 0 && cpuChoice === 2) ||
            (playerChoice === 1 && cpuChoice === 0) ||
            (playerChoice === 2 && cpuChoice === 1)
        ) {
            return {
                result: 'WIN',
                text: 'YOU WIN!',
                color: CONFIG.THEME.primaryStr,
                sound: ASSET_KEYS.AUDIO.SFX_WIN,
                playerHealthChange: 0,
                cpuHealthChange: -1,
            };
        }

        return {
            result: 'LOSE',
            text: 'YOU LOSE!',
            color: CONFIG.THEME.secondaryStr,
            sound: ASSET_KEYS.AUDIO.SFX_LOSE,
            playerHealthChange: -1,
            cpuHealthChange: 0,
        };
    },
};
