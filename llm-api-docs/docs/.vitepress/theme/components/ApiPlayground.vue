<template>
  <div class="api-playground">
    <h3>API 测试 Playground</h3>

    <!-- 配置面板 -->
    <ConfigPanel
      v-model:base-url="config.baseUrl"
      v-model:api-key="config.apiKey"
      :provider="provider"
      @save="handleSaveConfig"
    />

    <!-- 测试参数配置 -->
    <div class="test-params">
      <div class="param-row">
        <label class="param-label">选择模型:</label>
        <select v-model="selectedModel" class="param-select">
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-sonnet-4.5">Claude Sonnet 4.5</option>
          <option value="claude-opus-4.1">Claude Opus 4.1</option>
        </select>

        <label class="toggle-label ml-auto">
          <input
            type="checkbox"
            v-model="streamMode"
            class="toggle-checkbox"
          />
          <span class="toggle-switch"></span>
          <span class="toggle-text">{{ streamMode ? '流式模式' : '普通模式' }}</span>
        </label>
      </div>

      <div class="param-row">
        <label class="param-label">测试消息:</label>
        <input
          v-model="testPrompt"
          class="param-input"
          placeholder="输入测试消息,例如: Hello!"
        />
      </div>

      <div class="param-row">
        <div class="tab-switcher">
          <button
            class="tab-button"
            :class="{ active: codeType === 'python' }"
            @click="codeType = 'python'"
          >
            Python
          </button>
          <button
            class="tab-button"
            :class="{ active: codeType === 'curl' }"
            @click="codeType = 'curl'"
          >
            cURL
          </button>
        </div>
      </div>
    </div>

    <!-- 代码编辑器 (只读) -->
    <CodeEditor
      v-model="currentCode"
      :language="editorLanguage"
      :read-only="true"
    />

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="btn btn-primary" @click="executeCode" :disabled="loading">
        <span v-if="!loading">▶️ 执行测试</span>
        <span v-else>执行中...</span>
      </button>
    </div>

    <!-- 响应展示 -->
    <div v-if="response" class="response-display">
      <h4>响应结果:</h4>
      <pre>{{ JSON.stringify(response, null, 2) }}</pre>
    </div>

    <!-- 流式响应展示 -->
    <div v-if="streamChunks.length > 0" class="streaming-display">
      <h4>流式响应:</h4>
      <div class="stream-content">
        <span v-for="chunk in streamChunks" :key="chunk.index">{{ chunk.content }}</span>
      </div>
    </div>

    <!-- 错误展示 -->
    <div v-if="error" class="error-display">
      <h4>错误:</h4>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ConfigPanel from './ConfigPanel.vue'
import CodeEditor from './CodeEditor.vue'

interface StreamChunk {
  content: string
  timestamp: number
  index: number
}

const props = defineProps<{
  provider: 'openai' | 'claude' | 'gemini'
  defaultRequest?: any
  pythonTemplate?: string
  curlTemplate?: string
}>()

const config = ref({
  baseUrl: '',
  apiKey: '',
  provider: props.provider
})

const codeType = ref<'python' | 'curl'>('python')
const streamMode = ref(false)
const selectedModel = ref('gpt-4')
const testPrompt = ref('Hello! 请介绍一下你自己。')
const currentCode = ref('')
const response = ref<any>(null)
const streamChunks = ref<StreamChunk[]>([])
const error = ref('')
const loading = ref(false)

const editorLanguage = computed(() => {
  return codeType.value === 'python' ? 'python' : 'shell'
})

// 监听 codeType 变化,自动切换代码
watch(codeType, () => {
  generateCode()
})

// 监听 streamMode 变化,自动更新代码
watch(streamMode, () => {
  generateCode()
})

// 监听模型选择变化,自动更新代码
watch(selectedModel, () => {
  generateCode()
})

// 监听测试消息变化,自动更新代码
watch(testPrompt, () => {
  generateCode()
})

// 监听配置变化,自动更新代码
watch(() => [config.value.baseUrl, config.value.apiKey], () => {
  generateCode()
}, { deep: true })

onMounted(() => {
  generateCode()
})

// 生成代码模板
function generateCode() {
  if (codeType.value === 'python') {
    currentCode.value = props.pythonTemplate || generatePythonCode()
  } else {
    currentCode.value = props.curlTemplate || generateCurlCode()
  }
}

