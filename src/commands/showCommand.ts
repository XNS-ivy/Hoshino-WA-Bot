import { loadCommand, CommandContent } from "../modules/loadCommand.js"

export default {
    name: 'menu',
    premium: false,
    execute: async ({ args }: CommandContent) => {
        const commandMap = await loadCommand()

        if (!args || args.length === 0) {
            const lines: string[] = ['*🧪 Hoshino Menu :*']
            for (const [name, cmd] of commandMap.entries()) {
                if (!cmd.desc) continue
                lines.push(`• *${name}* — ${cmd.desc}`)
            }

            return {
                type: 'text',
                text: lines.join('\n'),
            }
        } else {
            const name = args[0].toLowerCase()
            const cmd = commandMap.get(name)

            if (!cmd) {
                return {
                    type: 'text',
                    text: `⚠️ Command *${name}* not found.`,
                }
            }

            const detail = [
                `*🔍 Detail Command: ${cmd.name}*`,
                cmd.desc ? `• *Tooltips:* ${cmd.desc}` : null,
                cmd.usage ? `• *Usage:* ${cmd.usage}` : null,
                `• *Premium:* ${cmd.premium ? 'Yes' : 'No'}`,
            ]
                .filter(Boolean)
                .join('\n')

            return {
                type: 'text',
                text: detail,
            }
        }
    },
}