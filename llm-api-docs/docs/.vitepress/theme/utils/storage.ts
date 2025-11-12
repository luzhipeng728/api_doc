/**
 * API 配置接口
 */
export interface ApiConfig {
  baseUrl: string
  apiKey: string
  provider: 'openai' | 'claude' | 'gemini'
  lastUpdated?: number
}

/**
 * LocalStorage 封装工具
 */
export const storage = {
  /**
   * 保存配置
   */
  save(key: string, value: ApiConfig): void {
    try {
      const data = {
        ...value,
        lastUpdated: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  },

  /**
   * 加载配置
   */
  load(key: string): ApiConfig | null {
    try {
      const data = localStorage.getItem(key)
      if (!data) return null

      const config = JSON.parse(data) as ApiConfig
      return config
    } catch (error) {
      console.error('加载配置失败:', error)
      return null
    }
  },

  /**
   * 删除配置
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除配置失败:', error)
    }
  },

  /**
   * 清空所有配置
   */
  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('清空配置失败:', error)
    }
  },

  /**
   * API Key 混淆 (简单编码,非加密)
   */
  obfuscate(key: string): string {
    try {
      return btoa(key).split('').reverse().join('')
    } catch (error) {
      return key
    }
  },

  /**
   * API Key 解混淆
   */
  deobfuscate(obscured: string): string {
    try {
      return atob(obscured.split('').reverse().join(''))
    } catch (error) {
      return obscured
    }
  }
}
