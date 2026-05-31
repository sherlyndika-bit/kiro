// ============================================================
// Notification side-effects: sound + browser notifications
// ------------------------------------------------------------
// Sound is synthesized with the Web Audio API (no asset needed). Browsers
// require a user gesture before audio can play, so call primeAudio() once on
// the first interaction (e.g., after login) to unlock the AudioContext.
// ============================================================

let audioCtx: AudioContext | null = null

type AudioCtor = typeof AudioContext

function getAudioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null
  return window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext || null
}

/** Create/resume the AudioContext. Safe to call from a user gesture handler. */
export function primeAudio() {
  try {
    if (!audioCtx) {
      const Ctor = getAudioCtor()
      if (!Ctor) return
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {
    // ignore
  }
}

/** Play a short two-tone notification chime. */
export function playNotificationSound() {
  try {
    primeAudio()
    if (!audioCtx) return
    const t = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.setValueAtTime(1180, t + 0.12)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    osc.start(t)
    osc.stop(t + 0.47)
  } catch {
    // ignore (autoplay blocked etc.)
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return 'denied'
  try {
    return Notification.permission
  } catch {
    return 'denied'
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  try {
    if (Notification.permission === 'default') {
      return await Notification.requestPermission()
    }
    return Notification.permission
  } catch {
    return 'denied'
  }
}

/** Show an OS-level notification when permitted (best when the tab is hidden). */
export function showBrowserNotification(title: string, body: string) {
  try {
    if (notificationsSupported() && Notification.permission === 'granted') {
      new Notification(title, { body, tag: 'sudut-ruang-chat' })
    }
  } catch {
    // ignore
  }
}
