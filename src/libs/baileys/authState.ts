import fs from 'fs'
import path from 'path'
import { initAuthCreds, BufferJSON } from 'baileys'
import QRCode from 'qrcode'

const AUTH_FILE = path.resolve('./auth.json')
const QR_FILE = path.resolve('./qr.png')

export interface AuthState {
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

export function loadAuthState(): AuthState {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const raw = fs.readFileSync(AUTH_FILE, 'utf-8')
      const data = JSON.parse(raw, BufferJSON.reviver) as Partial<AuthState>
      if (data.keys?.appStateSyncKeys) {
        console.log('🧹 Cleaning appStateSyncKeys to avoid message backlog sync')
        delete data.keys.appStateSyncKeys
      }
      if (data.keys?.appStateVersions) {
        console.log('🧽 Cleaning appStateVersions as well')
        delete data.keys.appStateVersions
      }
      return {
        creds: data.creds ?? initAuthCreds(),
        keys: {
          ...initKeysStructure(),
          ...data.keys
        }
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

export function saveAuthState(state: AuthState): void {
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(state, BufferJSON.replacer, 2))
  } catch (err) {
    console.error('❌ Failed to save auth state:', err)
  }
}

export async function generateQR(qr: string): Promise<void> {
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

export function cleanupAuthFiles(): void {
  fs.existsSync(AUTH_FILE) && fs.unlinkSync(AUTH_FILE)
  fs.existsSync(QR_FILE) && fs.unlinkSync(QR_FILE)
}
