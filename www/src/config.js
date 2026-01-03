export const CONFIG = {
    WIDTH: 720,
    HEIGHT: 1280,
    
    // Configuración de Tiempos (Milisegundos)
    TIMING: {
        ROUND_DURATION: 5000,   // Tiempo para elegir
        RESULT_DELAY: 2000,     // Tiempo antes de mostrar resultado final
        FADE_DURATION: 500,     // Transición entre escenas
        BUTTON_BOUNCE: 50       // Duración del efecto de clic
    },

    // Paleta de Colores Centralizada
    COLORS: {
        // Colores Principales (Neon)
        P1_BLUE: 0x00A8F3,      // Azul Player 1 (Cyan)
        CPU_RED: 0xF34235,      // Rojo CPU/Danger
        SUCCESS: 0x2ecc71,      // Verde Éxito/Restart
        GOLD: 0xffd700,         // Dorado Récords
        
        // UI y Textos
        TEXT_MAIN: '#ffffff',   // Blanco puro
        TEXT_MUTED: '#888888',  // Gris apagado (créditos, disabled)
        TEXT_DARK: '#000000',   // Negro para textos sobre botones claros
        
        // Fondos
        BG_DARK: 0x000000,      // Negro total
        UI_OVERLAY: 0x000000    // Color para capas semitransparentes
    },

    // Estilos de Fuente
    FONTS: {
        MAIN: '"Press Start 2P"', // Fuente Pixel Art
        SIZES: {
            SMALL: '10px',
            NORMAL: '14px',
            LARGE: '20px',
            TITLE: '40px',
            EMOJI: '55px',
            EMOJI_BIG: '120px'
        }
    },

    // Configuración de UI
    UI: {
        BUTTON_RADIUS: 15,      // Redondeo de esquinas
        BORDER_WIDTH: 3         // Grosor de bordes
    }
};