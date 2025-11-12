<template>
  <div class="unified-playground">
    <h2>🎮 统一 API 测试平台</h2>

    <!-- 三栏布局 -->
    <div class="three-column-layout">
      <!-- 左侧: 配置区 -->
      <div class="left-panel">
        <div class="panel-header">⚙️ 配置</div>

        <div class="config-section">
          <label class="config-label">选择模型:</label>
          <select v-model="selectedModel" class="config-select">
            <optgroup label="OpenAI - GPT 系列">
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-5">GPT-5</option>
            </optgroup>
            <optgroup label="OpenAI - 图像生成">
              <option value="gpt-image-1">GPT-Image-1</option>
            </optgroup>
            <optgroup label="Claude">
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (20250929)</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (20251001)</option>
            </optgroup>
            <optgroup label="Gemini">
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
            </optgroup>
          </select>
        </div>

        <div v-if="supportsTools" class="config-section">
          <label class="config-checkbox">
            <input type="checkbox" v-model="enableTools" />
            <span>启用工具调用</span>
          </label>
        </div>

        <div v-if="supportsStreaming" class="config-section">
          <label class="config-checkbox">
            <input type="checkbox" v-model="streamMode" />
            <span>流式模式</span>
          </label>
        </div>

        <div v-if="isImageModel" class="config-section">
          <label class="config-label">图片上传:</label>
          <input type="file" @change="handleImageUpload" accept="image/*" class="config-file" />
        </div>

        <div class="config-section">
          <label class="config-label">{{ promptLabel }}:</label>
          <textarea
            v-model="testPrompt"
            class="config-textarea"
            :placeholder="promptPlaceholder"
            rows="6"
          ></textarea>
        </div>

        <div class="config-section">
          <button class="btn btn-primary btn-block" @click="executeTest" :disabled="loading || !canExecute">
            <span v-if="!loading">▶️ 执行测试</span>
            <span v-else>⏳ 执行中...</span>
          </button>
        </div>
      </div>

      <!-- 中间: 代码区 -->
      <div class="middle-panel">
        <div class="panel-header">
          <span>💻 代码示例</span>
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
        <div class="code-container">
          <CodeEditor
            v-model="currentCode"
            :language="editorLanguage"
            :read-only="true"
          />
        </div>
      </div>

      <!-- 右侧: 结果区 -->
      <div class="right-panel">
        <div class="panel-header">📊 响应结果</div>

        <div class="result-container">
          <!-- 无响应时的占位 -->
          <div v-if="!response && streamChunks.length === 0 && !error" class="empty-state">
            <div class="empty-icon">🚀</div>
            <p>点击"执行测试"查看响应结果</p>
          </div>

          <!-- 响应展示 -->
          <div v-if="response" class="response-display">
            <h4>{{ responseTitle }}</h4>

            <!-- 如果是图片响应,显示图片预览 -->
            <div v-if="responseImages.length > 0" class="image-preview-container">
              <div v-for="(img, index) in responseImages" :key="index" class="image-preview-item">
                <img :src="img.dataUrl" :alt="`生成的图像 ${index + 1}`" class="generated-image" />
                <div class="image-info">
                  <span>{{ img.mimeType }}</span>
                  <span>{{ formatBytes(img.size) }}</span>
                  <button class="copy-btn" @click="copyImageToClipboard(img.dataUrl)">📋 复制图片</button>
                </div>
              </div>
            </div>

            <!-- JSON 数据 - 带折叠的 base64 -->
            <div class="json-response">
              <div class="json-header">
                <span>完整响应数据</span>
                <button class="toggle-btn" @click="showFullBase64 = !showFullBase64">
                  {{ showFullBase64 ? '折叠 Base64' : '展开 Base64' }}
                </button>
              </div>
              <pre>{{ getDisplayResponse() }}</pre>
            </div>
          </div>

          <!-- 流式响应 -->
          <div v-if="streamChunks.length > 0" class="streaming-display">
            <h4>流式响应 ({{ streamChunks.length }} chunks)</h4>
            <div class="stream-chunks">
              <div v-for="chunk in streamChunks" :key="chunk.index" class="chunk-item">
                <div class="chunk-header">
                  <span class="chunk-index">Chunk #{{ chunk.index + 1 }}</span>
                  <span class="chunk-time">{{ formatTime(chunk.timestamp) }}</span>
                </div>
                <pre class="chunk-data">{{ chunk.rawData }}</pre>
              </div>
            </div>
          </div>

          <!-- 错误展示 -->
          <div v-if="error" class="error-display">
            <h4>❌ 错误</h4>
            <pre>{{ error }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import CodeEditor from './CodeEditor.vue'

interface StreamChunk {
  content: string
  timestamp: number
  index: number
  rawData: string  // 原始 chunk 数据
}

const config = ref({
  baseUrl: '',
  apiKey: '',
})

const selectedModel = ref('gpt-4')
const testPrompt = ref('Hello! 请介绍一下你自己。')
const enableTools = ref(false)
const streamMode = ref(false)
const uploadedImage = ref<string | null>(null)
const codeType = ref<'python' | 'curl'>('python')
const currentCode = ref('')
const response = ref<any>(null)
const streamChunks = ref<StreamChunk[]>([])
const error = ref('')
const loading = ref(false)
const showFullBase64 = ref(false)

// 计算属性
const currentProvider = computed(() => {
  if (selectedModel.value.startsWith('gpt-')) return 'openai'
  if (selectedModel.value.startsWith('claude-')) return 'claude'
  if (selectedModel.value.startsWith('gemini-')) return 'gemini'
  return 'openai'
})

const isImageModel = computed(() => {
  return ['gpt-image-1', 'gemini-2.5-flash-image'].includes(selectedModel.value)
})

const supportsTools = computed(() => {
  return ['gpt-4', 'gpt-4o', 'claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001'].includes(selectedModel.value)
})

const supportsStreaming = computed(() => {
  return !isImageModel.value
})

const promptLabel = computed(() => {
  if (isImageModel.value) {
    if (selectedModel.value === 'gpt-image-1' && uploadedImage.value) {
      return '图像编辑指令'
    }
    return '图像描述/编辑指令'
  }
  return '测试消息'
})

const promptPlaceholder = computed(() => {
  if (isImageModel.value) {
    if (selectedModel.value === 'gpt-image-1' && uploadedImage.value) {
      return '例如: Change the coffee cup to red (已上传参考图,将进行图像编辑)'
    }
    return '例如: A cute baby sea otter wearing a wizard hat (文本生成图像)'
  }
  return '输入测试消息,例如: Hello!'
})

const editorLanguage = computed(() => {
  return codeType.value === 'python' ? 'python' : 'shell'
})

const canExecute = computed(() => {
  return config.value.baseUrl && config.value.apiKey && testPrompt.value.trim()
})

const responseTitle = computed(() => {
  if (isImageModel.value) return '生成的图像:'
  return '响应结果:'
})

const formattedResponse = computed(() => {
  if (!response.value) return ''
  return JSON.stringify(response.value, null, 2)
})

// 提取响应中的图片数据
const responseImages = computed(() => {
  if (!response.value) return []
  const images: Array<{ dataUrl: string; mimeType: string; size: number }> = []

  try {
    // Gemini 图像响应格式
    if (response.value.candidates) {
      for (const candidate of response.value.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const mimeType = part.inlineData.mimeType || 'image/png'
              const base64Data = part.inlineData.data
              const dataUrl = `data:${mimeType};base64,${base64Data}`
              images.push({
                dataUrl,
                mimeType,
                size: base64Data.length
              })
            }
          }
        }
      }
    }

    // OpenAI 图像响应格式 (url 或 b64_json)
    if (response.value.data && Array.isArray(response.value.data)) {
      for (const item of response.value.data) {
        // b64_json 格式
        if (item.b64_json) {
          const dataUrl = `data:image/png;base64,${item.b64_json}`
          images.push({
            dataUrl,
            mimeType: 'image/png',
            size: item.b64_json.length
          })
        }
        // url 格式
        else if (item.url) {
          images.push({
            dataUrl: item.url,
            mimeType: 'image/png',
            size: 0
          })
        }
        // revised_prompt 字段 (OpenAI 新格式)
        else if (item.revised_prompt && item.url) {
          images.push({
            dataUrl: item.url,
            mimeType: 'image/png',
            size: 0
          })
        }
      }
    }

    // 如果还是没找到图片,尝试深度搜索
    if (images.length === 0 && isImageModel.value) {
      console.log('No images found, response:', response.value)
    }
  } catch (e) {
    console.error('Error extracting images:', e, response.value)
  }

  return images
})

