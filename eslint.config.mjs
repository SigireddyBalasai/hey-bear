import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { flatConfig as next } from "@next/eslint-plugin-next";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";

export default defineConfig([
  next.recommended,
  {
    name: "unused-cleanup",
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: { js },
    extends: ["js/recommended"],
  },
  ...tseslint.configs.recommended,
]);
