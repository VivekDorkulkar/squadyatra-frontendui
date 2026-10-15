import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LogOut, Mountain, ShieldCheck } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthProvider'
import { supabase } from '../../lib/supabase'
import { config } from '../../lib/config'

export function LoginPage() {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setError(
        'Supabase is not configured. Add the public Supabase URL and publishable key to your environment.',
      )
      return
    }
    setPending(true)
    setError('')
    try {
      const form = new FormData(event.currentTarget)
      const result = await supabase.auth.signInWithPassword({
        email: String(form.get('email')),
        password: String(form.get('password')),
      })
      if (result.error) throw result.error
      navigate('/', { replace: true })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Sign-in failed. Please try again.')
    } finally {
      setPending(false)
    }
  }
  return (
    <main className="login-page">
      <div className="login-brand">
        <Mountain size={30} />
        SquadYatra
      </div>
      <form className="login-form form-stack" onSubmit={submit}>
        <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h1>Welcome back, wanderer.</h1>
        <p className="muted">A good trip. A great squad. A little closer.</p>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={6}
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={pending}>
          {pending ? 'Signing in...' : 'Sign in'}
          <ArrowRight size={17} />
        </button>
        <p className="muted">
          Account registration and password recovery are managed through your Supabase Auth
          configuration.
        </p>
      </form>
    </main>
  )
}
export function ProfilePage() {
  const { identity, signOut } = useAuth()
  const client = useQueryClient()
  const navigate = useNavigate()
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE PERSON BEHIND THE PLANS</p>
          <h1>Your travel corner.</h1>
          <p>Account details and the privacy that travels with you.</p>
        </div>
      </div>
      <section className="account-section">
        <span className="profile-avatar large">{identity?.name.slice(0, 1).toUpperCase()}</span>
        <h2>{identity?.name}</h2>
        <p className="pill">{identity?.role}</p>
        <div className="info-note">
          <ShieldCheck size={21} />
          <span>
            Discovery is off unless you opt in on a specific departure. Your contact details,
            identity documents, and payment information are not visible to squads.
          </span>
        </div>
        <Link className="button outline" to="/squads">
          <ArrowLeft size={16} />
          Back to my squads
        </Link>
        {!config.demo && (
          <button
            className="button outline"
            onClick={async () => {
              await signOut()
              client.clear()
              navigate('/login')
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        )}
      </section>
    </div>
  )
}
