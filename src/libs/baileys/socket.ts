import {
  makeWASocket as hoshino,
  fetchLatestBaileysVersion,
  DisconnectReason,
  initAuthCreds,
  BufferJSON,
  SignalDataSet
} from 'baileys'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import msg from './handleMessage.js'
import debugMode from '../../debugMode.js'
import loadCommand from '../../modules/loadCommand.js'
const AUTH_FILE = path.resolve('./auth.json')
const QR_FILE = path.resolve('./qr.png')

interface BaileysError extends Error {
  output?: {
    statusCode?: number
  }
}

interface AuthState {
  creds: ReturnType<typeof initAuthCreds>
  keys: { [key: string]: Record<string, any> }
}

function initKeysStructure(): AuthState['keys'] {
  return {
    preKeys: {},
    sessions: {},
    senderKeys: {},
    appStateSyncKeys: {},
    appStateVersions: {},
    senderKeyMemory: {}
  }
}

function loadAuthState(): AuthState {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const raw = fs.readFileSync(AUTH_FILE, 'utf-8')
      const data = JSON.parse(raw, BufferJSON.reviver) as Partial<AuthState>
      return {
        creds: data.creds ?? initAuthCreds(),
        keys: data.keys ?? initKeysStructure()
      }
    }
  } catch (err) {
    console.error('⚠️ Failed to load auth:', err)
  }
  return {
    creds: initAuthCreds(),
    keys: initKeysStructure()
  }
}

function saveAuthState(state: AuthState): void {
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(state, BufferJSON.replacer, 2))
  } catch (err) {
    console.error('❌ Failed to save auth state:', err)
  }
}

async function generateQR(qr: string): Promise<void> {
  if (fs.existsSync(QR_FILE)) fs.unlinkSync(QR_FILE)
  try {
    const termQR = await QRCode.toString(qr, { type: 'terminal', small: true })
    console.log('🔐 Scan QR Code:\n' + termQR)
    await QRCode.toFile(QR_FILE, qr)
    console.log(`💾 QR Code saved to: ${QR_FILE}`)
  } catch (err) {
    console.error('❌ Failed to generate QR code:', err)
  }
}

export default async function waSocket(): Promise<ReturnType<typeof hoshino>> {
  const commands = await loadCommand()
  const { version } = await fetchLatestBaileysVersion()
  let state = loadAuthState()

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
    logger: pino.default({ level: debugMode() ? 'debug' : 'silent' })
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
        fs.existsSync(AUTH_FILE) && fs.unlinkSync(AUTH_FILE)
        fs.existsSync(QR_FILE) && fs.unlinkSync(QR_FILE)
        process.exit(1)
      } else {
        console.log('♻️ Attempting reconnect in 5s...')
        setTimeout(waSocket, 5000)
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ type, messages }) => {
    if (type != 'notify') return
    for (const message of messages) {
      if (!message.pushName) break
      const fetchMessage = msg(message)
      if (debugMode()) console.log(fetchMessage)
      if (fetchMessage?.commands) {
        const cmd = commands.get(fetchMessage.commands.name)
        if (cmd) {
          const result = await cmd.execute({
            key: fetchMessage.key,
            pushName: fetchMessage.pushName!,
            args: fetchMessage.commands.args,
          })
          if (result != null || result != undefined) {
            if (result.type == 'text') sock.sendMessage(fetchMessage.from, { text: toText(result.text) }, { ephemeralExpiration: fetchMessage.expiration ?? undefined, quoted: message })
          }
        }
      }
    }
  })

  return sock
}

function toText(r: unknown): string {
  return typeof r === 'object'
    ? JSON.stringify(r, null, 2)
    : String(r)
}