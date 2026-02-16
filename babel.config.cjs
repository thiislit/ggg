// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }], // soporta Node.js actual
    '@babel/preset-react', // soporta JSX
    // '@babel/preset-typescript', // si usas TS
  ],
};
