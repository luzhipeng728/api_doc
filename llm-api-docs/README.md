# LLM API 测试文档

一个统一的大语言模型 API 测试文档与交互式 Playground,支持 OpenAI、Claude、Gemini 等主流 LLM API。

## 特性

- ✅ **交互式 Playground** - 实时测试 API 请求,支持流式和非流式响应
- ✅ **配置持久化** - 自动保存 Base URL 和 API Key 到本地
- ✅ **多语言代码示例** - 提供 Python 和 cURL 代码示例
- ✅ **Monaco Editor** - 集成完整的代码编辑器
- ✅ **流式响应支持** - 实时展示流式生成内容
- ✅ **多模态功能** - 支持图像生成、语音转文字等

## 支持的 API

### OpenAI
- GPT-4, GPT-3.5 Turbo (文本对话)
- Function Calling (工具调用)
- DALL-E 3 (图像生成)
- Whisper (语音转文字)

### Claude (Anthropic)
- Claude Sonnet 4.5 - 最强编码模型
- Claude Opus 4.1 - 最强推理模型
- Claude Haiku 4.5 - 最快响应
- 流式响应和工具调用

### Gemini (Google)
- Gemini 2.5 Pro - 最强推理
- Gemini 2.5 Flash - 平衡速度和性能
- **Gemini 2.5 Flash Image** - 原生图像生成 (NEW!)
- Imagen 3 - 专业图像生成
- 流式响应和函数调用

## 快速开始

### 1. 安装依赖

```bash
cd llm-api-docs
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问

打开浏览器访问: `http://localhost:5173`

### 4. 构建生产版本

```bash
npm run build
npm run preview
```

## 项目结构

```
llm-api-docs/
├── docs/                          # 文档源文件
│   ├── .vitepress/
│   │   ├── config.ts              # VitePress 配置
│   │   └── theme/
│   │       ├── components/        # Vue 组件
│   │       │   ├── ApiPlayground.vue      # API 测试 Playground
│   │       │   ├── CodeEditor.vue         # Monaco 编辑器
│   │       │   └── ConfigPanel.vue        # 配置面板
│   │       └── utils/             # 工具函数
│   │           ├── storage.ts             # localStorage 封装
│   │           └── api-client.ts          # API 调用封装
│   ├── index.md                   # 首页
│   ├── getting-started.md         # 快速开始
│   ├── openai/                    # OpenAI 文档
│   │   ├── index.md
│   │   ├── chat-completion.md
│   │   ├── function-calling.md
│   │   ├── text-to-image.md
│   │   └── whisper.md
│   ├── claude/                    # Claude 文档
│   │   ├── index.md
│   │   ├── sonnet-4-5.md
│   │   ├── opus-4-1.md
│   │   └── streaming.md
│   └── gemini/                    # Gemini 文档
│       ├── index.md
│       ├── gemini-2-5-pro.md
│       ├── gemini-2-5-flash.md
│       ├── gemini-2-5-flash-image.md  # ⭐ 图像生成
│       └── streaming.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 使用说明

### 1. 配置 API 凭证

在任何 API 测试页面:
- 输入 **Base URL** (如 `https://api.openai.com`)
- 输入 **API Key**
- 点击"保存配置"

配置会自动保存到浏览器 localStorage,下次访问无需重新输入。

### 2. 测试 API

1. 查看预设的代码示例
2. 根据需要修改请求参数
3. 点击"测试请求"或"测试流式请求"
4. 查看响应结果

### 3. 切换代码示例

- 点击 **Python** 标签查看 Python SDK 代码
- 点击 **cURL** 标签查看命令行调用方式

## 技术栈

- **VitePress** - 文档框架
- **Vue 3** - 前端框架
- **TypeScript** - 类型支持
- **Monaco Editor** - 代码编辑器
- **Vite** - 构建工具

## 核心功能

### API Playground

每个 API 页面都包含交互式 Playground:
- 实时编辑请求参数
- 支持流式和非流式请求
- 自动保存配置
- 错误提示和处理

### 代码示例

提供完整的代码示例:
- Python SDK 调用
- cURL 命令行调用
- 支持在线编辑和测试

### 配置管理

- localStorage 本地存储
- 自动加载上次配置
- 支持清除配置

## 开发指南

### 添加新的 API 文档

1. 在 `docs/<provider>/` 目录创建新的 Markdown 文件
2. 使用 `<ApiPlayground>` 组件嵌入测试功能
3. 在 `.vitepress/config.ts` 中添加侧边栏配置

示例:
```markdown
---
title: 你的 API 标题
---

# API 说明

<ApiPlayground
  provider="openai"
  :defaultRequest="{
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  }"
/>

## 其他说明...
```

### 自定义样式

编辑 `docs/.vitepress/theme/custom.css`

### 添加新组件

在 `docs/.vitepress/theme/components/` 目录创建 Vue 组件,
然后在 `theme/index.ts` 中注册。

## 部署

### Vercel

```bash
npm run build
```

然后上传 `docs/.vitepress/dist` 目录到 Vercel。

### GitHub Pages

在 `.github/workflows/deploy.yml` 配置 GitHub Actions 自动部署。

### 其他平台

构建后的静态文件在 `docs/.vitepress/dist` 目录,可部署到任何静态网站托管服务。

## 贡献

欢迎提交 Issue 和 Pull Request!

## License

MIT License

## 相关链接

- [VitePress 文档](https://vitepress.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Claude API 文档](https://docs.anthropic.com/)
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)

## 常见问题

### Q: 配置保存在哪里?
A: 配置使用浏览器的 localStorage 保存在本地,不会上传到服务器。

### Q: 支持哪些代理服务?
A: 只要代理服务兼容对应的 API 格式,就可以使用。只需修改 Base URL 即可。

### Q: 如何添加新的模型?
A: 在代码编辑器中修改 `model` 参数即可,例如从 `gpt-4` 改为 `gpt-3.5-turbo`。

### Q: Monaco Editor 加载很慢?
A: 可以在 `vite.config.ts` 中配置 CDN 加载或调整语言支持。

## 致谢

- 感谢 VitePress 团队提供优秀的文档框架
- 感谢 Monaco Editor 提供强大的代码编辑器
- 感谢 OpenAI、Anthropic、Google 提供的 API 文档参考
