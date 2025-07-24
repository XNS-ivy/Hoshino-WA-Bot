import axios from 'axios'
import { configDotenv } from 'dotenv'
configDotenv()

export interface AIReturnType {
  text: string
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
      role: string
    }
  }[]
}

export async function chatWithAI(
  model: string | null,
  inputText: string
): Promise<AIReturnType> {
  const API_KEY = process.env.ROUTERAI_API
  if (!API_KEY) {
    throw new Error('❌ ROUTERAI_API key is not set in .env')
  }

  const modelName = model ?? 'openrouter/auto'
  const url = 'https://openrouter.ai/api/v1/chat/completions'

  try {
    const response = await axios.post(
      url,
      {
        model: modelName,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: inputText },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': 'localhost',
          'X-Title': 'Hoshino-WA-Bot',
        },
      }
    )
    const data = response.data as OpenRouterResponse
    const text = data.choices?.[0]?.message?.content
    if (!text || typeof text !== 'string') {
      throw new Error('[ERROR] No response text from AI')
    }

    return { text }
  } catch (err: any) {
    const status = err.response?.status ?? '???'
    const message =
      err.response?.data?.error?.message ??
      err.response?.data?.message ??
      err.message
    console.error(`❌ AI Error [${status}]:`, message)
    throw new Error(`AI Error ${status}: ${message}`)
  }
}