// 格式化字节大小
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 获取显示的响应数据(可折叠 base64)
function getDisplayResponse() {
  if (!response.value) return ''

  if (showFullBase64.value) {
    // 显示完整数据
    return JSON.stringify(response.value, null, 2)
  } else {
    // 折叠 base64 数据
    const clone = JSON.parse(JSON.stringify(response.value))

    // 遍历并截断 base64 数据
    function truncateBase64(obj: any) {
      if (typeof obj !== 'object' || obj === null) return

      for (const key in obj) {
        if (key === 'data' && typeof obj[key] === 'string' && obj[key].length > 100) {
          // 截断 base64 数据
          obj[key] = obj[key].substring(0, 50) + '... [' + obj[key].length + ' chars] ...' + obj[key].substring(obj[key].length - 50)
        } else if (typeof obj[key] === 'object') {
          truncateBase64(obj[key])
        }
      }
    }

    truncateBase64(clone)
    return JSON.stringify(clone, null, 2)
  }
}

// 复制图片到剪贴板
async function copyImageToClipboard(dataUrl: string) {
  try {
    // 将 data URL 转换为 Blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // 复制到剪贴板
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ])

    alert('图片已复制到剪贴板!')
  } catch (e) {
    console.error('Failed to copy image:', e)
    alert('复制失败,请手动保存图片')
  }
}

