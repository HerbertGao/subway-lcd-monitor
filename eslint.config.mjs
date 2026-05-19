import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import configPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    // 全局忽略：构建产物、依赖、规格文档、生成文件
    ignores: ['dist/**', 'node_modules/**', 'openspec/**', '*.tsbuildinfo'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    // .vue 文件的 <script> 块由 typescript-eslint 解析
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['**/*.{ts,mts,cts,tsx,vue}'],
    rules: {
      // 代码均为 TypeScript（含 .vue 的 <script lang="ts">），
      // 浏览器/Node 全局标识符由 TS 类型系统校验，core 的 no-undef 会误报，关闭。
      'no-undef': 'off',
    },
  },
  {
    // 存量代码豁免：vue/attributes-order 仅为属性书写顺序偏好，
    // 本阶段不重构业务代码，关闭该规则以使 lint 零违规。
    files: ['**/*.vue'],
    rules: {
      'vue/attributes-order': 'off',
    },
  },
  // 关闭与 Prettier 冲突的格式相关规则，置于最后以覆盖前序配置
  configPrettier
)
