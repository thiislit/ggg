# Estrategia de Pruebas del Proyecto

Este documento describe la arquitectura y las convenciones para las pruebas unitarias y de integración en este proyecto. Seguir estas guías es crucial para mantener la estabilidad y la mantenibilidad de la suite de pruebas.

## Comandos de Ejecución

-   **Ejecutar todas las pruebas:**
    ```bash
    npm test
    ```
-   **Ejecutar pruebas y ver el informe de cobertura:**
    ```bash
    npm test -- --coverage
    ```

## Arquitectura de los Mocks

La configuración de las pruebas se basa en un entorno `JSDOM` con `babel-jest` y un archivo de configuración global `jest.setup.cjs` que prepara el entorno antes de que se ejecuten las pruebas.

### 1. `jest.setup.cjs`

Este archivo es el corazón de nuestro entorno de pruebas. Contiene mocks para:

-   **APIs de Navegador:** Simula APIs como `TextEncoder` y `HTMLCanvasElement` que no existen en JSDOM pero que Phaser o nuestras librerías esperan encontrar.
-   **Mocks de Clases de Phaser:** Para evitar cargar la librería completa de Phaser (que es pesada y requiere un canvas real), hemos creado clases mock que simulan el comportamiento de los `GameObjects` de Phaser.
    -   **Clases Mock:** `FakeGameObject`, `Container`, `Sprite`, `Text`, `Graphics`, `Shape`.
    -   **API Fluida:** La mayoría de los métodos de estas clases (como `.setDepth()`, `.setFill()`, etc.) usan `return this;` para permitir el encadenamiento de métodos, igual que en Phaser.
-   **Mock de `Scene` de Phaser:** La clase `Scene` está mockeada para proveer los "sistemas" que el código del juego usa, como `scene.add` (para crear objetos), `scene.tweens` y `scene.events`.

### 2. Mock de `localStorage` (`localStorageMock.js`)

**Problema:** El objeto `global.localStorage` provisto por JSDOM es un `Proxy` que entra en conflicto con los `jest.fn()` que necesitamos para espiar las llamadas en nuestros tests.

**Solución:** Se ha adoptado una estrategia de **Inyección de Dependencias**:
1.  Se creó un mock explícito en `www/src/managers/__mocks__/localStorageMock.js`. Este objeto simple SÍ tiene métodos `jest.fn()` que podemos espiar.
2.  El manager `Storage.js` ha sido modificado para importar y usar este `localStorageMock` cuando `process.env.NODE_ENV === 'test'`.
3.  Los tests en `Storage.test.js` también importan y usan `localStorageMock` para sus aserciones.

Esta estrategia evita completamente los conflictos con JSDOM y hace que las pruebas sean robustas.

### 3. Mock de `Capacitor`

El objeto `global.Capacitor` está mockeado en `jest.setup.cjs` para simular un entorno nativo y permitir que el código que depende de los plugins de Capacitor (como `Preferences`) se ejecute sin errores.

## Guía para Escribir Nuevas Pruebas

### Testear Componentes de UI (Phaser)

Muchos componentes de UI reaccionan a eventos de input. La mejor manera de probarlos es **simulando el evento**, no llamando al método handler directamente.

**Ejemplo (`Switch.test.js`):**

```javascript
// INCORRECTO: Llama al método directamente, saltándose el evento y sus efectos secundarios.
// instance.toggle(); 

// CORRECTO: Simula el evento de 'pointerup' en el área interactiva del componente.
// Esto ejecuta toda la lógica del handler, incluyendo la llamada a toggle() y a AudioManager.
instance.inputArea.emit('pointerup');

expect(AudioManager.playSFX).toHaveBeenCalledWith(mockScene, ASSET_KEYS.AUDIO.SFX_BUTTON);
```

### Testear Managers

-   **Si un manager usa `Storage`:** Simplemente importa `localStorageMock` en tu archivo de test y úsalo para preparar el estado o para hacer aserciones.

    ```javascript
    import { localStorageMock } from './__mocks__/localStorageMock.js';

    it('should get an item', async () => {
      // Preparar el estado del mock
      localStorageMock.getItem.mockReturnValueOnce('"testValue"');
      
      const value = await Storage.get('testKey');
      
      // Afirmar
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
      expect(value).toBe('testValue');
    });
    ```

-   **Si un manager usa `Capacitor`:** Puedes modificar el comportamiento de los mocks de `Capacitor.Plugins` directamente en tu test, ya que están definidos globalmente.
