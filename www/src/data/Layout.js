/**
 * Definición centralizada del Layout del juego.
 * Controla el posicionamiento de todos los elementos de la interfaz.
 */
export const LAYOUT = {
    // Proporciones verticales principales
    GRID: {
        TOP_Y_FACTOR: 0.18,
        TOP_OFFSET: 50,
        BOTTOM_Y_FACTOR: 0.72,
    },

    // HUD Superior
    HUD: {
        OFFSET_Y: 45,
        HEARTS_OFFSET: -3,
        PLANET_SIZE: 105,
        SPACING: {
            PLANET_TOP: -30,
            PLANET_TEXT: 15,
            SPECIES: 18,
            NAME: 22,
        },
    },

    // Zona de Combate Central
    COMBAT: {
        AVATAR_Y_FACTOR: 0.42,
        AVATAR_OFFSET: -90,
        EMOJI_Y_FACTOR: 0.58,
        EMOJI_OFFSET: 20,
        TIMER_BAR_OFFSET: -25,
    },

    // Controles Inferiores
    CONTROLS: {
        BTN_Y_OFFSET: 55,
        SWITCH_Y_OFFSET: 135,
    },

    // Botones de Juego (Piedra, Papel, Tijera)
    BUTTONS: {
        START_OFFSET: 80, // Offset desde la línea inferior de la grilla
        SPACING: 100, // Espacio vertical entre botones
    },

    // Columnas Horizontales
    COLUMNS: {
        LEFT: 0.25,
        RIGHT: 0.75,
        CENTER: 0.5,
    },

    // Métodos de utilidad para cálculos rápidos
    getGridTop(height) {
        return height * this.GRID.TOP_Y_FACTOR + this.GRID.TOP_OFFSET;
    },
    getGridBottom(height) {
        return height * this.GRID.BOTTOM_Y_FACTOR;
    },
    getHeartsY(height) {
        return this.getGridTop(height) + this.HUD.HEARTS_OFFSET;
    },
    getAvatarY(height) {
        return height * this.COMBAT.AVATAR_Y_FACTOR + this.COMBAT.AVATAR_OFFSET;
    },
    getEmojiY(height) {
        return height * this.COMBAT.EMOJI_Y_FACTOR + this.COMBAT.EMOJI_OFFSET;
    },

    // Helper para obtener X basado en columna (izq/der) y ancho
    getColumnX(width, isRight) {
        return isRight ? width * this.COLUMNS.RIGHT : width * this.COLUMNS.LEFT;
    },
};
