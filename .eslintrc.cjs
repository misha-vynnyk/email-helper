module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true, jest: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["@typescript-eslint", "react-refresh", "simple-import-sort"],
  ignorePatterns: [
    "dist",
    "dist-electron",
    "release",
    "coverage",
    "node_modules",
    "server/node_modules",
    "automation/node_modules",
    "server/dist",
    ".eslintrc.cjs",
  ],
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { allow: ["warn", "error", "debug", "info"] }],
    "no-empty": ["error", { allowEmptyCatch: true }],
  },
  overrides: [
    {
      // Electron main process logs to stdout/Console.app, not the browser console.
      files: ["electron/**/*.ts"],
      rules: { "no-console": "off" },
    },
  ],
};
