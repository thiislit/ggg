import { APP_VERSION } from '../constants/version.js';

/**
 * Contenido de los créditos (final del juego y Opciones → CREDITS).
 * Para añadir o cambiar algo basta con editar este archivo.
 */
export const CREDITS = {
    TITLE: 'RPS RETRO',
    VERSION: `v${APP_VERSION}`,
    AUTHOR: 'AXEL',
    /** Formas de contacto que se muestran (etiqueta + valor). */
    CONTACT: [{ label: 'TIKTOK', value: '@thiislit_' }],
    /** Mensaje del creador sobre el proyecto (aparece casi al final). */
    MESSAGE: 'LITTLE BY LITTLE,\nEVERYTHING WILL\nTAKE SHAPE.',
    YEAR: 2026,

    /**
     * Secciones en orden. `names` son las líneas bajo cada encabezado.
     * Recursos de terceros: añade aquí autor y licencia si la licencia lo pide,
     * p. ej. { heading: 'ADDITIONAL ART', names: ['NOMBRE DEL PACK', 'BY AUTOR'] }.
     */
    SECTIONS: [
        { heading: 'A GAME BY', names: ['AXEL'] },
        { heading: 'GAME DESIGN\n& PROGRAMMING', names: ['AXEL'] },
        { heading: 'BUILT WITH', names: ['PHASER 3', 'CAPACITOR', 'SUPABASE'] },
        { heading: 'FONT', names: ['PRESS START 2P', 'BY CODEMAN38'] },
        { heading: 'SPECIAL THANKS', names: ['EVERY PLAYER WHO', 'MADE IT THIS FAR'] },
    ],
};
