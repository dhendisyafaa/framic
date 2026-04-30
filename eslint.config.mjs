import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettierConfig from "eslint-config-prettier"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
  // Framic custom rules — TypeScript strict
  {
    rules: {
      // ❌ DILARANG KERAS — sesuai framic-rules.md
      "@typescript-eslint/no-explicit-any": "error",
      // Catch unused variables (ignore underscore-prefixed)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Prefer const
      "prefer-const": "error",
    },
  },
  // Prettier harus di-extend terakhir supaya matikan rules yang konflik
  prettierConfig,
])

export default eslintConfig
