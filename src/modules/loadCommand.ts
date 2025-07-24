import { WAMessageKey } from 'baileys'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const commandDir = path.resolve(__dirname, '../commands')

export interface CommandContent {
    args?: string[]
    pushName?: string
    key?: WAMessageKey
    sender?: string
}

type CommandResult = { 
    text: string | null,
    type: string | null,
    url: string | null,
    caption: string | null,
 }

export type CommandModule = {
    name: string
    desc?: string
    premium?: boolean
    usage?: string
    execute: (args: any) => Promise<CommandResult>
}

/**
 * Recursively scan `commands/` and dynamically import each .js,
 * returning a map from command.name → CommandModule
 */
export async function loadCommand(): Promise<Map<string, CommandModule>> {
    const commandMap = new Map<string, CommandModule>()

    async function scanDir(dir: string): Promise<void> {
        const entries = fs.readdirSync(dir, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)

            if (entry.isDirectory()) {
                await scanDir(fullPath)
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                // import the JS file and grab its default export
                const fileUrl = pathToFileURL(fullPath).href
                const mod: { default: CommandModule } = await import(fileUrl)
                if (mod.default?.name) {
                    commandMap.set(mod.default.name, mod.default)
                }
            }
        }
    }

    // kick off the recursive scan
    await scanDir(commandDir)
    return commandMap
}