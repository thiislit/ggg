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

    // Paleta de Colores Centralizada (Estilo Terminal Retro)
    COLORS: {
        // Colores Principales (Monocromo Verde)
        P1_BLUE: 0x00ff41,      // Verde Neón (Fósforo) - Jugador
        CPU_RED: 0x008f11,      // Verde Oscuro - Rival/Secundario
        SUCCESS: 0x00ff41,      // Verde para éxito
        GOLD: 0xffffff,         // Blanco para récords/especiales
        
        // UI y Textos
        TEXT_MAIN: '#00ff41',   // Verde Neón
        TEXT_MUTED: '#005f0a',  // Verde muy oscuro para elementos "apagados"
        TEXT_LIGHT: '#ffffff',  // Blanco para contrastes
        TEXT_DARK: '#1a1a1a',   // Gris oscuro para botones invertidos
        
        // Fondos
        BG_DARK: 0x1a1a1a,      // Gris Oscuro de terminal
        UI_OVERLAY: 0x000000    // Negro para sombras y capas
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