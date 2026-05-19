<template>
  <div v-if="error" class="error-boundary">
    <div class="error-boundary__panel">
      <p class="error-boundary__title">界面出现异常</p>
      <p class="error-boundary__message">当前内容渲染失败，可尝试重新加载。</p>
      <button type="button" class="error-boundary__retry" @click="retry">重试</button>
    </div>
  </div>
  <slot v-else :key="retryKey" />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { logger } from '@/core/logger'

const error = ref<unknown>(null)
const retryKey = ref(0)

onErrorCaptured((err) => {
  error.value = err
  // 返回 false 会阻止异常继续向上传播，全局 errorHandler 因此收不到，
  // 必须在此显式记录被捕获的异常。
  logger.error('[ErrorBoundary] 捕获到子树异常:', err)
  return false
})

function retry() {
  error.value = null
  // 递增 key 强制 slot 子树重新挂载，使其从初始状态重新渲染。
  retryKey.value++
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.error-boundary__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 32px;
  background: #16213e;
  border: 1px solid #2e3a5c;
  border-radius: 8px;
  color: #eee;
  text-align: center;
}

.error-boundary__title {
  font-size: 16px;
  font-weight: 600;
  color: #ff6b6b;
}

.error-boundary__message {
  font-size: 13px;
  color: #aaa;
}

.error-boundary__retry {
  margin-top: 4px;
  padding: 8px 20px;
  font-size: 13px;
  color: #eee;
  background: #0f3460;
  border: 1px solid #2e3a5c;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.error-boundary__retry:hover {
  background: #16498a;
}
</style>
