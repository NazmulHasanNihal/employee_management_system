import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // Type-safety: surface (not block) any-typed code so it can be tightened over time.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/jsx-no-undef": "error",
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
      // Server code must use the structured logger, not raw console.
      "no-console": ["warn", { allow: ["warn", "error"] }]
    }
  },
];

export default eslintConfig;
