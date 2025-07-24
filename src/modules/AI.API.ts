import axios from 'axios'
import { configDotenv } from 'dotenv'
configDotenv()

const API_URL = 'https://openrouter.ai/api/v1/models'
const API_KEY = process.env.ROUTERAI_API

export interface OpenRouterModel {
    id?: string,
    name?: string,
    pricing?: Record<string, any>,
    [key: string]: any,
}

export async function getAIModel(): Promise<OpenRouterModel[] | undefined> {
    try {
        const response: Record<string, any> = await axios.get(API_URL, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'localhost',
                'X-Title': 'Hoshino-WA-Bot',
            }
        })

        const models = response.data.data
        const freeModels = models
            .filter((model: any) => isFreeModel(model.pricing))
            .map((model: any) => ({
                id: model.id,
                name: model.name,
            }))

        return freeModels
    } catch (err: any) {
        console.error('❌ Gagal mendapatkan model:', err.response?.data || err.message)
        return undefined
    }
}

function isFreeModel(pricing: Record<string, any>) {
    if (!pricing || typeof pricing !== 'object') return true
    return Object.values(pricing).every(value => {
        const num = Number(value)
        return !isNaN(num) && num === 0
    })
}