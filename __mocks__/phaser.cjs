// __mocks__/phaser.js
module.exports = {
    Scene: class {
      constructor() {
        this.sys = { events: { on: jest.fn(), off: jest.fn() } };
        this.add = { sprite: jest.fn(), text: jest.fn() };
        this.physics = { add: { sprite: jest.fn() } };
      }
      update() {}
      preload() {}
      create() {}
    },
    Game: class {
      constructor(config) {
        this.config = config;
        this.scene = { add: jest.fn(), start: jest.fn() };
      }
    },
    AUTO: 'AUTO',
    GameObjects: {
        Container: class {
            constructor() {
                this.add = jest.fn();
                this.destroy = jest.fn();
                this.setScale = jest.fn();
                this.setAlpha = jest.fn();
            }
        },
        Sprite: class {},
        Text: class {},
    },
    Math: {
        Vector2: class { constructor(x = 0, y = 0) { this.x = x; this.y = y; } }
    },
};