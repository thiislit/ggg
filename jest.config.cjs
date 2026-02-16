// jest.config.js
module.exports = {
  testEnvironment: 'jsdom', // para compatibilidad con DOM
  setupFilesAfterEnv: ['./jest.setup.cjs'], // nuestro setup global
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest', // todos los archivos JS/TS pasan por Babel
  },
  extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  transformIgnorePatterns: ['/node_modules/'], // ignora node_modules
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy', // mocks para estilos
    '^phaser$': '<rootDir>/__mocks__/phaser.cjs', // Mock Phaser
  },
};
