# 快速开始

欢迎使用 LLM API 测试文档!本指南将帮助你快速上手。

## 第一步:选择你要测试的 API

本文档支持三大主流 LLM API:

- **[OpenAI](/openai/)** - GPT-4, DALL-E, Whisper 等
- **[Claude](/claude/)** - Sonnet 4.5, Opus 4.1 等
- **[Gemini](/gemini/)** - Gemini 2.5 Pro/Flash, 图像生成等

点击上方导航栏或上述链接选择对应的 API 文档。

## 第二步:配置 API 凭证

在每个 API 的测试页面,你会看到配置面板:

1. **Base URL** - API 的基础地址
   - OpenAI: `https://api.openai.com`
   - 自定义代理: `https://your-proxy.com`

2. **API Key** - 你的 API 密钥
   - 格式通常为 `sk-xxx...`
   - 配置会自动保存在浏览器本地

3. 点击"保存配置"按钮

## 第三步:测试 API

### 查看预设代码

每个页面都提供了预设的 Python 和 cURL 代码示例:

- 点击 **Python** 标签查看 Python SDK 代码
- 点击 **cURL** 标签查看命令行调用方式

### 修改请求参数

代码编辑器支持在线修改:

- 修改 `model` 参数选择不同模型
- 修改 `messages` 数组自定义对话内容
- 调整 `temperature`、`max_tokens` 等参数

### 发送请求

- 点击 **"测试请求"** 按钮发送普通请求
- 点击 **"测试流式请求"** 按钮测试流式响应

### 查看响应

- 普通请求会在"响应结果"区域显示完整 JSON
- 流式请求会实时显示生成的内容块

## 第四步:探索高级功能

### 工具调用 (Function Calling)

在支持的页面(如 OpenAI Function Calling)可以测试工具调用:

1. 查看预设的工具定义
2. 修改工具参数
3. 查看模型如何调用工具

### 多模态功能

#### 图像生成
- [OpenAI DALL-E](/openai/text-to-image) - 文生图、图生图
- [Gemini 2.5 Flash Image](/gemini/gemini-2-5-flash-image) - 原生图像生成

#### 语音处理
- [OpenAI Whisper](/openai/whisper) - 语音转文字

## 常见问题

### Q: 配置保存在哪里?
A: 配置使用浏览器的 localStorage 保存在本地,不会上传到服务器。

### Q: 支持哪些代理服务?
A: 只要代理服务兼容 OpenAI API 格式,就可以使用。只需修改 Base URL 即可。

### Q: 如何切换不同的模型?
A: 在代码编辑器中修改 `model` 参数,例如从 `gpt-4` 改为 `gpt-3.5-turbo`。

### Q: 流式响应和普通响应有什么区别?
A:
- 普通响应:等待完整生成后一次性返回
- 流式响应:逐块返回,实时显示生成过程

## 下一步

选择你要使用的 API 开始测试:

- [OpenAI API 文档](/openai/)
- [Claude API 文档](/claude/)
- [Gemini API 文档](/gemini/)
