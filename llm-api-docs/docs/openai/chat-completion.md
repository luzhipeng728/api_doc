# Chat Completions API

使用 OpenAI 的 Chat Completions API 进行对话。

## 基本用法

<ApiPlayground
  provider="openai"
  :defaultRequest="{
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }],
    temperature: 0.7,
    max_tokens: 150
  }"
/>

## API 端点

```
POST https://api.openai.com/v1/chat/completions
```

## Python SDK 示例

```python
from openai import OpenAI

client = OpenAI(
    base_url="YOUR_BASE_URL",  # 例如: https://api.openai.com
    api_key="YOUR_API_KEY"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ],
    temperature=0.7,
    max_tokens=150
)

print(response.choices[0].message.content)
```

## cURL 示例

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }'
```

## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | 模型 ID,如 `gpt-4`, `gpt-3.5-turbo` |
| messages | array | 是 | 对话消息数组 |
| temperature | number | 否 | 随机性控制 (0-2),默认 1 |
| max_tokens | integer | 否 | 最大生成 token 数 |
| top_p | number | 否 | 核采样参数 (0-1) |
| n | integer | 否 | 生成多少个回复,默认 1 |
| stream | boolean | 否 | 是否流式返回,默认 false |
| stop | string/array | 否 | 停止序列 |
| presence_penalty | number | 否 | 存在惩罚 (-2.0 到 2.0) |
| frequency_penalty | number | 否 | 频率惩罚 (-2.0 到 2.0) |
| user | string | 否 | 用户标识符 |

## 消息角色

- `system` - 系统提示,设定 AI 的行为
- `user` - 用户消息
- `assistant` - AI 助手的回复
- `tool` - 工具调用的结果 (Function Calling)

## 响应格式

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4-0613",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I assist you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

## 最佳实践

### 1. 使用 System Prompt

通过 system 角色设定 AI 的行为:

```python
messages=[
    {"role": "system", "content": "You are a professional translator."},
    {"role": "user", "content": "Translate 'Hello' to French"}
]
```

### 2. 控制输出长度

使用 `max_tokens` 限制响应长度,避免不必要的 token 消耗:

```python
response = client.chat.completions.create(
    model="gpt-4",
    messages=messages,
    max_tokens=100  # 限制最多 100 tokens
)
```

### 3. 调整温度参数

- `temperature=0`: 确定性输出,适合代码生成、翻译等
- `temperature=0.7-1.0`: 平衡创造性和一致性
- `temperature=1.5-2.0`: 高度创造性,适合创意写作

### 4. 多轮对话

保持对话上下文:

```python
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "My name is Alice."},
    {"role": "assistant", "content": "Nice to meet you, Alice!"},
    {"role": "user", "content": "What's my name?"}
]
```

## 错误处理

### 常见错误

| 错误码 | 说明 | 解决方法 |
|--------|------|---------|
| 401 | 未授权 | 检查 API Key 是否正确 |
| 429 | 请求过多 | 降低请求频率或升级配额 |
| 500 | 服务器错误 | 稍后重试 |
| 503 | 服务不可用 | 稍后重试 |

### Python 错误处理示例

```python
from openai import OpenAI, OpenAIError

client = OpenAI(api_key="YOUR_API_KEY")

try:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": "Hello!"}]
    )
    print(response.choices[0].message.content)
except OpenAIError as e:
    print(f"API Error: {e}")
```

## 下一步

- [流式对话](/openai/chat-completion-streaming) - 实时获取响应
- [工具调用](/openai/function-calling) - 让 AI 调用外部函数
- [查看官方文档](https://platform.openai.com/docs/api-reference/chat)
