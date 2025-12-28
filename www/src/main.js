import { SplashScene } from './scenes/SplashScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { BackgroundScene } from './scenes/BackgroundScene.js';

const config = {
    type: Phaser.AUTO,
    width: 720,
    height: 1280,
    backgroundColor: '#000000', // Color base negro (se verá mientras carga el fondo)
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // El orden importa: SplashScene arranca primero y ella lanza el background
    scene: [SplashScene, BackgroundScene, MainMenuScene, GameScene, GameOverScene, SettingsScene]
};

const game = new Phaser.Game(config);

// --- Lógica del Botón Atrás (Android) ---
// Solo se activa si estamos en un entorno Capacitor nativo
if (window.Capacitor) {
    const App = window.Capacitor.Plugins.App;

    if (App) {
        App.addListener('backButton', () => {
            // Obtenemos las escenas activas
            const activeScenes = game.scene.getScenes(true);
            if (!activeScenes || activeScenes.length === 0) {
                App.exitApp();
                return;
            }

            // Tomamos la última escena activa (la que está "encima")
            // Por ejemplo, SettingsScene encima de GameScene
            const currentScene = activeScenes[activeScenes.length - 1];
            const key = currentScene.scene.key;

            console.log("Back button pressed in:", key);

            if (key === 'MainMenuScene') {
                // En el menú principal, salimos de la app
                App.exitApp();
            } 
            else if (key === 'SettingsScene') {
                // En opciones, cerramos la escena (simula el botón volver)
                currentScene.events.emit('settings-closed');
                currentScene.scene.stop();
                // Si Settings se abrió con 'launch' (overlay), la de abajo sigue ahí.
                // Si se abrió con 'start', no hay nada abajo, habría que iniciar MainMenu.
                // Asumimos 'launch' según tu código anterior.
            }
            else if (key === 'GameScene') {
                // En juego, volvemos al menú (detener partida)
                // Opcional: Podrías preguntar confirmación primero
                currentScene.scene.start('MainMenuScene');
            }
            else if (key === 'GameOverScene') {
                // En Game Over, volvemos al menú
                currentScene.scene.start('MainMenuScene');
            }
            else {
                // Splash u otros: Salir por defecto o ignorar
                // App.exitApp();
            }
        });

        // --- Manejo Avanzado de Audio (Llamadas / Minimizar) ---
        App.addListener('pause', () => {
            // Pausar todo el motor de sonido de Phaser
            game.sound.pauseAll();
        });

        App.addListener('resume', () => {
            // Reanudar el motor de sonido
            game.sound.resumeAll();
        });
    }
}