// 监听变化自动生成代码
watch([selectedModel, testPrompt, enableTools, streamMode, codeType, uploadedImage, () => config.value], () => {
  generateCode()
}, { deep: true })

// 标准化 Base URL - 移除末尾的 /v1 或 /
function normalizeBaseUrl(url: string): string {
  if (!url) return url
  // 移除末尾的斜杠
  url = url.replace(/\/+$/, '')
  // 如果以 /v1 或 /v1beta 结尾,移除它
  if (url.endsWith('/v1') || url.endsWith('/v1beta')) {
    url = url.substring(0, url.lastIndexOf('/'))
  }
  return url
}

// 为 OpenAI API 添加 /v1 路径 (用于代码示例)
function getOpenAIBaseUrl(baseUrl: string): string {
  if (!baseUrl) return baseUrl
  // 如果已经包含 /v1,不重复添加
  if (baseUrl.endsWith('/v1')) return baseUrl
  // 移除末尾斜杠后添加 /v1
  return baseUrl.replace(/\/+$/, '') + '/v1'
}

// 从 localStorage 加载配置
function loadConfig() {
  const saved = localStorage.getItem('llm-api-config')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      config.value.baseUrl = normalizeBaseUrl(parsed.baseUrl || '')
      config.value.apiKey = parsed.apiKey || ''
    } catch (e) {
      console.error('Failed to load config:', e)
    }
  }
}

// 监听导航栏配置更新事件
function handleConfigUpdate(event: CustomEvent) {
  config.value.baseUrl = normalizeBaseUrl(event.detail.baseUrl || '')
  config.value.apiKey = event.detail.apiKey || ''
}

onMounted(() => {
  loadConfig()
  generateCode()
  window.addEventListener('api-config-updated', handleConfigUpdate as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('api-config-updated', handleConfigUpdate as EventListener)
})

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  })
}

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function generateCode() {
  if (codeType.value === 'python') {
    currentCode.value = generatePythonCode()
  } else {
    currentCode.value = generateCurlCode()
  }
}

