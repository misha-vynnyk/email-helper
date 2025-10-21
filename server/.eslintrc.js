module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module', // ✅ Changed from 'script' to 'module' for ES imports
  },
  env: {
    node: true,
    es2020: true,
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
  },
};
