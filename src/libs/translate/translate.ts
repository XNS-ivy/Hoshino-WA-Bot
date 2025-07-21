import { translate, languages } from "google-translate-api-x"
export type translateSignal = {
    from?: string,
    to?: string,
    text?: string,
}
export async function translateLanguage(text: string, to: string): Promise<translateSignal> {
    try {
        const res = await translate(text, { to: to })
        return {
            from: res.from.language.iso,
            to: to,
            text: res.text,
        }
    } catch (error) {
        return { text: `Error on translator: this cause because of wrong country code input or something else.`}
    }
}

export async function getLanguage(code: string): Promise<string | undefined> {
    return languages[code as keyof typeof languages] ?? undefined
}

export async function findLanguage(name: string): Promise<{ code: string, name: string } | undefined> {
    name = name.toLowerCase()

    const perfect = Object.entries(languages).find(([_, lang]) =>
        lang.toLowerCase() === name
    )
    if (perfect) return { code: perfect[0], name: perfect[1] }

    const partial = Object.entries(languages).find(([_, lang]) =>
        lang.toLowerCase().includes(name)
    )
    if (partial) return { code: partial[0], name: partial[1] }

    return undefined
}

export function isValidLanguageCode(code: string): boolean {
    return Object.keys(languages).includes(code)
}