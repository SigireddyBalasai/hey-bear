import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginNext from "@next/eslint-plugin-next";
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
    plugins: { js },
    extends: ["js/recommended"],
  },
  ...tseslint.configs.recommended,
  pluginNext.flatConfig.recommended,
]);
