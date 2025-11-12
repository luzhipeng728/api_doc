import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

// 导入组件
import ApiPlayground from './components/ApiPlayground.vue'
import CodeEditor from './components/CodeEditor.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import NavConfig from './components/NavConfig.vue'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(NavConfig)
    })
  },
  enhanceApp({ app }) {
    // 注册全局组件
    app.component('ApiPlayground', ApiPlayground)
    app.component('CodeEditor', CodeEditor)
    app.component('ConfigPanel', ConfigPanel)
  }
} satisfies Theme
