import loadconfig from "./loadConfig.js"

export default function debugMode(): boolean {
    return loadconfig().debugLog
}