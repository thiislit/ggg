// www/src/ui/components/Switch.test.js

// Mocks de dependencias locales antes de cualquier import
jest.mock('../../data/config.js', () => ({
  CONFIG: {
    THEME: {
        primary: 0x00ff41, primaryStr: '#00ff41',
        secondary: 0x008f11, secondaryStr: '#008f11',
        accent: 0xffffff, accentStr: '#ffffff',
        BG: 0x1a1a1a, BG_STR: '#1a1a1a',
        TEXT_DARK: '#000000'
    },
    FONTS: { MAIN: 'Press Start 2P', SIZES: { NORMAL: '14px', SMALL: '10px' } },
    UI: { BUTTON_RADIUS: 15 },
    COLORS: { TEXT_DARK: '#000000' }
  },
}));

jest.mock('../../constants/AssetKeys.js', () => ({
  ASSET_KEYS: {
    AUDIO: { SFX_BUTTON: 'sfx_button' }, // Solo la clave necesaria
  },
}));

jest.mock('../../managers/AudioManager.js', () => ({
  AudioManager: {
    playSFX: jest.fn(),
    // otros métodos si son usados en Switch
  },
}));

// Ahora hacemos el import normal del componente (después de los mocks)
const { Switch } = require('./Switch.js');
const { AudioManager } = require('../../managers/AudioManager.js');
const { ASSET_KEYS } = require('../../constants/AssetKeys.js'); // Add this import


describe('Switch Component', () => {
  let mockScene;

  beforeEach(() => {
    // Configuramos un "scene" mock que Phaser necesita
    mockScene = new Phaser.Scene();
    jest.clearAllMocks();
  });

  test('should create a Switch instance', () => {
    const instance = new Switch(mockScene, 0, 0, false, jest.fn());
    expect(instance).toBeDefined();
  });

  test('should call AudioManager.playSFX when toggled', () => {
    const instance = new Switch(mockScene, 0, 0, false, jest.fn());
    
    // Simular el evento de usuario
    instance.inputArea.emit('pointerup');

    // Verificar que AudioManager.playSFX se haya llamado
    expect(AudioManager.playSFX).toHaveBeenCalledWith(mockScene, ASSET_KEYS.AUDIO.SFX_BUTTON);
  });

  test('should redraw when refreshColors is called', () => {
    const instance = new Switch(mockScene, 0, 0, false, jest.fn());
    
    // Espiar el método drawSwitch *después* de que el constructor lo haya llamado una vez
    const drawSwitchSpy = jest.spyOn(instance, 'drawSwitch');

    instance.refreshColors();

    expect(drawSwitchSpy).toHaveBeenCalled();
  });
});
