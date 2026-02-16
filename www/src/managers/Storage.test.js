// www/src/managers/Storage.test.js
import { jest } from '@jest/globals';
import { Storage } from './Storage.js';
const { localStorageMock } = require('./__mocks__/localStorageMock.js');

// Jest usará automáticamente este mock porque hemos modificado Storage.js para importarlo
// en el entorno de test.

describe('Storage Module', () => {

  beforeEach(() => {
    // Reseteamos el mock y su historial antes de cada test
    localStorageMock.clear();
    jest.clearAllMocks();

    // Limpiar también mocks de Capacitor
    if (global.Capacitor && global.Capacitor.Plugins.Preferences) {
        jest.mocked(global.Capacitor.Plugins.Preferences.get).mockClear();
        jest.mocked(global.Capacitor.Plugins.Preferences.set).mockClear();
        jest.mocked(global.Capacitor.Plugins.Preferences.remove).mockClear();
        jest.mocked(global.Capacitor.Plugins.Preferences.clear).mockClear();
    }
  });

  describe('with LocalStorage Backend (Capacitor Unavailable)', () => {
    let originalCapacitor;

    beforeAll(() => {
      // Forzar a Storage.js a usar el fallback de localStorage
      originalCapacitor = global.window.Capacitor;
      global.window.Capacitor = undefined;
    });

    afterAll(() => {
      // Restaurar el mock global de Capacitor para otros tests
      global.window.Capacitor = originalCapacitor;
    });

    it('should set item to localStorage', async () => {
      await Storage.set('testKey', 'testValue');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', '"testValue"');
    });

    it('should get item from localStorage', async () => {
      localStorageMock.getItem.mockReturnValueOnce('"testValue"');
      const value = await Storage.get('testKey');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
      expect(value).toBe('testValue');
    });

    it('should remove item from localStorage', async () => {
      await Storage.remove('testKey');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should clear localStorage', async () => {
      await Storage.clear();
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('with Capacitor Preferences Backend', () => {
    // Por defecto, nuestro setup de jest.setup.cjs hace que Capacitor esté disponible,
    // por lo que estos tests usarán esa ruta automáticamente.

    it('should call Preferences.set', async () => {
      await Storage.set('capKey', { a: 1 });
      expect(global.Capacitor.Plugins.Preferences.set).toHaveBeenCalledWith({ key: 'capKey', value: '{"a":1}' });
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should call Preferences.get', async () => {
      jest.mocked(global.Capacitor.Plugins.Preferences.get).mockResolvedValue({ value: '{"a":1}' });
      const result = await Storage.get('capKey');
      expect(global.Capacitor.Plugins.Preferences.get).toHaveBeenCalledWith({ key: 'capKey' });
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
      expect(result).toEqual({ a: 1 });
    });
    
    it('should call Preferences.remove', async () => {
      await Storage.remove('capKey');
      expect(global.Capacitor.Plugins.Preferences.remove).toHaveBeenCalledWith({ key: 'capKey' });
    });

    it('should call Preferences.clear', async () => {
      await Storage.clear();
      expect(global.Capacitor.Plugins.Preferences.clear).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    let consoleErrorSpy;
    let originalCapacitor;

    beforeAll(() => {
        // Forzar a Storage.js a usar el fallback de localStorage para estos tests de error
        originalCapacitor = global.window.Capacitor;
        global.window.Capacitor = undefined;
    });

    afterAll(() => {
        // Restaurar el mock global de Capacitor para otros tests
        global.window.Capacitor = originalCapacitor;
    });

    beforeEach(() => {
      // Espiar console.error para verificar que se llama, sin ensuciar la salida del test
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restaurar el spy para no afectar otros tests
      consoleErrorSpy.mockRestore();
    });

    it('should handle errors during get', async () => {
      localStorageMock.getItem.mockImplementation(() => { throw new Error('Disk Read Error'); });
      const result = await Storage.get('anyKey', 'defaultValue');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Storage] Fallo al leer anyKey:', expect.any(Error));
      expect(result).toBe('defaultValue');
    });

    it('should handle errors during set', async () => {
      const circularObj = {};
      circularObj.a = circularObj; // Objeto circular que romperá JSON.stringify
      await Storage.set('circular', circularObj);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Storage] Fallo al guardar circular:', expect.any(TypeError));
    });

    it('should handle errors during remove', async () => {
      localStorageMock.removeItem.mockImplementation(() => { throw new Error('Disk Write Error'); });
      await Storage.remove('anyKey');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Storage] Fallo al eliminar anyKey:', expect.any(Error));
    });

    it('should handle errors during clear', async () => {
      localStorageMock.clear.mockImplementation(() => { throw new Error('Disk Full Error'); });
      await Storage.clear();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Storage] Fallo al limpiar almacenamiento:', expect.any(Error));
    });
  });
});
