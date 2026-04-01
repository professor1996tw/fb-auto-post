import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * POST /api/generate
 * 接收發文設定，呼叫 Claude API 生成 3 種文案版本
 */
export async function POST(req: NextRequest) {
  // 驗證登入狀態
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  const body = await req.json()
  const { purpose, audience, style, product, coreMessage, extraContext, pages } = body

  if (!coreMessage?.trim()) {
    return NextResponse.json({ error: '核心訊息不能為空' }, { status: 400 })
  }

  // 將風格 value 轉換為中文描述
  const STYLE_MAP: Record<string, string> = {
    friendly: '親切活潑（輕鬆口語、有表情符號、讓人感覺親近）',
    professional: '專業正式（措辭嚴謹、建立品牌信賴感、較少表情符號）',
    promotional: '促銷衝動（強調限時優惠、製造急迫感、Call-to-action 明確）',
    storytelling: '故事感（以情境鋪陳帶入、引發共鳴、情感觸動）',
  }

  const styleName = STYLE_MAP[style] || style

  const prompt = `你是日央水原商行（台灣遊戲虛擬商品搬磚公司）的資深社群文案專員。
日央水原主要在台灣透過 Facebook 粉絲專頁銷售遊戲虛擬商品，目標客群為遊戲玩家。

請根據以下資訊，生成 3 種不同角度的 Facebook 貼文文案。

【發文資訊】
- 目標粉絲專頁：${pages?.map((p: any) => p.name).join('、') || '日央水原'}
- 發文目的：${purpose}
- 目標受眾：${audience}
- 商品/活動：${product || '（未指定）'}
- 核心訊息：${coreMessage}
- 補充資訊：${extraContext || '（無）'}
- 文案風格：${styleName}

【生成要求】
1. 每種文案必須完全不同的切入角度和開場白
2. 包含適當的 emoji（不過度堆砌）
3. 長度適中，約 100~250 字
4. 最後可加上簡短 Call-to-action（如：留言詢問、私訊我們、點連結等）
5. 符合台灣繁體中文用語習慣

【輸出格式】
請嚴格用以下 JSON 格式輸出，不要有任何其他文字：

{
  "versions": [
    {
      "id": 1,
      "angle": "版本一的切入角度（10字內）",
      "content": "完整的貼文內容"
    },
    {
      "id": 2,
      "angle": "版本二的切入角度（10字內）",
      "content": "完整的貼文內容"
    },
    {
      "id": 3,
      "angle": "版本三的切入角度（10字內）",
      "content": "完整的貼文內容"
    }
  ]
}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // 解析 Claude 回傳的 JSON
    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // 提取 JSON 部分（防止有額外文字）
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI 回傳格式異常，請重試')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      versions: parsed.versions,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    })
  } catch (err: any) {
    console.error('[/api/generate] Error:', err)

    // API Key 未設定
    if (err.message?.includes('API key')) {
      return NextResponse.json(
        { error: '請在 .env.local 設定 ANTHROPIC_API_KEY' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'AI 生成失敗，請重試' },
      { status: 500 }
    )
  }
}
