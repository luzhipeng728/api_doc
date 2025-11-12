<template>
  <div class="config-panel">
    <div class="form-group">
      <label for="base-url">Base URL</label>
      <input
        id="base-url"
        v-model="localBaseUrl"
        type="text"
        placeholder="https://api.openai.com"
        @blur="updateConfig"
      />
    </div>
    <div class="form-group">
      <label for="api-key">API Key</label>
      <input
        id="api-key"
        v-model="localApiKey"
        type="password"
        placeholder="sk-..."
        @blur="updateConfig"
      />
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
.config-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
