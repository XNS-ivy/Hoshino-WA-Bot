import { CommandContent } from "../modules/loadCommand.js"
import debugMode from "../debugMode.js"

export default {
    name: 'test',
    desc: 'testing',
    premium: false,
    execute: async ({ key, pushName }: CommandContent) => {
        if(debugMode()) console.log(key)
        return {
            type: 'text',
            text: `Hello ${pushName}`,
        }
    }
}