const AUTH_SESSION_KEY = 'pos_auth_session'

export function loadAuthSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const user = parsed.user && typeof parsed.user === 'object' ? parsed.user : null

    if (user === null) {
      return null
    }

    return { user }
  } catch {
    return null
  }
}

export function saveAuthSession(user) {
  window.localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      user,
    }),
  )
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_KEY)
}
