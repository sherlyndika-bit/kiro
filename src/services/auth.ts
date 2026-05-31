// ============================================================
// Dashboard auth gate + account management
// ------------------------------------------------------------
// This is an operator console that talks to Supabase with the public anon
// key, so there is no per-user backend auth. To still require a login we
// validate against configurable credentials and persist a session in
// localStorage.
//
// Credential resolution order (email + password):
//   1. Override stored in Supabase `ai_config` (dashboard_email /
//      dashboard_password_hash) — set from Settings > Akun (shared across
//      devices). Password is stored as a SHA-256 hash, never plaintext.
//   2. Env: VITE_DASHBOARD_EMAIL / VITE_DASHBOARD_PASSWORD
//   3. Built-in defaults below.
//
// NOTE: This is a soft gate suitable for a single-operator console. For real
// multi-user security, migrate to Supabase Auth.
// ============================================================

import { supabase } from './supabaseClient'

const SESSION_KEY = 'sr_dashboard_session'

const ENV_EMAIL = (import.meta.env.VITE_DASHBOARD_EMAIL || 'sudutruang.sra@gmail.com')
  .trim()
  .toLowerCase()
const ENV_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD || 'Sudutruang2026.'

export interface Session {
  email: string
  loginAt: string
}

interface Result {
  ok: boolean
  error?: string
}

/** SHA-256 hex digest, or null when Web Crypto is unavailable (insecure context). */
async function sha256Hex(text: string): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) return null
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null
  }
}

interface Overrides {
  email?: string
  passwordHash?: string
}

async function fetchOverrides(): Promise<Overrides> {
  try {
    const { data } = await supabase
      .from('ai_config')
      .select('key, value')
      .in('key', ['dashboard_email', 'dashboard_password_hash'])
    const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]))
    return {
      email: map.dashboard_email || undefined,
      passwordHash: map.dashboard_password_hash || undefined,
    }
  } catch {
    return {}
  }
}

function persist(email: string) {
  const session: Session = { email, loginAt: new Date().toISOString() }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore storage errors (private mode etc.)
  }
}

async function verifyPassword(password: string, override: Overrides): Promise<boolean> {
  if (override.passwordHash) {
    const h = await sha256Hex(password)
    // If hashing is unavailable, fall back to the env/default password so the
    // operator is never locked out on an insecure context.
    if (h) return h === override.passwordHash
    return password === ENV_PASSWORD
  }
  return password === ENV_PASSWORD
}

export const authService = {
  /** The email shown on the login form by default. */
  defaultEmail: ENV_EMAIL,

  /** True when password changes are possible (Web Crypto available). */
  canManagePassword(): boolean {
    return !!globalThis.crypto?.subtle && globalThis.isSecureContext !== false
  },

  getSession(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Session
      return parsed && typeof parsed.email === 'string' ? parsed : null
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return this.getSession() !== null
  },

  async login(email: string, password: string): Promise<Result> {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      return { ok: false, error: 'Email dan password wajib diisi.' }
    }
    const override = await fetchOverrides()
    const validEmail = (override.email || ENV_EMAIL).trim().toLowerCase()
    if (normalizedEmail !== validEmail) {
      return { ok: false, error: 'Email atau password salah.' }
    }
    const passwordOk = await verifyPassword(password, override)
    if (!passwordOk) {
      return { ok: false, error: 'Email atau password salah.' }
    }
    persist(validEmail)
    return { ok: true }
  },

  logout() {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  },

  /** Change the dashboard password. Stores a SHA-256 hash in ai_config. */
  async changePassword(currentPassword: string, newPassword: string): Promise<Result> {
    const override = await fetchOverrides()
    const currentOk = await verifyPassword(currentPassword, override)
    if (!currentOk) {
      return { ok: false, error: 'Password saat ini salah.' }
    }
    if (newPassword.length < 6) {
      return { ok: false, error: 'Password baru minimal 6 karakter.' }
    }
    const newHash = await sha256Hex(newPassword)
    if (!newHash) {
      return {
        ok: false,
        error: 'Ubah password butuh koneksi aman (https atau localhost).',
      }
    }
    const { error } = await supabase
      .from('ai_config')
      .upsert({ key: 'dashboard_password_hash', value: newHash, updated_at: new Date().toISOString() })
    if (error) {
      return { ok: false, error: 'Gagal menyimpan ke server. Coba lagi.' }
    }
    return { ok: true }
  },
}

export default authService
