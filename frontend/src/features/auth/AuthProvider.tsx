import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Role } from '../../domain/models'
import { config } from '../../lib/config'
import { supabase } from '../../lib/supabase'

interface Identity {
  name: string
  role: Role
  agencyId?: string
}
interface AuthState {
  identity: Identity | null
  loading: boolean
  setDemoRole: (role: Role) => void
  signOut: () => Promise<void>
}
const AuthContext = createContext<AuthState | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(
    config.demo ? { name: 'Aarav', role: 'consumer' } : null,
  )
  const [loading, setLoading] = useState(!config.demo)
  useEffect(() => {
    if (config.demo || !supabase) {
      setLoading(false)
      return
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const claimed = session?.user.app_metadata.role
      const role: Role = claimed === 'admin' || claimed === 'agency' ? claimed : 'consumer'
      setIdentity(
        session
          ? {
              name: session.user.email?.split('@')[0] ?? 'Traveler',
              role,
              agencyId: session.user.app_metadata.agency_id,
            }
          : null,
      )
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])
  return (
    <AuthContext.Provider
      value={{
        identity,
        loading,
        setDemoRole: (role) => {
          if (config.demo)
            setIdentity({
              name: 'Aarav',
              role,
              agencyId: role === 'agency' ? 'wanderfolk' : undefined,
            })
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
