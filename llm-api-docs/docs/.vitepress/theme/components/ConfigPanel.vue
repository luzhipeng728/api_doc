<template>
  <div class="config-panel">
    <div class="form-group">
      <label for="base-url">Base URL</label>
      <input
        id="base-url"
        v-model="localBaseUrl"
        type="text"
        placeholder="例如: https://api.openai.com/v1 或您的代理地址"
        @blur="updateConfig"
      />
      <small class="form-hint">填写 API 基础地址,支持第三方代理服务</small>
    </div>
    <div class="form-group">
      <label for="api-key">API Key</label>
      <input
        id="api-key"
        v-model="localApiKey"
        type="password"
        placeholder="填写您的 API 密钥,如: sk-proj-xxx 或 sk-ant-xxx"
        @blur="updateConfig"
      />
      <small class="form-hint">密钥仅保存在浏览器本地,不会上传到服务器</small>
    </div>
  </div>
  <div class="config-actions">
    <button class="btn btn-secondary" @click="loadConfig">加载已保存配置</button>
    <button class="btn" @click="saveConfig">保存配置</button>
    <button class="btn btn-secondary" @click="clearConfig">清除配置</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storage } from '../utils/storage'

const props = defineProps<{
  baseUrl: string
  apiKey: string
  provider: 'openai' | 'claude' | 'gemini'
}>()

const emit = defineEmits<{
  (e: 'update:baseUrl', value: string): void
  (e: 'update:apiKey', value: string): void
  (e: 'save'): void
}>()

const localBaseUrl = ref(props.baseUrl)
const localApiKey = ref(props.apiKey)

onMounted(() => {
  loadConfig()
})

function updateConfig() {
  emit('update:baseUrl', localBaseUrl.value)
  emit('update:apiKey', localApiKey.value)
}

function saveConfig() {
  storage.save('api-config', {
    baseUrl: localBaseUrl.value,
    apiKey: localApiKey.value,
    provider: props.provider
  })
  emit('save')
  alert('配置已保存!')
}

function loadConfig() {
  const config = storage.load('api-config')
  if (config) {
    localBaseUrl.value = config.baseUrl
    localApiKey.value = config.apiKey
    updateConfig()
  }
}

function clearConfig() {
  if (confirm('确定要清除已保存的配置吗?')) {
    storage.remove('api-config')
    localBaseUrl.value = ''
    localApiKey.value = ''
    updateConfig()
    alert('配置已清除!')
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}

.config-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
