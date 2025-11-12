#!/bin/bash

# 部署脚本 - 自动安装依赖并使用 PM2 运行项目
# 作者: Auto-generated
# 日期: 2025-11-12

set -e  # 遇到错误立即退出

echo "================================"
echo "开始部署 LLM API 文档项目"
echo "================================"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
fi

echo "✓ npm 版本: $(npm -v)"

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 未安装，正在全局安装 PM2..."
    npm install -g pm2
    echo "✓ PM2 安装完成"
else
    echo "✓ PM2 已安装: $(pm2 -v)"
fi

# 进入项目目录
cd llm-api-docs

echo ""
echo "================================"
echo "1. 安装项目依赖"
echo "================================"

# 清理旧的 node_modules（可选）
# rm -rf node_modules package-lock.json

# 安装依赖
npm install

echo "✓ 依赖安装完成"

echo ""
echo "================================"
echo "2. 构建项目"
echo "================================"

# 构建项目
npm run build

echo "✓ 项目构建完成"

echo ""
echo "================================"
echo "3. 使用 PM2 启动服务"
echo "================================"

# 停止旧进程（如果存在）
pm2 delete llm-api-docs 2>/dev/null || true

# 使用 PM2 配置文件启动
pm2 start ecosystem.config.cjs

# 保存 PM2 进程列表
pm2 save

# 设置 PM2 开机自启（可选）
# pm2 startup

echo ""
echo "================================"
echo "✓ 部署完成！"
echo "================================"
echo ""
echo "服务信息:"
echo "  - 应用名称: llm-api-docs"
echo "  - 运行端口: 6753"
echo "  - 访问地址: http://localhost:6753"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs llm-api-docs"
echo "  重启服务: pm2 restart llm-api-docs"
echo "  停止服务: pm2 stop llm-api-docs"
echo "  删除服务: pm2 delete llm-api-docs"
echo ""
