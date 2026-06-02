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
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 外部参考稿（Figma 导出的独立 Vite 项目，非本应用构建路径，其依赖也未安装）。
    // 设计已重写进 src/app/(console) 与 src/components/console，此目录仅备查。
    "UI Style Redesign/**",
    // 第二版 UI 稿（前台改版来源）。设计已整合进 src/app/(site) 与 src/components，此目录仅备查。
    "UI Style Redesign (1)/**",
    // 第三版 UI 稿（后台商品内联编辑来源）。设计已整合进 src/app/(console) 与 src/components/console，此目录仅备查。
    "UI Style Redesign(2)/**",
  ]),
]);

export default eslintConfig;