function generatePythonCode() {
  const rawBaseUrl = config.value.baseUrl || 'YOUR_BASE_URL'
  const apiKey = config.value.apiKey || 'YOUR_API_KEY'
  const model = selectedModel.value
  const prompt = testPrompt.value

  // GPT-5 (Responses API)
  if (model === 'gpt-5') {
    const baseUrl = getOpenAIBaseUrl(rawBaseUrl)
    if (streamMode.value) {
      return `from openai import OpenAI

# 配置客户端
client = OpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

# 流式请求 (Responses API)
response = client.responses.create(
    model="gpt-5",
    input="${prompt}",
    stream=True
)

# 流式输出
for chunk in response:
    if chunk.text:
        print(chunk.text, end="", flush=True)
print()  # 换行`
    } else {
      return `from openai import OpenAI

# 配置客户端
client = OpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

# 发起请求 (Responses API)
response = client.responses.create(
    model="gpt-5",
    input="${prompt}"
)

# 打印结果
print(response.output_text)`
    }
  }

  // GPT-Image-1 (DALL-E)
  if (model === 'gpt-image-1') {
    const baseUrl = getOpenAIBaseUrl(rawBaseUrl)
    if (uploadedImage.value) {
      // 图像编辑模式
      return `from openai import OpenAI

# 配置客户端
client = OpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

# 图像编辑 - 基于参考图生成
with open("input_image.png", "rb") as image_file:
    response = client.images.edit(
        model="gpt-image-1",
        image=image_file,
        prompt="${prompt}",
        size="1024x1024",
        quality="high",  # 可选: "standard" 或 "high"
        n=1,
        response_format="b64_json"  # 或 "url"
    )

# 处理返回的图像
if response.data[0].b64_json:
    import base64
    image_data = base64.b64decode(response.data[0].b64_json)
    with open("edited_image.png", "wb") as f:
        f.write(image_data)
    print("图像已保存为 edited_image.png")
else:
    print(f"图像 URL: {response.data[0].url}")`
    } else {
      // 文生图模式
      return `from openai import OpenAI

# 配置客户端
client = OpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}"
)

# 文本生成图像
response = client.images.generate(
    model="gpt-image-1",
    prompt="${prompt}",
    size="1024x1024",
    quality="high",  # 可选: "standard" 或 "high"
    n=1,
    response_format="b64_json"  # 或 "url"
)

# 处理返回的图像
if response.data[0].b64_json:
    import base64
    image_data = base64.b64decode(response.data[0].b64_json)
    with open("generated_image.png", "wb") as f:
        f.write(image_data)
    print("图像已保存为 generated_image.png")
else:
    print(f"图像 URL: {response.data[0].url}")`
    }
  }

  // Claude
  if (model.startsWith('claude-')) {
    const toolsCode = enableTools.value ? `,
    tools=[
        {
            "name": "get_weather",
            "description": "获取指定城市的天气",
            "input_schema": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"}
                },
                "required": ["city"]
            }
        }
    ]` : ''

    if (streamMode.value) {
      return `from anthropic import Anthropic

# 配置客户端
client = Anthropic(
    base_url="${rawBaseUrl}",
    api_key="${apiKey}"
)

# 流式请求
with client.messages.stream(
    model="${model}",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "${prompt}"}
    ]${toolsCode}
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
print()  # 换行`
    } else {
      return `from anthropic import Anthropic

# 配置客户端
client = Anthropic(
    base_url="${rawBaseUrl}",
    api_key="${apiKey}"
)

# 发起请求
message = client.messages.create(
    model="${model}",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "${prompt}"}
    ]${toolsCode}
)

# 打印结果
print(message.content[0].text)`
    }
  }

  // Gemini
  if (model.startsWith('gemini-')) {
    const isImageGen = model === 'gemini-2.5-flash-image'

    if (isImageGen) {
      return `from google import genai
from google.genai import types

# 配置客户端
client = genai.Client(
    api_key="${apiKey}",
    http_options={'api_endpoint': "${baseUrl}"}
)

# 图像生成 - 只生成图像
response = client.models.generate_content(
    model="${model}",
    contents="${prompt}",
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE"]  # 只返回图像
    )
)

# 保存生成的图像
for part in response.candidates[0].content.parts:
    if part.inline_data:
        with open("generated_image.png", "wb") as f:
            f.write(part.inline_data.data)
        print("图像已保存为 generated_image.png")
        break`
    } else if (streamMode.value) {
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
  }

  // GPT-4/GPT-4o (Chat Completions)
  const baseUrl = getOpenAIBaseUrl(rawBaseUrl)
  const toolsCode = enableTools.value ? `,
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "获取指定城市的天气",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string", "description": "城市名称"}
                    },
                    "required": ["city"]
                }
            }
        }
    ]` : ''

  if (streamMode.value) {
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
    stream=True${toolsCode}
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
    ]${toolsCode}
)

# 打印结果
print(response.choices[0].message.content)`
  }
}

function generateCurlCode() {
  const rawBaseUrl = config.value.baseUrl || 'YOUR_BASE_URL'
  const apiKey = config.value.apiKey || 'YOUR_API_KEY'
  const model = selectedModel.value
  const prompt = testPrompt.value

  // GPT-5 (Responses API)
  if (model === 'gpt-5') {
    const baseUrl = getOpenAIBaseUrl(rawBaseUrl)
    const streamParam = streamMode.value ? ',\n    "stream": true' : ''
    return `curl ${baseUrl}/v1/responses \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "gpt-5",
    "input": "${prompt}"${streamParam}
  }'`
  }

  // GPT-Image-1
  if (model === 'gpt-image-1') {
    const baseUrl = getOpenAIBaseUrl(rawBaseUrl)
    if (uploadedImage.value) {
      // 图像编辑模式 - 使用 multipart/form-data
      return `curl ${baseUrl}/v1/images/edits \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "model=gpt-image-1" \\
  -F "image=@input_image.png" \\
  -F "prompt=${prompt}" \\
  -F "size=1024x1024" \\
  -F "quality=high" \\
  -F "n=1" \\
  -F "response_format=b64_json"`
    } else {
      // 文生图模式
      return `curl ${baseUrl}/v1/images/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "gpt-image-1",
    "prompt": "${prompt}",
    "size": "1024x1024",
    "quality": "high",
    "n": 1,
    "response_format": "b64_json"
  }'`
    }
  }

  // Claude
  if (model.startsWith('claude-')) {
    const streamParam = streamMode.value ? ',\n    "stream": true' : ''
    const toolsParam = enableTools.value ? `,\n    "tools": [
      {
        "name": "get_weather",
        "description": "获取指定城市的天气",
        "input_schema": {
          "type": "object",
          "properties": {
            "city": {"type": "string", "description": "城市名称"}
          },
          "required": ["city"]
        }
      }
    ]` : ''
    return `curl ${rawBaseUrl}/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "${model}",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "${prompt}"}
    ]${streamParam}${toolsParam}
  }'`
  }

  // Gemini
  if (model.startsWith('gemini-')) {
    const isImageGen = model === 'gemini-2.5-flash-image'
    const endpoint = streamMode.value ? 'streamGenerateContent' : 'generateContent'

    if (isImageGen) {
      // 图像生成 - 只返回图像
      return `curl "${baseUrl}/v1beta/models/${model}:${endpoint}?key=${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "parts": [{"text": "${prompt}"}]
    }],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 1024,
      "response_modalities": ["IMAGE"]
    }
  }'`
    } else {
      // 文本生成
      const altParam = streamMode.value ? '&alt=sse' : ''
      return `curl "${baseUrl}/v1beta/models/${model}:${endpoint}?key=${apiKey}${altParam}" \\
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
    }
  }

  // GPT-4/GPT-4o
  const baseUrl = getOpenAIBaseUrl(rawBaseUrl)
  const streamParam = streamMode.value ? ',\n    "stream": true' : ''
  const toolsParam = enableTools.value ? `,\n    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "获取指定城市的天气",
          "parameters": {
            "type": "object",
            "properties": {
              "city": {"type": "string", "description": "城市名称"}
            },
            "required": ["city"]
          }
        }
      }
    ]` : ''

  return `curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "${prompt}"}
    ]${streamParam}${toolsParam}
  }'`
}

