// www/src/managers/MobileManager.js

/**
 * Manager para la lógica específica de dispositivos móviles y Capacitor.
 * Centraliza la gestión del botón de retroceso de Android, el ciclo de vida de la aplicación y la vibración háptica.
 */
export const MobileManager = {
    /**
     * Inicializa los listeners de Capacitor para el botón de retroceso y el ciclo de vida de la aplicación.
     * @param {Phaser.Game} game La instancia del juego Phaser.
     */
    init: function (game) {
        if (!window.Capacitor) {
            return;
        }

        const App = window.Capacitor.Plugins.App;

        if (!App) {
            return;
        }

        // --- Lógica del Botón Atrás (Android) ---
        App.addListener('backButton', () => {
            // Obtenemos las escenas activas
            const activeScenes = game.scene.getScenes(true);
            if (!activeScenes || activeScenes.length === 0) {
                App.exitApp();
                return;
            }

            // Tomamos la última escena activa (la que está "encima")
            const currentScene = activeScenes[activeScenes.length - 1];
            const key = currentScene.scene.key;

            if (key === 'MainMenuScene') {
                App.exitApp();
            } else if (key === 'ProfileScene') {
                currentScene.scene.start('MainMenuScene');
            } else if (key === 'SettingsScene') {
                currentScene.events.emit('settings-closed');
                currentScene.scene.stop();
            } else if (key === 'GameScene') {
                currentScene.scene.start('MainMenuScene');
            } else if (key === 'GameOverScene') {
                currentScene.scene.start('MainMenuScene');
            } else {
                // Splash u otros: Salir por defecto o ignorar
                // App.exitApp();
            }
        });

        // --- Manejo Avanzado de Audio (Llamadas / Minimizar) ---
        App.addListener('pause', () => {
            game.sound.pauseAll();
        });

        App.addListener('resume', () => {
            game.sound.resumeAll();
        });
    },

    /**
     * Ejecuta una vibración háptica basada en la intensidad.
     * @param {string} style - El estilo de la vibración: 'LIGHT', 'MEDIUM', 'HEAVY'. Por defecto 'MEDIUM'.
     */
    vibrate: function (style = 'MEDIUM') {
        if (!window.Capacitor || !window.Capacitor.Plugins.Haptics) {
            // Fallback para vibración estándar si Capacitor no está pero el navegador lo soporta
            if (navigator.vibrate) {
                navigator.vibrate(style === 'HEAVY' ? 200 : style === 'MEDIUM' ? 100 : 50);
            }
            return;
        }

        const Haptics = window.Capacitor.Plugins.Haptics;

        switch (style.toUpperCase()) {
            case 'LIGHT':
                Haptics.impact({ style: 'LIGHT' });
                break;
            case 'MEDIUM':
                Haptics.impact({ style: 'MEDIUM' });
                break;
            case 'HEAVY':
                Haptics.impact({ style: 'HEAVY' });
                break;
            case 'SUCCESS':
                Haptics.notification({ type: 'SUCCESS' });
                break;
            case 'ERROR':
                Haptics.notification({ type: 'ERROR' });
                break;
            default:
                Haptics.vibrate();
                break;
        }
    },
};
