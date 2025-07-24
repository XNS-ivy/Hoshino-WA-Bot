import { getAIModel } from '@modules/AI.API.js'
import { CommandContent } from "@src/modules/loadCommand.js"
import { getPrefix } from "@src/loadConfig.js"
import { chatWithAI } from "@openaiLibs/openRouterAI.js"


export default {
    name: 'ai',
    desc: '',
    usage: `${getPrefix()}ai <chat>\n` +
        `${getPrefix()}ai register\n` +
        `${getPrefix()}ai models\n` +
        `${getPrefix()}ai change <ai model>\n`,
    premium: false,
    execute: async ({ args = [], sender }: CommandContent) => {
        const registeredUserModels = null
        let outputText
        const userId = sender
        const isMenu = args[0] == 'register' ? 'dummyImportFunction()' :
            args[0] == 'models' ? 'models' :
                args[0] == 'change' ? 'dummyImportFunction()' : 'text'
        if (isMenu == 'text') {
            outputText = await chatWithAI(registeredUserModels, args?.join(' '))
            return {
                type: 'text',
                text: outputText.text,
            }
        } if (isMenu === 'models') {
            outputText = await getAIModel()
            if (outputText) {
                let message = '📋 Available AI Models:\n\n'
                for (const model of outputText) {
                    const { id, name } = model
                    message += `🧠 Name: ${name}\n🆔 ID: ${id}\n\n`
                }

                return {
                    type: 'text',
                    text: message.trim(),
                }
            }
        }
    }
}