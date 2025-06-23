import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginNext from "@next/eslint-plugin-next";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      js,
      "unused-imports": pluginUnusedImports,
    },
    extends: ["js/recommended"],
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
  ...tseslint.configs.recommended,
  pluginNext.flatConfig.recommended,
]);
