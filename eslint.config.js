// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest, // Jest global variables
        Phaser: "readonly", // Declare Phaser as a global readonly variable
        Sentry: "readonly", // Declare Sentry as a global readonly variable
        WebFont: "readonly", // Declare WebFont as a global readonly variable
      },
      parserOptions: {
        ecmaVersion: 12, // Or 2021
        sourceType: "module",
      },
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      ...pluginJs.configs.recommended.rules, // ESLint's recommended rules
      ...configPrettier.rules, // Prettier's recommended rules
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto", // Handle Windows/Linux line endings
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 100,
          tabWidth: 4,
        },
      ],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Warn about unused vars, ignore if prefixed with _
      "no-console": ["warn", { "allow": ["warn", "error"] }], // Allow console.warn and console.error
      "no-useless-assignment": "off", // Temporarily disable due to false positives
    },
  },
];
