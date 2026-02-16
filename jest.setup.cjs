// jest.setup.cjs
/**
 * Este archivo de configuración de Jest se ejecuta antes de cada suite de pruebas.
 * Su propósito es configurar un entorno simulado (mock) para JSDOM que se parezca
 * lo suficiente a un navegador real y a un entorno de Phaser para que los tests unitarios
 * de la lógica del juego puedan ejecutarse sin necesidad de un canvas o de la librería completa de Phaser.
 */

// ===================================================================================
// MOCKS DE APIS DE NAVEGADOR
// ===================================================================================

// JSDOM no incluye estas APIs por defecto, pero son necesarias para ciertas librerías o código.
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock del <canvas> de HTML. Phaser intenta obtener un contexto de renderizado,
// así que proveemos un objeto falso con funciones vacías para evitar errores.
HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  };
};

// ===================================================================================
// MOCKS DE CLASES DE PHASER
// ===================================================================================

/**
 * Clase base para todos los GameObjects de Phaser. Provee métodos comunes
 * que se usan en la mayoría de objetos (como setDepth, setScale, etc.).
 * Los métodos retornan `this` para permitir encadenamiento (fluent API).
 */
class FakeGameObject {
  constructor(scene, x = 0, y = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.active = true;
    this.visible = true;
  }
  setDepth() { return this; }
  setScrollFactor() { return this; }
  setOrigin() { return this; }
  setScale() { return this; }
  setPosition(x, y) { this.x = x; this.y = y; return this; }
  destroy() {}
}

/** Mock de un Container de Phaser. Hereda de FakeGameObject y añade la habilidad de tener hijos. */
class Container extends FakeGameObject {
  constructor(scene, x, y, children = []) {
    super(scene, x, y);
    this.list = children;
  }
  add(child) {
    if (Array.isArray(child)) {
        this.list.push(...child);
    } else {
        this.list.push(child);
    }
    return this;
  }
}

/** Mock de un Sprite de Phaser. */
class Sprite extends FakeGameObject {
  play() { return this; }
  once() { return this; }
}

/** Mock de un objeto Text de Phaser, con los métodos necesarios para los tests de UI. */
class Text extends FakeGameObject {
  constructor(scene, x, y, text) {
    super(scene, x, y);
    this.text = text;
  }
  setFill() { return this; }
  setOrigin() { return this; }
  setDepth() { return this; }
  setText(t) { this.text = t; return this; }
}

/** Mock de un objeto Graphics de Phaser. */
class Graphics extends FakeGameObject {
  fillStyle() { return this; }
  fillRoundedRect() { return this; }
  lineStyle() { return this; }
  strokeRoundedRect() { return this; }
  clear() { return this; }
}

/** Mock de una Shape (como Rectangle o Circle) de Phaser, con soporte para eventos. */
class Shape extends FakeGameObject {
    constructor(scene, x, y) {
        super(scene, x, y);
        // Simular la API de eventos para poder hacer .on() y .emit() en los tests.
        const eventHandlers = {};
        this.on = jest.fn((event, callback) => {
            eventHandlers[event] = callback;
        });
        this.emit = (event, ...args) => {
            if (eventHandlers[event]) {
                eventHandlers[event](...args);
            }
        };
    }
    setInteractive() { return this; }
    setFillStyle() { return this; }
}

// ===================================================================================
// MOCK DE LA SCENE PRINCIPAL DE PHASER
// ===================================================================================

/**
 * Mock de una Scene de Phaser. Provee los 'sistemas' que nuestro código usa,
 * como `add` (para crear GameObjects), `tweens` (para animaciones), y `events`.
 */
class Scene {
  constructor() {
    this.add = {
      existing: jest.fn(),
      sprite: (...args) => new Sprite(this, ...args),
      container: (...args) => new Container(this, ...args),
      graphics: (...args) => new Graphics(this, ...args),
      text: (...args) => new Text(this, ...args),
      rectangle: (...args) => new Shape(this, ...args),
      circle: (...args) => new Shape(this, ...args),
    };
    this.tweens = {
        add: jest.fn(),
        killTweensOf: jest.fn()
    };
    this.events = { on: jest.fn(), once: jest.fn(), off: jest.fn(), emit: jest.fn() };
  }
}

// ===================================================================================
// MOCKS GLOBALES
// ===================================================================================

/** Mock del objeto global de Phaser. */
global.Phaser = {
  Scene,
  GameObjects: {
    Container,
    Sprite,
    Text,
    Graphics,
    Shape
  }
};

/**
 * Mock del API de localStorage. Se usa un objeto `store` para simular el almacenamiento.
 * Todos los métodos son `jest.fn()` para que podamos espiar sus llamadas en los tests.
 * Nota: Este mock no se usa directamente, sino a través del módulo `localStorageMock.js`
 * para evitar conflictos con el localStorage de JSDOM.
 */
global.localStorage = {
  store: {},
  getItem: jest.fn(function(key) {
    return this.store[key] || null;
  }),
  setItem: jest.fn(function(key, value) {
    this.store[key] = String(value);
  }),
  removeItem: jest.fn(function(key) {
    delete this.store[key];
  }),
  clear: jest.fn(function() {
    this.store = {};
  })
};

/** Mock del objeto global de Capacitor para simular la ejecución en un entorno nativo. */
global.Capacitor = {
  Plugins: {
    App: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
    Preferences: {
      get: jest.fn().mockResolvedValue({ value: null }),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(),
      clear: jest.fn().mockResolvedValue(),
    },
    SafeArea: {
      getSafeAreaInsets: jest.fn().mockResolvedValue({ insets: { top: 0, bottom: 0 } })
    }
  }
};

// ===================================================================================
// LIMPIEZA GLOBAL
// ===================================================================================

/**
 * Hook que se ejecuta después de CADA test en TODAS las suites.
 * Es crucial para garantizar el aislamiento de los tests y evitar "fugas" de estado.
 */
afterEach(() => {
  // Restaura todos los mocks creados con jest.spyOn.
  jest.restoreAllMocks();

  // Limpia nuestro mock de localStorage para que un test no afecte al siguiente.
  if (global.localStorage && typeof global.localStorage.clear === 'function') {
    global.localStorage.clear();
  }

  // Limpia todos los mocks de jest.fn() dentro de los plugins de Capacitor.
  if (global.Capacitor && global.Capacitor.Plugins) {
    for (const key in global.Capacitor.Plugins) {
      if (global.Capacitor.Plugins[key].reset && typeof global.Capacitor.Plugins[key].reset === 'function') {
        global.Capacitor.Plugins[key].reset();
      } else {
        for (const prop in global.Capacitor.Plugins[key]) {
          if (jest.isMockFunction(global.Capacitor.Plugins[key][prop])) {
            global.Capacitor.Plugins[key][prop].mockClear();
          }
        }
      }
    }
  }
});
