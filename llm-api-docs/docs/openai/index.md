# OpenAI API

OpenAI 提供了强大的 GPT 系列模型和多模态能力。

## 概览

OpenAI API 支持多种功能:

- **文本生成** - GPT-4, GPT-3.5 Turbo
- **图像生成** - DALL-E 3
- **语音转文字** - Whisper
- **Embeddings** - text-embedding-ada-002

## 快速开始

### 1. 获取 API Key

访问 [OpenAI Platform](https://platform.openai.com/api-keys) 创建 API Key。

### 2. 配置 Base URL

- 官方 API: `https://api.openai.com`
- 自定义代理: `https://your-proxy.com`

### 3. 选择功能

点击左侧导航栏选择你要测试的功能:

- [Chat Completions - 普通对话](/openai/chat-completion)
- [Chat Completions - 流式对话](/openai/chat-completion-streaming)
- [Function Calling - 工具调用](/openai/function-calling)
- [Image Generation - 图像生成](/openai/text-to-image)
- [Whisper - 语音转文字](/openai/whisper)

## 支持的模型

### 文本模型

| 模型 | 上下文长度 | 特点 |
|------|-----------|------|
| gpt-4-turbo | 128K | 最强理解能力 |
| gpt-4 | 8K | 高质量输出 |
| gpt-3.5-turbo | 16K | 快速响应 |

### 图像模型

| 模型 | 功能 |
|------|------|
| dall-e-3 | 高质量图像生成 |
| dall-e-2 | 标准图像生成 |

### 语音模型

| 模型 | 功能 |
|------|------|
| whisper-1 | 多语言语音识别 |

## 定价

查看 [OpenAI 官方定价](https://openai.com/pricing)

## 下一步

- [测试聊天对话](/openai/chat-completion)
- [测试工具调用](/openai/function-calling)
- [生成图像](/openai/text-to-image)
