// www/src/managers/MobileManager.js

/**
 * Manager para la lógica específica de dispositivos móviles y Capacitor.
 * Centraliza la gestión del botón de retroceso de Android y el ciclo de vida de la aplicación.
 */
export const MobileManager = {
    /**
     * Inicializa los listeners de Capacitor para el botón de retroceso y el ciclo de vida de la aplicación.
     * @param {Phaser.Game} game La instancia del juego Phaser.
     */
    init: function (game) {
        if (!window.Capacitor) {
            console.log('Capacitor no detectado. Saltando inicialización de MobileManager.');
            return;
        }

        const App = window.Capacitor.Plugins.App;

        if (!App) {
            console.log(
                'Capacitor App plugin no disponible. Algunas funcionalidades móviles no estarán activas.'
            );
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

            console.log('Back button pressed in:', key);

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

        console.log('MobileManager inicializado para Capacitor.');
    },
};
