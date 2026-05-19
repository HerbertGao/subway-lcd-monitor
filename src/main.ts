import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { logger } from '@/core/logger'

const app = createApp(App)
app.use(createPinia())

// 全局兜底：记录未被组件级错误边界捕获的异常（异步、事件处理器等）。
app.config.errorHandler = (err, _instance, info) => {
  logger.error('[errorHandler] 未捕获的异常:', err, info)
}

app.mount('#app')