async function executeTest() {
  if (!canExecute.value) {
    error.value = '请先配置 Base URL、API Key 并输入测试消息!'
    return
  }

  loading.value = true
  response.value = null
  streamChunks.value = []
  error.value = ''

  try {
    // 根据模型类型执行不同的请求
    const model = selectedModel.value

    if (model === 'gpt-5') {
      await executeGPT5Request()
    } else if (model === 'gpt-image-1') {
      await executeImageGeneration()
    } else if (model.startsWith('claude-')) {
      await executeClaudeRequest()
    } else if (model.startsWith('gemini-')) {
      await executeGeminiRequest()
    } else {
      // GPT-4/GPT-4o
      await executeGPTRequest()
    }
  } catch (e: any) {
    error.value = e.message || '未知错误'
  } finally {
    loading.value = false
  }
}

// GPT-5 Responses API
async function executeGPT5Request() {
  const baseUrl = getOpenAIBaseUrl(config.value.baseUrl)
  const url = `${baseUrl}/v1/responses`
  const payload: any = {
    model: 'gpt-5',
    input: testPrompt.value
  }

  if (streamMode.value) {
    payload.stream = true
  }

  const fetchResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.value.apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text()
    throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`)
  }

  if (streamMode.value) {
    await handleStreamResponse(fetchResponse, 'openai')
  } else {
    response.value = await fetchResponse.json()
  }
}

// 图像生成或编辑
async function executeImageGeneration() {
  const baseUrl = getOpenAIBaseUrl(config.value.baseUrl)

  // 如果有上传图片,使用编辑模式
  if (uploadedImage.value) {
    const url = `${baseUrl}/v1/images/edits`

    // 将 base64 转换为 Blob
    const base64Data = uploadedImage.value.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteArrays = []
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i))
    }
    const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/png' })

    // 构建 FormData
    const formData = new FormData()
    formData.append('model', selectedModel.value)
    formData.append('image', blob, 'input_image.png')
    formData.append('prompt', testPrompt.value)
    formData.append('size', '1024x1024')
    formData.append('quality', 'high')
    formData.append('n', '1')
    formData.append('response_format', 'b64_json')

    console.log('Image edit request:', { url, prompt: testPrompt.value })

    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.value.apiKey}`
      },
      body: formData
    })

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text()
      throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`)
    }

    const result = await fetchResponse.json()
    console.log('Image edit response:', result)
    response.value = result

    if (!result.data || result.data.length === 0) {
      error.value = '响应中没有图片数据,请检查 API 配置'
    } else if (!result.data[0].url && !result.data[0].b64_json) {
      error.value = '图片数据格式不正确'
    }
  } else {
    // 文生图模式
    const url = `${baseUrl}/v1/images/generations`
    const payload = {
      model: selectedModel.value,
      prompt: testPrompt.value,
      size: '1024x1024',
      quality: 'high',
      n: 1,
      response_format: 'b64_json'
    }

    console.log('Image generation request:', { url, payload })

    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.value.apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text()
      throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`)
    }

    const result = await fetchResponse.json()
    console.log('Image generation response:', result)
    response.value = result

    if (!result.data || result.data.length === 0) {
      error.value = '响应中没有图片数据,请检查 API 配置'
    } else if (!result.data[0].url && !result.data[0].b64_json) {
      error.value = '图片数据格式不正确'
    }
  }
}

