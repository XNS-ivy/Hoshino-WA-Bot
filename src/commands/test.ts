import { CommandContent } from "@modules/loadCommand.js"
import { debugMode } from "@src/loadConfig.js"

export default {
    name: 'test',
    premium: false,
    execute: async ({ key, pushName }: CommandContent) => {
        if(debugMode()) console.log(key)
        return {
            type: 'text',
            text: `Hello ${pushName}`,
        }
    }
}