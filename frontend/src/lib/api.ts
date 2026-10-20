import { config } from './config'
import { supabase } from './supabase'

interface ApiOptions extends RequestInit {
  authenticated?: boolean
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { authenticated = true, ...requestOptions } = options
  const session = authenticated ? await supabase?.auth.getSession() : null
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('X-Correlation-Id', crypto.randomUUID())
  if (session?.data.session)
    headers.set('Authorization', `Bearer ${session.data.session.access_token}`)
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`${config.gatewayUrl}${path}`, {
      ...requestOptions,
      headers,
      signal: controller.signal,
    })
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string; detail?: string } | null
      throw new Error(
        error?.message ?? error?.detail ??
          (response.status === 401
            ? 'Please sign in to continue.'
            : response.status === 403
              ? 'You do not have access to this resource.'
              : `Request failed (${response.status}). Please try again.`),
      )
    }
    return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>)
  } finally {
    window.clearTimeout(timeout)
  }
}
