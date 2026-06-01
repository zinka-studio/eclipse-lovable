import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const ADMIN_FLAG_KEY = 'admin_authed'

export function setAdminAuthed() {
  try {
    sessionStorage.setItem(ADMIN_FLAG_KEY, '1')
  } catch {
    // ignore storage errors
  }
}

export function clearAdminAuthed() {
  try {
    sessionStorage.removeItem(ADMIN_FLAG_KEY)
  } catch {
    // ignore
  }
}

/**
 * Client-side route guard for the admin UI.
 *
 * NOTE: This is a UX guard only — the actual authorization is enforced
 * server-side by the /admin/api/* endpoints (which validate the session
 * cookie). This component just prevents the admin shell from being
 * rendered to unauthenticated visitors.
 */
export default function RequireAdminAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const authed = (() => {
      try {
        return sessionStorage.getItem(ADMIN_FLAG_KEY) === '1'
      } catch {
        return false
      }
    })()

    if (!authed) {
      navigate(`/admin/login?from=${encodeURIComponent(location.pathname)}`, { replace: true })
      return
    }
    if (!cancelled) setReady(true)
    return () => {
      cancelled = true
    }
  }, [navigate, location.pathname])

  if (!ready) return null
  return <>{children}</>
}
