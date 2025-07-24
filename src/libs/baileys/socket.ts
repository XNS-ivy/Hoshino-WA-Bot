const originalConsoleLog = console.log
console.log = (...args: unknown[]) => {
  const msg = args[0]
  if (typeof msg === 'string' &&
    (msg.includes('Closing open session') ||
      msg.includes('Closing session: SessionEntry'))
  ) return
  originalConsoleLog.apply(console, args as [unknown?, ...unknown[]])
}

import {
  makeWASocket as hoshino,
  fetchLatestBaileysVersion,
  DisconnectReason,
  type SignalDataSet,
  type GroupMetadata
} from 'baileys'
import pino from 'pino'
import NodeCache from 'node-cache'
import msg from '@baileysLibs/handleMessage.js'
import { debugMode, getReadMessage } from '@src/loadConfig.js'
import { loadCommand } from '@modules/loadCommand.js'
import {
  loadAuthState,
  saveAuthState,
  generateQR,
  cleanupAuthFiles,
  type AuthState
} from '@baileysLibs/authState.js'

const groupCache = new NodeCache({ stdTTL: 60 * 10 })

interface BaileysError extends Error {
  output?: { statusCode?: number }
}

export default async function waSocket(): Promise<ReturnType<typeof hoshino>> {
  const commands = await loadCommand()
  const { version } = await fetchLatestBaileysVersion()
  let state: AuthState = loadAuthState()

  const sock = hoshino({
    version,
    auth: {
      creds: state.creds,
      keys: {
        get: async (type, ids) => {
          const data: Record<string, any> = {}
          for (const id of ids) {
            const value = state.keys[type]?.[id]
            if (value) data[id] = value
          }
          return data
        },
        set: async (keyData: SignalDataSet) => {
          for (const [category, data] of Object.entries(keyData)) {
            if (!state.keys[category]) state.keys[category] = {}
            state.keys[category] = {
              ...(state.keys[category] || {}),
              ...data
            }
          }
          saveAuthState(state)
        }
      }
    },
    cachedGroupMetadata: async (jid: string): Promise<GroupMetadata | undefined> => {
      const cached = groupCache.get(jid) as GroupMetadata | undefined
      if (cached) return cached
      const fresh = await sock.groupMetadata(jid)
      groupCache.set(jid, fresh)
      return fresh
    },
    logger: pino.default({ level: debugMode() ? 'debug' : 'silent' }),
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: true,
  })

  sock.ev.on('creds.update', () => {
    state.creds = sock.authState.creds
    saveAuthState(state)
  })

  sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
    if (qr) await generateQR(qr)
    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp as', sock.user?.id ?? 'unknown')
      saveAuthState(state)
    }
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as BaileysError)?.output?.statusCode
      const isLoggedOut = statusCode === DisconnectReason.loggedOut

      console.log('❌ Disconnected:', lastDisconnect?.error?.message)

      if (isLoggedOut) {
        console.log('🚫 Logged out, cleaning up...')
        cleanupAuthFiles()
        process.exit(1)
      } else {
        console.log('♻️ Attempting reconnect in 5s...')
        setTimeout(waSocket, 5000)
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ type, messages }) => {
    if (type !== 'notify') return
    for (const message of messages) {
      if (!message.pushName) continue
      const fetchMessage = msg(message)
      if (getReadMessage()) sock.readMessages([fetchMessage.key])
      if (fetchMessage.key.remoteJid?.endsWith('@g.us')) {
        const jid = fetchMessage.key.remoteJid
        const metadata = await sock.groupMetadata(jid)
        groupCache.set(jid, metadata)
      }
      if (debugMode()) console.log(fetchMessage)
      if (fetchMessage?.commands) {
        const cmd = commands.get(fetchMessage.commands.name)
        if (cmd) {
          const result = await cmd.execute({
            key: fetchMessage.key,
            pushName: fetchMessage.pushName!,
            args: fetchMessage.commands.args,
            sender: fetchMessage.sender,
          })
          if (result != null) {
            if (result.type === 'text') {
              sock.sendMessage(fetchMessage.from, { text: toText(result.text) }, {
                ephemeralExpiration: fetchMessage.expiration ?? undefined,
                quoted: message
              })
            }
            if (result.type === 'image') {
              const imageUrl = result.url
              const caption = result.caption
              if (imageUrl && caption) {
                await sock.sendMessage(fetchMessage.from, {
                  image: { url: imageUrl },
                  caption
                }, {
                  quoted: message,
                  ephemeralExpiration: fetchMessage.expiration ?? undefined
                })
              }
            }
          }
        }
      }
    }
  })

  sock.ev.on('group-participants.update', async (update) => {
    console.log('🔔 Updating metadata for group : ', update.id)
    const metadata = await sock.groupMetadata(update.id)
    groupCache.set(update.id, metadata)
  })

  return sock
}

function toText(r: unknown): string {
  return typeof r === 'object'
    ? JSON.stringify(r, null, 2)
    : String(r)
}