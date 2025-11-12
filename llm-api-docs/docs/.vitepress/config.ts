import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LLM API 测试文档',
  description: '统一的 LLM API 测试文档与 Playground - 支持 OpenAI、Claude、Gemini',
  lang: 'zh-CN',
  ignoreDeadLinks: true,

  vite: {
    ssr: {
      external: ['monaco-editor']
    },
    optimizeDeps: {
      include: ['monaco-editor']
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c8772' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '🎮 Playground', link: '/playground' },
      { text: '快速开始', link: '/getting-started' }
    ],

    sidebar: {
      '/openai/': [
        {
          text: 'OpenAI API',
          items: [
            { text: '概览', link: '/openai/' },
            { text: '快速开始', link: '/openai/getting-started' }
          ]
        },
        {
          text: 'Chat Completions',
          items: [
            { text: '普通对话', link: '/openai/chat-completion' },
            { text: '流式对话', link: '/openai/chat-completion-streaming' },
            { text: '工具调用', link: '/openai/function-calling' },
            { text: '流式工具调用', link: '/openai/function-calling-streaming' }
          ]
        },
        {
          text: '图像生成',
          items: [
            { text: '文生图', link: '/openai/text-to-image' },
            { text: '图生图', link: '/openai/image-to-image' }
          ]
        },
        {
          text: '语音处理',
          items: [
            { text: 'Whisper 语音转文字', link: '/openai/whisper' }
          ]
        }
      ],

      '/claude/': [
        {
          text: 'Claude API',
          items: [
            { text: '概览', link: '/claude/' },
            { text: '快速开始', link: '/claude/getting-started' }
          ]
        },
        {
          text: '模型',
          items: [
            { text: 'Sonnet 4.5', link: '/claude/sonnet-4-5' },
            { text: 'Opus 4.1', link: '/claude/opus-4-1' },
            { text: 'Haiku 4.5', link: '/claude/haiku-4-5' }
          ]
        },
        {
          text: '功能',
          items: [
            { text: '消息 API', link: '/claude/messages' },
            { text: '流式响应', link: '/claude/streaming' },
            { text: '工具调用', link: '/claude/tool-calling' }
          ]
        }
      ],

      '/gemini/': [
        {
          text: 'Gemini API',
          items: [
            { text: '概览', link: '/gemini/' },
            { text: '快速开始', link: '/gemini/getting-started' }
          ]
        },
        {
          text: '文本模型',
          items: [
            { text: 'Gemini 2.5 Pro', link: '/gemini/gemini-2-5-pro' },
            { text: 'Gemini 2.5 Flash', link: '/gemini/gemini-2-5-flash' }
          ]
        },
        {
          text: '图像模型',
          items: [
            { text: 'Gemini 2.5 Flash Image', link: '/gemini/gemini-2-5-flash-image' },
            { text: 'Imagen 3', link: '/gemini/imagen-3' }
          ]
        },
        {
          text: '功能',
          items: [
            { text: '内容生成', link: '/gemini/generate-content' },
            { text: '流式响应', link: '/gemini/streaming' },
            { text: '函数调用', link: '/gemini/function-calling' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025'
    },

    search: {
      provider: 'local'
    }
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
