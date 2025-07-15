import type { WAMessage, WAMessageKey } from 'baileys'

/**
 * Structured result of a message
 */
export interface ParsedMessage {
  key: WAMessageKey
  pushName?: string | null | undefined
  type: string
  text: string
  from: string
  isGroup: boolean
  sender: string
  fromMe: boolean
  isMedia: boolean
  mediaData: {
    mimetype: string
    caption: string
    fileLength?: number
    mediaKey?: Uint8Array
    fileSha256?: string
    fileEncSha256?: string
    type: string
  } | null
}

/**
 * Parses a raw WAMessage into a simpler structure
 */

export default function parseMessage(msg: WAMessage): ParsedMessage {
  const { pushName, key, message } = msg
  const denied = ['senderKeyDistributionMessage', 'messageContextInfo']
  const availableTypes = Object.keys(message || {})
  const type = availableTypes.reverse().find(t => !denied.includes(t)) ?? 'unknown'

  let text = ''
  if (type === 'conversation') {
    text = (message as { conversation?: string })?.conversation || ''
  } else if (type === 'extendedTextMessage') {
    const extended = (message as { extendedTextMessage?: { text?: string } })?.extendedTextMessage
    text = extended?.text || ''
  }

  const from = key.remoteJid || ''
  const isGroup = from?.endsWith('@g.us') ?? false
  const sender = isGroup ? key.participant! : from
  const fromMe = key.fromMe ?? false

  const mediaTypes = [
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage'
  ]
  const isMedia = mediaTypes.includes(type)

  let mediaData = null as ParsedMessage['mediaData']
  if (isMedia) {
    const content = (message as any)[type]
    if (content) {
      mediaData = {
        mimetype: content.mimetype || '',
        caption: content.caption || '',
        fileLength: content.fileLength,
        mediaKey: content.mediaKey,
        fileSha256: content.fileSha256?.toString('base64'),
        fileEncSha256: content.fileEncSha256?.toString('base64'),
        type
      }
    }
  }

  return {
    key,
    pushName,
    type,
    text,
    from,
    isGroup,
    sender,
    fromMe,
    isMedia,
    mediaData
  }
}