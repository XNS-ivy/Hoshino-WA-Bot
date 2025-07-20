import fs from 'fs'
import path from 'path'

export type ConfigSignal = {
    name: string,
    debugLog: boolean,
    prefix: string,
    readMessage: boolean,
}

function loadconfig(): ConfigSignal {
    const configFile = path.resolve('./config.json')
    const raw = fs.readFileSync(configFile, 'utf-8')
    const data = JSON.parse(raw)
    return data
}

export function debugMode(): boolean {
    return loadconfig().debugLog
}

export function getPrefix(): string {
    return loadconfig().prefix
}

export function getReadMessage(): boolean {
    return loadconfig().readMessage
}