module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true, // Enable Jest globals
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off', // Allow console in server code
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