// GPT-4/GPT-4o
async function executeGPTRequest() {
  const baseUrl = getOpenAIBaseUrl(config.value.baseUrl)
  const url = `${baseUrl}/v1/chat/completions`
  const payload: any = {
    model: selectedModel.value,
    messages: [{ role: 'user', content: testPrompt.value }]
  }

  if (streamMode.value) {
    payload.stream = true
  }

  if (enableTools.value) {
    payload.tools = [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: '获取指定城市的天气',
          parameters: {
            type: 'object',
            properties: {
              city: { type: 'string', description: '城市名称' }
            },
            required: ['city']
          }
        }
      }
    ]
  }

  const fetchResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.value.apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text()
    throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`)
  }

  if (streamMode.value) {
    await handleStreamResponse(fetchResponse, 'openai')
  } else {
    response.value = await fetchResponse.json()
  }
}

// Claude
async function executeClaudeRequest() {
  const url = `${config.value.baseUrl}/v1/messages`
  const payload: any = {
    model: selectedModel.value,
    max_tokens: 1024,
    messages: [{ role: 'user', content: testPrompt.value }]
  }

  if (streamMode.value) {
    payload.stream = true
  }

  if (enableTools.value) {
    payload.tools = [
      {
        name: 'get_weather',
        description: '获取指定城市的天气',
        input_schema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: '城市名称' }
          },
          required: ['city']
        }
      }
    ]
  }

  const fetchResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.value.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  })

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text()
    throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`)
  }

  if (streamMode.value) {
    await handleStreamResponse(fetchResponse, 'claude')
  } else {
    response.value = await fetchResponse.json()
  }
}

