---
layout: home

hero:
  name: LLM API 测试文档
  text: 统一的大语言模型 API 测试平台
  tagline: 支持 OpenAI、Claude、Gemini 等主流 LLM API,提供交互式测试 Playground
  actions:
    - theme: brand
      text: 🎮 开始测试
      link: /playground
    - theme: alt
      text: 快速开始
      link: /getting-started

features:
  - icon: 🚀
    title: 交互式 Playground
    details: 实时测试 API 请求,支持流式和非流式响应,直观查看返回结果
  - icon: 💾
    title: 配置持久化
    details: 自动保存 Base URL 和 API Key,刷新页面后无需重新输入
  - icon: 📝
    title: 代码示例
    details: 提供 Python 和 cURL 代码示例,支持在线编辑和测试
  - icon: 🔄
    title: 流式响应
    details: 完整支持流式响应,实时展示生成内容
  - icon: 🛠️
    title: 工具调用
    details: 支持 Function Calling/Tool Use,展示工具调用完整流程
  - icon: 🖼️
    title: 多模态支持
    details: 支持文生图、图生图、语音转文字等多模态功能
---

## 支持的模型

### OpenAI
- GPT-4, GPT-4 Turbo
- GPT-3.5 Turbo
- DALL-E 3 (图像生成)
- Whisper (语音转文字)

### Claude (Anthropic)
- **Claude Sonnet 4.5** - 最强编码模型
- **Claude Opus 4.1** - 最强推理模型
- Claude Haiku 4.5 - 最快响应

### Gemini (Google)
- **Gemini 2.5 Pro** - 最强推理
- **Gemini 2.5 Flash** - 平衡速度
- **Gemini 2.5 Flash Image** - 原生图像生成
- Imagen 3 - 专业图像生成

## 快速上手

1. **选择你要测试的 API**
   点击上方导航栏选择 OpenAI、Claude 或 Gemini

2. **配置你的 API**
   输入 Base URL 和 API Key,系统会自动保存

3. **开始测试**
   修改请求参数,点击测试按钮查看响应

4. **查看代码示例**
   切换 Python/cURL 标签查看对应代码

## 特点

- ✅ 无需安装,浏览器直接使用
- ✅ 配置安全存储在本地
- ✅ 支持自定义 Base URL
- ✅ 完整的错误提示
- ✅ 暗色主题支持
