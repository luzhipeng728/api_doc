<template>
  <div class="code-editor-wrapper">
    <!-- 如果编辑器加载失败或超时,显示 textarea -->
    <div v-if="loadError" class="editor-error">
      <div class="error-message">{{ errorMessage }}</div>
      <textarea
        v-model="textareaValue"
        class="fallback-textarea"
        @input="handleTextareaInput"
      ></textarea>
    </div>

    <!-- 加载提示 -->
    <div v-if="!editorReady && !loadError" class="code-editor-loading">
      编辑器加载中... ({{ props.modelValue?.length || 0 }} 字符待加载)
    </div>

    <!-- Monaco Editor 容器 - 始终渲染,但可能隐藏 -->
    <div
      ref="editorContainer"
      class="editor-container"
      :style="{ display: editorReady && !loadError ? 'block' : 'none' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  language: string
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorContainer = ref<HTMLElement>()
const editorReady = ref(false)
const loadError = ref(false)
const errorMessage = ref('')
const textareaValue = ref('')
let editor: any = null
let monaco: any = null
let loadTimeout: any = null

onMounted(async () => {
  // 等待 DOM 完全渲染
  await nextTick()

  // 设置10秒超时
  loadTimeout = setTimeout(() => {
    if (!editorReady.value) {
      loadError.value = true
      errorMessage.value = 'Monaco Editor 加载超时,使用简单文本编辑器'
      textareaValue.value = props.modelValue || ''
      console.warn('[CodeEditor] Load timeout, fallback to textarea')
    }
  }, 10000)

  if (!editorContainer.value) {
    console.error('[CodeEditor] Container not found after nextTick')
    clearTimeout(loadTimeout)
    loadError.value = true
    errorMessage.value = '编辑器容器未找到'
    textareaValue.value = props.modelValue || ''
    return
  }

  try {
    // 动态导入 monaco-editor
    monaco = await import('monaco-editor')

    // 配置 Monaco Environment (简单禁用 worker)
    ;(window as any).MonacoEnvironment = {
      getWorker: () => {
        return {
          postMessage: () => {},
          terminate: () => {}
        } as any
      }
    }

    // 清除超时
    clearTimeout(loadTimeout)

    // 确保使用最新的 props 值
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue || '',
      language: props.language || 'python',
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 14,
      tabSize: 2,
      automaticLayout: true,
      readOnly: props.readOnly || false,
      scrollBeyondLastLine: false,
      wordWrap: 'on'
    })

    editor.onDidChangeModelContent(() => {
      if (editor && editorReady.value) {
        emit('update:modelValue', editor.getValue())
      }
    })

    // 编辑器加载完成
    editorReady.value = true
  } catch (err: any) {
    console.error('[CodeEditor] Failed to load Monaco Editor:', err)
    clearTimeout(loadTimeout)
    loadError.value = true
    errorMessage.value = `Monaco Editor 加载失败: ${err.message || '未知错误'}`
    textareaValue.value = props.modelValue || ''
  }
})

function handleTextareaInput() {
  emit('update:modelValue', textareaValue.value)
}

watch(() => props.modelValue, (newValue) => {
  if (loadError.value) {
    // 使用 textarea 后备方案
    textareaValue.value = newValue || ''
  } else if (editor && editorReady.value && newValue !== undefined && newValue !== null) {
    const currentValue = editor.getValue()
    if (currentValue !== newValue) {
      editor.setValue(newValue)
    }
  }
})

watch(() => props.language, (newLang) => {
  if (editor && monaco) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLang)
    }
  }
})

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<style scoped>
.code-editor-wrapper {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}

.editor-container {
  height: 400px;
  width: 100%;
}

.code-editor-loading {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
}

.editor-error {
  padding: 1rem;
}

.error-message {
  padding: 0.5rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  margin-bottom: 0.5rem;
  font-size: 14px;
}

.fallback-textarea {
  width: 100%;
  height: 400px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: #1e1e1e;
  color: #d4d4d4;
  resize: vertical;
  tab-size: 2;
}

.fallback-textarea:focus {
  outline: 2px solid var(--vp-c-brand);
  outline-offset: -1px;
}
</style>
