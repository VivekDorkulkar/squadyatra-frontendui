import { createBrowserClient } from '@supabase/ssr'
import { config } from './config'

const currentUrl = typeof window === 'undefined' ? null : new URL(window.location.href)
export const isSupabaseRecoveryCallback = Boolean(
  currentUrl &&
    currentUrl.pathname.endsWith('/reset-password') &&
    (currentUrl.searchParams.has('code') ||
      currentUrl.searchParams.get('type') === 'recovery' ||
      new URLSearchParams(currentUrl.hash.slice(1)).get('type') === 'recovery'),
)

export const supabase =
  config.supabaseUrl && config.supabaseKey
    ? createBrowserClient(config.supabaseUrl, config.supabaseKey, {
        cookieOptions: {
          path: '/',
          sameSite: 'lax',
          secure: true,
          priority: 'high',
        },
      })
    : null
