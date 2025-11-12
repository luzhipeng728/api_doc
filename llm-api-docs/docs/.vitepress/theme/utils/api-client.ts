/**
 * API 响应类型
 */
export interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  statusCode?: number
}

/**
 * 流式响应块类型
 */
export interface StreamChunk {
  content: string
  timestamp: number
  index: number
}

/**
 * OpenAI 格式的聊天请求
 */
export async function chatCompletion(
  baseUrl: string,
  apiKey: string,
  payload: any,
  streaming: boolean = false
): Promise<ApiResponse | AsyncGenerator<StreamChunk>> {
  const url = `${baseUrl}/v1/chat/completions`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        ...payload,
        stream: streaming
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: errorText || `HTTP ${response.status}`,
        statusCode: response.status
      }
    }

    if (streaming) {
      return streamChatCompletion(response)
    } else {
      const data = await response.json()
      return {
        success: true,
        data
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '请求失败'
    }
  }
}

/**
 * 处理流式响应
 */
async function* streamChatCompletion(response: Response): AsyncGenerator<StreamChunk> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let index = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return

        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content || ''

          if (content) {
            yield {
              content,
              timestamp: Date.now(),
              index: index++
            }
          }
        } catch (e) {
          console.error('解析流式数据失败:', e)
        }
      }
    }
  }
}

/**
 * Claude SDK 格式的消息请求
 */
export async function claudeMessage(
  baseUrl: string,
  apiKey: string,
  payload: any,
  streaming: boolean = false
): Promise<ApiResponse | AsyncGenerator<StreamChunk>> {
  // Claude官方SDK使用方式,这里假设你的代理服务器支持类似接口
  const url = `${baseUrl}/v1/messages`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        ...payload,
        stream: streaming
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: errorText || `HTTP ${response.status}`,
        statusCode: response.status
      }
    }

    if (streaming) {
      return streamClaudeMessage(response)
    } else {
      const data = await response.json()
      return {
        success: true,
        data
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '请求失败'
    }
  }
}

/**
 * 处理 Claude 流式响应
 */
async function* streamClaudeMessage(response: Response): AsyncGenerator<StreamChunk> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let index = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)

        try {
          const json = JSON.parse(data)

          if (json.type === 'content_block_delta') {
            const content = json.delta?.text || ''
            if (content) {
              yield {
                content,
                timestamp: Date.now(),
                index: index++
              }
            }
          }
        } catch (e) {
          console.error('解析 Claude 流式数据失败:', e)
        }
      }
    }
  }
}

/**
 * Gemini SDK 格式的内容生成请求
 */
export async function geminiGenerateContent(
  baseUrl: string,
  apiKey: string,
  payload: any,
  streaming: boolean = false
): Promise<ApiResponse | AsyncGenerator<StreamChunk>> {
  const model = payload.model || 'gemini-2.5-flash'
  const method = streaming ? 'streamGenerateContent' : 'generateContent'
  const url = `${baseUrl}/v1/models/${model}:${method}?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: payload.contents,
        generationConfig: payload.generationConfig
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: errorText || `HTTP ${response.status}`,
        statusCode: response.status
      }
    }

    if (streaming) {
      return streamGeminiContent(response)
    } else {
      const data = await response.json()
      return {
        success: true,
        data
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '请求失败'
    }
  }
}

/**
 * 处理 Gemini 流式响应
 */
async function* streamGeminiContent(response: Response): AsyncGenerator<StreamChunk> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let index = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })

    try {
      const json = JSON.parse(chunk)
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (content) {
        yield {
          content,
          timestamp: Date.now(),
          index: index++
        }
      }
    } catch (e) {
      // Gemini 流式可能返回多个 JSON 对象
      const objects = chunk.split('\n').filter(line => line.trim())
      for (const obj of objects) {
        try {
          const json = JSON.parse(obj)
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (content) {
            yield {
              content,
              timestamp: Date.now(),
              index: index++
            }
          }
        } catch {}
      }
    }
  }
}
