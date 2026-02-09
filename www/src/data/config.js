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

    // --- SISTEMA DE COLORES CENTRALIZADO ---
    // Paletas predefinidas por fondo
    PALETTES: {
        bg_green:  { PRIMARY: 0x00ff41, SECONDARY: 0x008f11 }, // Verde Clásico
        bg_purple: { PRIMARY: 0xdf00ff, SECONDARY: 0x7a008c }, // Morado Neón
        bg_blue:   { PRIMARY: 0x00d2ff, SECONDARY: 0x005c70 }  // Azul Cyber
    },

    THEME: {
        // Valores actuales (se actualizan dinámicamente)
        PRIMARY: 0x00ff41,
        SECONDARY: 0x008f11,
        ACCENT: 0xffffff,
        BG: 0x1a1a1a,

        // Generadores automáticos
        get PRIMARY_STR() { return '#' + this.PRIMARY.toString(16).padStart(6, '0'); },
        get SECONDARY_STR() { return '#' + this.SECONDARY.toString(16).padStart(6, '0'); },
        get ACCENT_STR() { return '#' + this.ACCENT.toString(16).padStart(6, '0'); },
        get BG_STR() { return '#' + this.BG.toString(16).padStart(6, '0'); },

        TEXT_DARK: '#000000',
        TEXT_MUTED: '#005f0a',

        // Método para cambiar el tema en tiempo real
        setFromPalette(paletteId) {
            const colors = CONFIG.PALETTES[paletteId] || CONFIG.PALETTES.bg_green;
            this.PRIMARY = colors.PRIMARY;
            this.SECONDARY = colors.SECONDARY;
        },

        // Aliases para compatibilidad
        get primary() { return this.PRIMARY; },
        get primaryStr() { return this.PRIMARY_STR; },
        get secondary() { return this.SECONDARY; },
        get secondaryStr() { return this.SECONDARY_STR; },
        get accent() { return this.ACCENT; },
        get accentStr() { return this.ACCENT_STR; }
    },

    // Mapeo de compatibilidad (Para no romper código antiguo que use CONFIG.COLORS)
    get COLORS() {
        return {
            P1_BLUE: this.THEME.PRIMARY,
            CPU_RED: this.THEME.SECONDARY,
            SUCCESS: this.THEME.PRIMARY,
            GOLD: this.THEME.ACCENT,
            TEXT_MAIN: this.THEME.PRIMARY_STR,
            TEXT_MUTED: this.THEME.TEXT_MUTED,
            TEXT_LIGHT: this.THEME.ACCENT_STR,
            TEXT_DARK: '#1a1a1a',
            BG_DARK: this.THEME.BG,
            UI_OVERLAY: 0x000000,
            AI_THINKING_RED: 0xFF0000, // Rojo para cuando la IA está "pensando"
            AI_READY_GREEN: 0x00FF00   // Verde para cuando la IA ya ha elegido
        };
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
        BORDER_WIDTH: 3,        // Grosor de bordes
        
        EPILOGUE: {
            ZORG_SCALE: 1.2,
            PRINCESS_SCALE: 0.8
        },

        DIALOGUE_BOX: {
            FONT_SIZE: '16px',
            LINE_SPACING: 8,
            RADIUS: 10
        }
    }
};