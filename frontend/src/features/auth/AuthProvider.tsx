import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Role } from '../../domain/models'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'

interface Identity {
  name: string
  role: Role
  agencyId?: string
}
interface AuthState {
  identity: Identity | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
interface UserProfile {
  supabaseUserId: string
  email: string
}

async function verifyAccount(session: Session): Promise<Identity> {
  if (!session.user.email_confirmed_at) {
    throw new Error('Confirm your email with Supabase before signing in.')
  }
  const profile = await api<UserProfile>('/api/users/me')
  const email = session.user.email
  if (!email || profile.supabaseUserId !== session.user.id || profile.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('This Supabase identity is not linked to an active SquadYatra account.')
  }
  const claimed = session.user.app_metadata.role
  const role: Role = claimed === 'admin' || claimed === 'agency' ? claimed : 'consumer'
  return {
    name: String(session.user.user_metadata.full_name ?? email.split('@')[0] ?? 'Traveler'),
    role,
    agencyId: session.user.app_metadata.agency_id,
  }
}

const AuthContext = createContext<AuthState | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }
    let active = true
    let sequence = 0
    const applySession = async (session: Session | null) => {
      const current = ++sequence
      if (!session) {
        if (active) {
          setIdentity(null)
          setLoading(false)
        }
        return
      }
      if (active) setLoading(true)
      try {
        const nextIdentity = await verifyAccount(session)
        if (active && current === sequence) setIdentity(nextIdentity)
      } catch {
        if (active && current === sequence) {
          setIdentity(null)
          await client.auth.signOut()
        }
      } finally {
        if (active && current === sequence) setLoading(false)
      }
    }
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void applySession(session), 0)
    })
    return () => {
      active = false
      sequence += 1
      subscription.unsubscribe()
    }
  }, [])
  return (
    <AuthContext.Provider
      value={{
        identity,
        loading,
        signIn: async (email, password) => {
          if (!supabase) throw new Error('Supabase is not configured. Please contact support.')
          setIdentity(null)
          setLoading(true)
          try {
            const tokens = await api<{ accessToken: string; refreshToken: string }>('/api/users/login', {
              method: 'POST',
              authenticated: false,
              body: JSON.stringify({ email, password }),
            })
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
            })
            if (setSessionError) throw setSessionError
            const { data, error: sessionError } = await supabase.auth.getSession()
            const session = data.session
            if (
              sessionError || !session || session.access_token !== tokens.accessToken
              || session.refresh_token !== tokens.refreshToken || !session.user.email_confirmed_at
            ) {
              throw new Error('Could not confirm the saved browser session. Please sign in again.')
            }
            const nextIdentity = await verifyAccount(session)
            setIdentity(nextIdentity)
          } catch (error) {
            await supabase.auth.signOut()
            setIdentity(null)
            throw error
          } finally {
            setLoading(false)
          }
        },
        signOut: async () => {
          await supabase?.auth.signOut()
          setIdentity(null)
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is missing')
  return value
}
