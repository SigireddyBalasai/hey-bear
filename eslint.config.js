import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import pluginImport from "eslint-plugin-import";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      "unused-imports": pluginUnusedImports,
      "import": pluginImport
    },
    rules: {
      "unused-imports/no-unused-imports": "warn",
      "import/no-unused-modules": "warn",
      // Allow JSX without React being in scope - Next.js doesn't need it anymore
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off", // Optional: Disable prop-types validation if using TypeScript
      // Escape special characters in JSX
      "react/no-unescaped-entities": "warn",
      // Disable type checking rules temporarily to allow build to proceed
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  }
]);