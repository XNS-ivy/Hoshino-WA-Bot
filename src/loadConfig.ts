import fs from 'fs'
import path from 'path'

export type ConfigSignal = {
    name: string
    debugLog: boolean
}

export default function loadconfig(): ConfigSignal {
    const configFile = path.resolve('./config.json')
    const raw = fs.readFileSync(configFile, 'utf-8')
    const data = JSON.parse(raw)
    return data
}