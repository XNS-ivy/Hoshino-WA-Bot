import { CommandContent } from "../modules/loadCommand.js"
import debugMode from "../debugMode.js"
import loadconfig from "../loadConfig.js"
const prefix = loadconfig().prefix

export default {
    name: 'test',
    desc: 'testing',
    premium: false,
    usage: `${prefix}test`,
    execute: async ({ key, pushName }: CommandContent) => {
        if(debugMode()) console.log(key)
        return {
            type: 'text',
            text: `Hello ${pushName}`,
        }
    }
}