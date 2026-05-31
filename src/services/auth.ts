// ============================================================
// Lightweight dashboard auth gate
// ------------------------------------------------------------
// This is an operator console that talks to Supabase with the public anon
// key, so there is no per-user backend auth. To still require a login, we
// validate against a configurable credential and persist a session in
// localStorage. Credentials can be overridden via env:
//   VITE_DASHBOARD_EMAIL, VITE_DASHBOARD_PASSWORD
// For real multi-user security, swap this for Supabase Auth.
// ============================================================

const SESSION_KEY = 'sr_dashboard_session'

const VALID_EMAIL = (import.meta.env.VITE_DASHBOARD_EMAIL || 'admin@sudutruang.com')
  .trim()
  .toLowerCase()
const VALID_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD || 'sudutruang'

export interface Session {
  email: string
  loginAt: string
}

export const authService = {
  /** The default email shown on the login form (for convenience). */
  defaultEmail: VALID_EMAIL,

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

  login(email: string, password: string): { ok: boolean; error?: string } {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      return { ok: false, error: 'Email dan password wajib diisi.' }
    }
    if (normalizedEmail !== VALID_EMAIL || password !== VALID_PASSWORD) {
      return { ok: false, error: 'Email atau password salah.' }
    }
    const session: Session = { email: normalizedEmail, loginAt: new Date().toISOString() }
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      // ignore storage errors (private mode etc.) — session stays in-memory only
    }
    return { ok: true }
  },

  logout() {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  },
}

export default authService