function generatePythonCode() {
  const baseUrl = config.value.baseUrl || 'YOUR_BASE_URL'
  const apiKey = config.value.apiKey || 'YOUR_API_KEY'
  const model = selectedModel.value
  const prompt = testPrompt.value
  const stream = streamMode.value

  // 根据模型类型选择 SDK
  const isClaudeModel = model.startsWith('claude-')
  const isGeminiModel = model.startsWith('gemini-')

  if (isClaudeModel) {
    // Claude SDK 代码
    if (stream) {
      return `from anthropic import Anthropic

# 配置客户端
client = Anthropic(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

# 流式请求
with client.messages.stream(
    model="${model}",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "${prompt}"}
    ]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
print()  # 换行`
    } else {
      return `from anthropic import Anthropic

# 配置客户端
client = Anthropic(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

# 发起请求
message = client.messages.create(
    model="${model}",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "${prompt}"}
    ]
)

# 打印结果
print(message.content[0].text)`
    }
  } else if (isGeminiModel) {
    // Gemini SDK 代码
    if (stream) {
      return `from google import genai
from google.genai import types

# 配置客户端
client = genai.Client(
    api_key="${apiKey}",
    http_options={'api_endpoint': "${baseUrl}"}
)

# 流式请求
for chunk in client.models.generate_content_stream(
    model="${model}",
    contents="${prompt}",
    config=types.GenerateContentConfig(
        temperature=0.7,
        max_output_tokens=1024
    )
):
    print(chunk.text, end="", flush=True)
print()  # 换行`
    } else {
      return `from google import genai
from google.genai import types

# 配置客户端
client = genai.Client(
    api_key="${apiKey}",
    http_options={'api_endpoint': "${baseUrl}"}
)

# 发起请求
response = client.models.generate_content(
    model="${model}",
    contents="${prompt}",
    config=types.GenerateContentConfig(
        temperature=0.7,
        max_output_tokens=1024
    )
)

# 打印结果
print(response.text)`
    }
  } else {
    // OpenAI SDK 代码 (GPT 模型)
    if (stream) {
      return `from openai import OpenAI

# 配置客户端
client = OpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

# 流式请求
stream = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "user", "content": "${prompt}"}
    ],
    stream=True
)

# 流式输出
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()  # 换行`
    } else {
      return `from openai import OpenAI

# 配置客户端
client = OpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

# 发起请求
response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "user", "content": "${prompt}"}
    ]
)

# 打印结果
print(response.choices[0].message.content)`
    }
  }
}

function generateCurlCode() {
  const baseUrl = config.value.baseUrl || 'YOUR_BASE_URL'
  const apiKey = config.value.apiKey || 'YOUR_API_KEY'
  const model = selectedModel.value
  const prompt = testPrompt.value
  const stream = streamMode.value

  // 根据模型类型选择 API 端点
  const isClaudeModel = model.startsWith('claude-')
  const isGeminiModel = model.startsWith('gemini-')

  if (isClaudeModel) {
    // Claude API
    const streamParam = stream ? ',\n    "stream": true' : ''
    return `curl ${baseUrl}/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "${model}",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "${prompt}"}
    ]${streamParam}
  }'`
  } else if (isGeminiModel) {
    // Gemini API
    const endpoint = stream ? 'streamGenerateContent' : 'generateContent'
    return `curl "${baseUrl}/v1beta/models/${model}:${endpoint}?key=${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "parts": [{"text": "${prompt}"}]
    }],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 1024
    }
  }'`
  } else {
    // OpenAI API (GPT 模型)
    const streamParam = stream ? ',\n    "stream": true' : ''
    return `curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "${prompt}"}
    ]${streamParam}
  }'`
  }
}

async function executeCode() {
  if (!config.value.baseUrl || !config.value.apiKey) {
    error.value = '请先配置 Base URL 和 API Key!'
    return
  }

  loading.value = true
  response.value = null
  streamChunks.value = []
  error.value = ''

  try {
    // 直接用 HTTP 请求,不解析代码
    await executeRequest()
  } catch (e: any) {
    error.value = e.message || '未知错误'
  } finally {
    loading.value = false
  }
}

// 直接执行 HTTP 请求 (不解析代码)
async function executeRequest() {
  const baseUrl = config.value.baseUrl
  const apiKey = config.value.apiKey
  const model = selectedModel.value
  const prompt = testPrompt.value
  const streaming = streamMode.value

  // 根据模型类型构建请求
  const isClaudeModel = model.startsWith('claude-')
  const isGeminiModel = model.startsWith('gemini-')

  if (isClaudeModel) {
    await executeClaudeRequest(baseUrl, apiKey, model, prompt, streaming)
  } else if (isGeminiModel) {
    await executeGeminiRequest(baseUrl, apiKey, model, prompt, streaming)
  } else {
    await executeOpenAIRequest(baseUrl, apiKey, model, prompt, streaming)
  }
}

