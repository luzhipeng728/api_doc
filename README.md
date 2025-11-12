# LLM API 文档项目

这是一个基于 VitePress 的 LLM API 交互式文档项目，支持 OpenAI、Claude、Gemini 等多个 AI 模型的 API 测试。

## 项目结构

```
api_doc/
├── llm-api-docs/          # 主项目目录
│   ├── docs/              # 文档源文件
│   ├── ecosystem.config.cjs  # PM2 配置文件
│   └── package.json       # 项目依赖
├── deploy.sh              # 一键部署脚本
└── README.md              # 项目说明
```

## 快速开始

### 本地开发

```bash
cd llm-api-docs
npm install
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
cd llm-api-docs
npm run build
npm run preview
```

## 服务器部署

### 方式一：使用一键部署脚本（推荐）

1. **克隆代码到服务器**

```bash
git clone https://github.com/luzhipeng728/api_doc.git
cd api_doc
```

2. **执行部署脚本**

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成以下操作：
- ✅ 检查 Node.js、npm、PM2 环境
- ✅ 自动安装项目依赖
- ✅ 构建生产版本
- ✅ 使用 PM2 启动服务（端口 6753）
- ✅ 配置自动重启和日志管理

3. **访问应用**

```
http://你的服务器IP:6753
```

### 方式二：手动部署

1. **克隆代码**

```bash
git clone https://github.com/luzhipeng728/api_doc.git
cd api_doc/llm-api-docs
```

2. **安装依赖**

```bash
npm install
```

3. **构建项目**

```bash
npm run build
```

4. **安装 PM2（如果未安装）**

```bash
npm install -g pm2
```

5. **启动服务**

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## PM2 常用命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs llm-api-docs

# 重启服务
pm2 restart llm-api-docs

# 停止服务
pm2 stop llm-api-docs

# 删除服务
pm2 delete llm-api-docs

# 查看详细信息
pm2 show llm-api-docs

# 监控面板
pm2 monit
```

## 配置说明

### 端口配置

服务默认运行在 **6753** 端口，如需修改：

1. 编辑 `llm-api-docs/ecosystem.config.cjs`
2. 修改 `args` 中的 `--port` 参数
3. 重启服务：`pm2 restart llm-api-docs`

### 日志管理

日志文件位置：`llm-api-docs/logs/`
- `out.log` - 标准输出日志
- `error.log` - 错误日志

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- PM2（自动安装）

## 技术栈

- VitePress - 静态站点生成器
- Vue 3 - 前端框架
- TypeScript - 类型支持
- Monaco Editor - 代码编辑器
- PM2 - 进程管理

## 功能特性

- 📚 完整的 API 文档
- 🎮 交互式 API 测试环境
- 🔄 支持多个 LLM 提供商
- 💾 本地配置存储
- 🎨 现代化 UI 界面

## 许可证

MIT
