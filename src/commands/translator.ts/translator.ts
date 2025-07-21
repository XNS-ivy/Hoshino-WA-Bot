import {
    translateLanguage,
    getLanguage,
    findLanguage,
    isValidLanguageCode,
} from "../../libs/translate/translate.js"

import { languages } from "google-translate-api-x"
import { getPrefix } from "../../loadConfig.js"
import { CommandContent } from "modules/loadCommand.js"

export default {
    name: 'translate',
    desc: 'Translate your language automatically to another language by language code or show specific language support',
    usage: `${getPrefix()}translate id I love Hoshino\n` +
           `${getPrefix()}translate languages\n` +
           `${getPrefix()}translate find <language name>`,
    
    execute: async ({ args }: CommandContent) => {
        if (!args || args.length === 0) {
            return {
                type: 'text',
                text: `⚠️ Incorrect format.\n\nUsage:\n${getPrefix()}translate id I love Hoshino\n${getPrefix()}translate languages\n${getPrefix()}translate find <language name>`
            }
        }

        const [cmd, ...rest] = args

        // 🔍 Show all supported languages
        if (cmd === 'languages') {
            const list = Object.entries(languages)
                .map(([code, name]) => `• ${code} - ${name}`)
                .join('\n')
            return {
                type: 'text',
                text: `🌐 *Supported Languages:*\n\n${list}`
            }
        }

        // 🔍 Find code by language name
        if (cmd === 'find') {
            if (!rest.length) {
                return {
                    type: 'text',
                    text: `⚠️ Please provide a language name. Example:\n${getPrefix()}translate find Indonesian`
                }
            }
        
            const langName = rest.join(' ')
            const result = await findLanguage(langName)
        
            if (!result) {
                return {
                    type: 'text',
                    text: `❌ Language containing *"${langName}"* was not found.`
                }
            }
        
            return {
                type: 'text',
                text: `✅ Closest Match Found:\n\n• Name: *${result.name}*\n• Code: *${result.code}*`
            }
        }

        // 🌐 Translate
        if (args.length >= 2) {
            const targetLang = cmd.toLowerCase()
            const originalText = rest.join(' ')

            if (!isValidLanguageCode(targetLang)) {
                return {
                    type: 'text',
                    text: `❌ Language code "${targetLang}" is not supported.\nUse "${getPrefix()}translate languages" to see supported codes.`
                }
            }

            const res = await translateLanguage(originalText, targetLang)

            if (!res || !res.text || res.text.startsWith("Error on translator:")) {
                return {
                    type: 'text',
                    text: `❌ Failed to translate: ${res.text ?? 'Unknown error.'}`
                }
            }

            const fromLang = await getLanguage(res.from ?? '') || 'Unknown'
            const toLang = await getLanguage(res.to ?? '') || 'Unknown'

            const body =
                `🌐 *Translated*\n` +
                `• From: ${fromLang} (${res.from?.toUpperCase()})\n` +
                `• To: ${toLang} (${res.to?.toUpperCase()})\n` +
                `• Original: ${originalText}\n\n` +
                `📝 *Result:*\n${res.text}`

            return {
                type: 'text',
                text: body
            }
        }

        // 📛 Fallback
        return {
            type: 'text',
            text: `⚠️ Invalid input.\nUsage:\n${getPrefix()}translate id I love Hoshino\n${getPrefix()}translate languages\n${getPrefix()}translate find <language name>`
        }
    }
}