// OpenAI 格式请求
async function executeOpenAIRequest(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  streaming: boolean
) {
  const url = `${baseUrl}/v1/chat/completions`
  const payload: any = {
    model,
    messages: [{ role: 'user', content: prompt }]
  }

  if (streaming) {
    payload.stream = true
  }

  const fetchResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text()
    throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`)
  }

  if (streaming) {
    await handleStreamResponse(fetchResponse, 'openai')
  } else {
    response.value = await fetchResponse.json()
  }
}

// Claude 格式请求
async function executeClaudeRequest(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  streaming: boolean
) {
  const url = `${baseUrl}/v1/messages`
  const payload: any = {
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  }

  if (streaming) {
    payload.stream = true
  }

  const fetchResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  })

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text()
    throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`)
  }

  if (streaming) {
    await handleStreamResponse(fetchResponse, 'claude')
  } else {
    response.value = await fetchResponse.json()
  }
}

// Gemini 格式请求
async function executeGeminiRequest(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  streaming: boolean
) {
  const endpoint = streaming ? 'streamGenerateContent' : 'generateContent'
  const url = `${baseUrl}/v1beta/models/${model}:${endpoint}?key=${apiKey}`

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  }

  const fetchResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text()
    throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`)
  }

  if (streaming) {
    await handleStreamResponse(fetchResponse, 'gemini')
  } else {
    response.value = await fetchResponse.json()
  }
}

// 处理流式响应
async function handleStreamResponse(fetchResponse: Response, provider: 'openai' | 'claude' | 'gemini') {
  const reader = fetchResponse.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return

        try {
          const json = JSON.parse(data)
          let content = ''

          if (provider === 'openai') {
            content = json.choices?.[0]?.delta?.content || ''
          } else if (provider === 'claude') {
            if (json.type === 'content_block_delta') {
              content = json.delta?.text || ''
            }
          } else if (provider === 'gemini') {
            content = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
          }

          if (content) {
            streamChunks.value.push({
              content,
              timestamp: Date.now(),
              index: streamChunks.value.length
            })
          }
        } catch (e) {
          console.error('Parse error:', e)
        }
      }
    }
  }
}

function handleSaveConfig() {
  generateCode()
}
</script>

<style scoped>
.api-playground {
  margin: 2rem 0;
}

.api-playground h3 {
  margin-bottom: 1.5rem;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  gap: 1rem;
}

.tab-switcher {
  display: flex;
  gap: 0.5rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background: var(--vp-c-bg-soft);
}

.tab-button.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-brand);
  background: var(--vp-c-brand);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  opacity: 0.8;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}

.response-display,
.streaming-display {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}

.response-display h4,
.streaming-display h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.response-display pre {
  margin: 0;
  overflow-x: auto;
}

.stream-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--vp-font-family-mono);
}

.error-display {
  margin: 1rem 0;
  padding: 1rem;
  background: #fee;
  border: 1px solid #f66;
  border-radius: 6px;
  color: #c00;
}

.error-display h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.error-display pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.loading::after {
  content: '...';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

/* 流式模式开关 */
.stream-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.toggle-checkbox {
  display: none;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  background: var(--vp-c-divider);
  border-radius: 12px;
  transition: background 0.3s;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-checkbox:checked + .toggle-switch {
  background: var(--vp-c-brand);
}

.toggle-checkbox:checked + .toggle-switch::after {
  transform: translateX(24px);
}

.toggle-text {
  font-size: 14px;
  color: var(--vp-c-text-1);
  font-weight: 500;
}

/* 测试参数配置 */
.test-params {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.param-row:last-child {
  margin-bottom: 0;
}

.param-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  min-width: 90px;
}

.param-select {
  flex: 1;
  max-width: 300px;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.param-select:hover {
  border-color: var(--vp-c-brand);
}

.param-select:focus {
  outline: none;
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px rgba(var(--vp-c-brand-rgb), 0.1);
}

.param-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  transition: all 0.2s;
}

.param-input:hover {
  border-color: var(--vp-c-brand);
}

.param-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px rgba(var(--vp-c-brand-rgb), 0.1);
}

.ml-auto {
  margin-left: auto;
}

.python-note {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  color: #856404;
  font-size: 14px;
  line-height: 1.5;
}
</style>
