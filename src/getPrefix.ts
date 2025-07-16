import loadconfig from "./loadConfig.js"

export default function getPrefix(): string {
    return loadconfig().prefix
}