// Gemini
async function executeGeminiRequest() {
  const endpoint = streamMode.value ? 'streamGenerateContent' : 'generateContent'
  // Gemini 流式需要添加 alt=sse 参数
  const altParam = streamMode.value ? '&alt=sse' : ''
  const url = `${config.value.baseUrl}/v1beta/models/${selectedModel.value}:${endpoint}?key=${config.value.apiKey}${altParam}`

  const payload = {
    contents: [{
      parts: [{ text: testPrompt.value }]
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

  if (streamMode.value) {
    await handleStreamResponse(fetchResponse, 'gemini')
  } else {
    response.value = await fetchResponse.json()
  }
}

// 处理流式响应
async function handleStreamResponse(fetchResponse: Response, provider: 'openai' | 'claude' | 'gemini') {
  const reader = fetchResponse.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = '' // 用于处理跨 chunk 的数据

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      // 流结束,添加结束标记
      if (streamChunks.value.length > 0) {
        streamChunks.value.push({
          content: '[STREAM_END]',
          timestamp: Date.now(),
          index: streamChunks.value.length,
          rawData: '{"streamEnd": true}'
        })
      }
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // 保留最后一个不完整的行

    for (const line of lines) {
      if (!line.trim()) continue

      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') {
          streamChunks.value.push({
            content: '[DONE]',
            timestamp: Date.now(),
            index: streamChunks.value.length,
            rawData: 'data: [DONE]'
          })
          return
        }

        try {
          const json = JSON.parse(data)
          let content = ''

          if (provider === 'openai') {
            content = json.choices?.[0]?.delta?.content || json.text || ''
          } else if (provider === 'claude') {
            if (json.type === 'content_block_delta') {
              content = json.delta?.text || ''
            }
          } else if (provider === 'gemini') {
            // Gemini 可能有多种格式
            content = json.candidates?.[0]?.content?.parts?.[0]?.text ||
                     json.text ||
                     ''
          }

          // 保存原始 chunk 和提取的 content
          streamChunks.value.push({
            content: content || '(empty)',
            timestamp: Date.now(),
            index: streamChunks.value.length,
            rawData: JSON.stringify(json, null, 2)
          })
        } catch (e) {
          console.error('Parse error:', e, 'Data:', data)
          streamChunks.value.push({
            content: '(parse error)',
            timestamp: Date.now(),
            index: streamChunks.value.length,
            rawData: data
          })
        }
      } else if (line.trim().startsWith('{')) {
        // 某些 API 可能不使用 "data: " 前缀
        try {
          const json = JSON.parse(line)
          let content = ''

          if (provider === 'gemini') {
            content = json.candidates?.[0]?.content?.parts?.[0]?.text || json.text || ''
          }

          if (content || Object.keys(json).length > 0) {
            streamChunks.value.push({
              content: content || '(no text)',
              timestamp: Date.now(),
              index: streamChunks.value.length,
              rawData: JSON.stringify(json, null, 2)
            })
          }
        } catch (e) {
          // 忽略非 JSON 行
        }
      }
    }
  }
}
</script>

