import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "**/.next/**",
    "out/**",
    "build/**",
    "**/dist/**",
    "next-env.d.ts",
    "src/generated/**",
    "apps/**/src/generated/**",
  ]),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*/apps/*", "apps/*", "../../apps/*", "../../../apps/*", "../../../../apps/*"],
              message: "Avoid cross-app imports. Move shared code to packages/ instead."
            }
          ]
        }
      ]
    }
  }
]);

export default eslintConfig;
