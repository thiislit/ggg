import { Storage } from './Storage.js';
import { DataManager } from './DataManager.js';

export const CampaignManager = {
    // Estado de la campaña
    state: {
        isActive: false,      // ¿Estamos jugando modo historia?
        currentLevel: 1,      // 1: Easy, 2: Medium, 3: Hard
        winsInRow: 0,         // Victorias consecutivas actuales
        targetWins: 2         // Meta para pasar de nivel
    },

    // Definición de Niveles
    LEVELS: {
        1: { name: 'OUTER RIM', difficulty: 'EASY', bg: 'bg_campaign_easy' },
        2: { name: 'ASTEROID BELT', difficulty: 'MEDIUM', bg: 'bg_campaign_medium' },
        3: { name: 'ZORG BASE', difficulty: 'HARD', bg: 'bg_campaign_hard' }
    },

    init() {
        // Cargar progreso guardado (opcional, por ahora reinicia al abrir app)
        // Si quisiéramos persistencia entre sesiones:
        // this.state.currentLevel = await Storage.get('campaign_level', 1);
        this.reset();
    },

    startCampaign() {
        this.state.isActive = true;
        this.state.currentLevel = 1;
        this.state.winsInRow = 0;
        console.log("Campaign Started: Level 1");
    },

    stopCampaign() {
        this.state.isActive = false;
        this.reset();
    },

    reset() {
        this.state.isActive = false;
        this.state.winsInRow = 0;
        // No reseteamos currentLevel aquí si quisiéramos checkpoints globales, 
        // pero por diseño dijimos "Campaña corta", así que quizás sí resetear todo al salir.
    },

    // --- LÓGICA DE PROGRESO ---

    registerWin() {
        if (!this.state.isActive) return null;

        this.state.winsInRow++;
        console.log(`Campaign Win: ${this.state.winsInRow}/${this.state.targetWins}`);

        if (this.state.winsInRow >= this.state.targetWins) {
            return this.advanceLevel();
        }
        
        return { status: 'CONTINUE_LEVEL', wins: this.state.winsInRow };
    },

    registerLoss() {
        if (!this.state.isActive) return null;

        this.state.winsInRow = 0; // Reiniciar racha del nivel actual
        console.log("Campaign Loss: Progress Reset for Level " + this.state.currentLevel);
        return { status: 'RETRY_LEVEL', level: this.state.currentLevel };
    },

    async advanceLevel() { // Make this async
        this.state.currentLevel++;
        this.state.winsInRow = 0;

        if (this.state.currentLevel > 3) {
            await DataManager.setStoryCompleted(true); // Set story as completed
            return { status: 'CAMPAIGN_COMPLETE' };
        }

        return { 
            status: 'LEVEL_UP', 
            nextLevel: this.LEVELS[this.state.currentLevel] 
        };
    },

    // --- GETTERS ---
    
    getCurrentConfig() {
        if (!this.state.isActive) return null; // Retorna null si no es campaña
        return this.LEVELS[this.state.currentLevel];
    },

    isActive() {
        return this.state.isActive;
    }
};
