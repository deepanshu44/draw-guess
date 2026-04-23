import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/dist"]), {
    extends: compat.extends(
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:prettier/recommended",
    ),

    plugins: {
        react,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        ecmaVersion: "latest",
        sourceType: "module",
    },

    settings: {
        react: {
            version: "detect"
        }
    },

    rules: {
        semi: "off",
        quotes: "off",
        "react/prop-types": [0],
        "react/react-in-jsx-scope": "off",
        "react/jsx-uses-react": "off"
    },
}, {
    files: ["src/**/*.jsx"],
}]);