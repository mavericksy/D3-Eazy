import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "dist/**", "js/main.js", ".enola/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off",
      "no-unassigned-vars": "off",
    },
  },
  {
    files: ["scripts/**", "tests/**", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
