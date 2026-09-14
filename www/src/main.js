import { SplashScene } from './scenes/SplashScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { BackgroundScene } from './scenes/BackgroundScene.js';
import { ProfileScene } from './scenes/ProfileScene.js';
import { StoryScene } from './scenes/StoryScene.js';
import { EpilogueScene } from './scenes/EpilogueScene.js'; // Importar la nueva escena
import { MobileManager } from './managers/MobileManager.js'; // Import MobileManager
import { GAME_WIDTH, GAME_HEIGHT } from './constants/game.js';

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000000', // Color base negro (se verá mientras carga el fondo)
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // El orden importa: SplashScene arranca primero y ella lanza el background
    scene: [
        SplashScene,
        StoryScene,
        BackgroundScene,
        ProfileScene,
        MainMenuScene,
        GameScene,
        GameOverScene,
        SettingsScene,
        EpilogueScene,
    ],
};

const game = new Phaser.Game(config);

// Initialize MobileManager
MobileManager.init(game);
