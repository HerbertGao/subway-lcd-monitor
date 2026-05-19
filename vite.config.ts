import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  // GitHub Actions 环境（含 ci.yml 校验构建与 deploy.yml 部署构建）走 GitHub Pages
  // 项目站点子路径；本地 dev / preview / build 走根路径 '/'。
  base: process.env.GITHUB_ACTIONS ? '/subway-lcd-monitor/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