<style scoped>
.unified-playground {
  margin: 1rem auto;
  padding: 0 1rem;
  max-width: 1400px;
  width: 100%;
  box-sizing: border-box;
}

.unified-playground h2 {
  margin-bottom: 1rem;
  padding: 0 0.5rem;
  color: var(--vp-c-brand);
}

/* 三栏布局 */
.three-column-layout {
  display: grid;
  grid-template-columns: 280px 1fr 380px;
  gap: 1rem;
  margin-top: 1rem;
  min-height: 600px;
  width: 100%;
}

/* 面板通用样式 */
.left-panel,
.middle-panel,
.right-panel {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  background: var(--vp-c-brand);
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 左侧配置区 */
.left-panel {
  padding-bottom: 1rem;
}

.config-section {
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.config-section:last-child {
  border-bottom: none;
}

.config-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin-bottom: 0.5rem;
}

.config-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.config-select:hover {
  border-color: var(--vp-c-brand);
}

.config-select:focus {
  outline: none;
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px rgba(var(--vp-c-brand-rgb), 0.1);
}

.config-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
}

.config-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.config-file {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
}

.config-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
  resize: vertical;
  transition: border-color 0.2s;
}

.config-textarea:hover {
  border-color: var(--vp-c-brand);
}

.config-textarea:focus {
  outline: none;
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px rgba(var(--vp-c-brand-rgb), 0.1);
}

/* 中间代码区 */
.middle-panel {
  min-width: 500px;
  /* 调试用:确保可见 */
}

.code-container {
  flex: 1;
  overflow: hidden;
  min-height: 400px;
  background: var(--vp-c-bg);
}

/* 右侧结果区 */
.result-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--vp-c-text-2);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 14px;
}

.tab-switcher {
  display: flex;
  gap: 0.25rem;
}

.tab-button {
  padding: 0.25rem 0.75rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 500;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tab-button.active {
  background: rgba(255, 255, 255, 0.3);
}

.btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: var(--vp-c-brand);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 600;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.response-display,
.streaming-display {
  margin-bottom: 1rem;
}

.response-display:last-child,
.streaming-display:last-child {
  margin-bottom: 0;
}

.response-display h4,
.streaming-display h4 {
  margin: 0 0 0.75rem 0;
  font-size: 14px;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.response-display pre {
  margin: 0;
  padding: 1rem;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
  max-height: 500px;
  overflow-y: auto;
}

/* 图片预览 */
.image-preview-container {
  margin-bottom: 1rem;
}

.image-preview-item {
  margin-bottom: 1rem;
}

.generated-image {
  max-width: 100%;
  max-height: 400px;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  display: block;
  margin-bottom: 0.5rem;
  object-fit: contain;
}

.image-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 12px;
  color: var(--vp-c-text-2);
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.image-info span {
  font-family: var(--vp-font-family-mono);
}

.copy-btn {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: opacity 0.2s;
}

.copy-btn:hover {
  opacity: 0.8;
}

/* JSON 响应 */
.json-response {
  margin-top: 1rem;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.json-header span {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.toggle-btn {
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--vp-c-bg-mute);
}

.stream-chunks {
  max-height: 500px;
  overflow-y: auto;
}

.chunk-item {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  transition: box-shadow 0.2s;
}

.chunk-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chunk-item:last-child {
  margin-bottom: 0;
}

.chunk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.chunk-index {
  font-weight: 600;
  color: var(--vp-c-brand);
  font-size: 12px;
}

.chunk-time {
  font-size: 11px;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
}

.chunk-data {
  margin: 0;
  padding: 0.5rem;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 11px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
}

.error-display {
  padding: 1rem;
  background: #fee;
  border: 1px solid #f66;
  border-radius: 6px;
  color: #c00;
}

.error-display h4 {
  margin: 0 0 0.5rem 0;
  font-size: 14px;
  font-weight: 600;
}

.error-display pre {
  margin: 0;
  padding: 0.5rem;
  background: #fdd;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.5;
}
</style>
