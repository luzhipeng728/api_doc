# Gemini 2.5 Flash Image

Gemini 2.5 Flash Image (别名: Nano Banana) 是 Google 最先进的原生图像生成模型,支持文生图和图像编辑功能。

## 特点

- ✅ **State-of-the-Art** - 图像生成和编辑领域的最强模型
- ✅ **主体一致性** - 在多张图片中保持角色和主体的一致性
- ✅ **会话式生成** - 通过自然语言对话生成和编辑图像
- ✅ **高质量输出** - 更丰富、更动态的视觉效果

## 模型信息

- **模型 ID**: `gemini-2.5-flash-image` 或 `nano-banana`
- **发布日期**: 2025年8月
- **输入**: 文本提示词 + 可选图像
- **输出**: 图像 + 文本说明

## Python SDK 示例

### 基础文生图

```python
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")

# 生成图像
response = client.models.generate_content(
    model="gemini-2.0-flash-exp-image-generation",
    contents="Create a 3D rendered image of a cat wearing a wizard hat, casting a spell in a magical forest",
    config=types.GenerateContentConfig(
        response_modalities=["Text", "Image"]
    )
)

# 保存生成的图像
for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = Image.open(BytesIO(part.inline_data.data))
        image.save("generated_image.png")
        image.show()
```

### 图像编辑 (Image-to-Image)

```python
import base64

# 读取原始图像
with open("original.jpg", "rb") as f:
    image_bytes = f.read()
    image_b64 = base64.b64encode(image_bytes).decode()

# 编辑图像
response = client.models.generate_content(
    model="gemini-2.0-flash-exp-image-generation",
    contents=[
        "Replace the background with a starry night sky",
        types.Part(inline_data=types.Blob(
            mime_type="image/jpeg",
            data=base64.b64decode(image_b64)
        ))
    ],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"]
    )
)

# 保存编辑后的图像
for part in response.candidates[0].content.parts:
    if part.inline_data is not None:
        image = Image.open(BytesIO(part.inline_data.data))
        image.save("edited_image.png")
```

## cURL 示例

### 文生图

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Create a photorealistic image of a futuristic cityscape at sunset"
      }]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"]
    }
  }' | jq -r '.candidates[].content.parts[] | select(.inlineData) | .inlineData.data' | base64 --decode > generated.png
```

### 图生图 (背景替换)

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [
        {"text": "Replace the background with a starry night sky"},
        {"inline_data": {"mime_type":"image/jpeg", "data": "'$(base64 -w 0 original.jpg)'"}}
      ]
    }],
    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
  }' | jq -r '.candidates[].content.parts[] | select(.inlineData) | .inlineData.data' | base64 --decode > edited.png
```

## 配置参数

### GenerateContentConfig

| 参数 | 类型 | 说明 |
|------|------|------|
| response_modalities | array | 响应类型,如 `["TEXT", "IMAGE"]` |
| temperature | number | 创造性控制 (0-2),默认 1.0 |
| candidate_count | integer | 生成候选数量,默认 1 |

### 提示词最佳实践

#### 1. 详细描述

✅ 好的提示词:
```
"A photorealistic portrait of a young woman with curly red hair,
wearing a blue dress, standing in a sunlit garden with blooming roses,
soft focus background, golden hour lighting, professional photography"
```

❌ 不够详细:
```
"A woman in a garden"
```

#### 2. 指定风格

```python
# 3D 渲染风格
"A 3D rendered scene of..."

# 照片写实
"A photorealistic image of..."

# 艺术风格
"An oil painting in the style of Van Gogh showing..."

# 动漫风格
"An anime-style illustration of..."
```

#### 3. 控制构图

```python
"A close-up portrait of..."
"A wide-angle shot showing..."
"A bird's eye view of..."
"From a low angle looking up at..."
```

## 高级用法

### 保持主体一致性

Gemini 2.5 Flash Image 可以在多张图片中保持同一角色的一致性:

```python
# 第一张图片:定义角色
response1 = client.models.generate_content(
    model="gemini-2.0-flash-exp-image-generation",
    contents="Create a character: a young wizard with blue robes and a pointy hat",
    config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
)

# 保存角色描述
character_description = response1.candidates[0].content.parts[0].text

# 第二张图片:使用相同角色
response2 = client.models.generate_content(
    model="gemini-2.0-flash-exp-image-generation",
    contents=f"{character_description}, now standing in a library reading a spell book",
    config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
)
```

### 图像编辑工作流

```python
# 1. 生成初始图像
initial = client.models.generate_content(
    model="gemini-2.0-flash-exp-image-generation",
    contents="A modern office interior with large windows",
    config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
)

# 2. 提取生成的图像
initial_image_data = initial.candidates[0].content.parts[1].inline_data.data

# 3. 基于初始图像进行编辑
edited = client.models.generate_content(
    model="gemini-2.0-flash-exp-image-generation",
    contents=[
        "Add plants and modern furniture to this office",
        types.Part(inline_data=types.Blob(
            mime_type="image/png",
            data=initial_image_data
        ))
    ],
    config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
)
```

## 与 Imagen 3 的区别

| 特性 | Gemini 2.5 Flash Image | Imagen 3 |
|------|----------------------|----------|
| 会话式生成 | ✅ 支持 | ❌ 不支持 |
| 图像编辑 | ✅ 原生支持 | ⚠️ 有限支持 |
| 文本理解 | ✅ 强大的自然语言理解 | ⚠️ 基础理解 |
| 生成速度 | 🚀 更快 | ⚠️ 较慢 |
| API 集成 | 统一 Gemini API | 独立 Imagen API |

## 应用场景

### 1. 产品设计可视化

```python
"Generate a product mockup of a modern smartwatch with a sleek
design, metallic finish, displayed from multiple angles"
```

### 2. 角色设计

```python
"Create a character sheet showing a cyberpunk detective with
neon-lit clothing, multiple facial expressions and poses"
```

### 3. 建筑可视化

```python
"Render an architectural visualization of a modern eco-friendly
house with solar panels, surrounded by trees, sunset lighting"
```

### 4. 广告素材

```python
"Design an advertisement image for a coffee brand, showing a
steaming cup on a wooden table with morning sunlight"
```

## 限制和注意事项

1. **人物生成**: 默认允许成年人物,欧洲/MENA 地区有额外限制
2. **图像尺寸**: 生成的图像有默认尺寸限制
3. **内容政策**: 遵守 [Google 的使用政策](https://policies.google.com/terms/generative-ai)
4. **请求频率**: 注意 API 配额限制

## 错误处理

```python
try:
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp-image-generation",
        contents="Generate an image...",
        config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
    )
except Exception as e:
    print(f"Error: {e}")
```

## 定价

查看 [Gemini API 定价页面](https://ai.google.dev/pricing)

## 相关资源

- [Gemini 2.5 Flash Image 官方公告](https://developers.googleblog.com/en/introducing-gemini-25-flash-image)
- [Imagen 3 文档](/gemini/imagen-3)
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs/image-generation)
- [交互式示例](https://aistudio.google.com/models/gemini-2-5-flash-image)

## 下一步

- [测试 Imagen 3](/gemini/imagen-3) - 专业图像生成模型
- [Gemini 2.5 Pro](/gemini/gemini-2-5-pro) - 文本生成
- [流式响应](/gemini/streaming) - 实时生成
