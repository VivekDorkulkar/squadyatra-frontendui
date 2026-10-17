import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LogOut, Mail, Mountain, ShieldCheck } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthProvider'
import { isSupabaseRecoveryCallback, supabase } from '../../lib/supabase'
import { config } from '../../lib/config'

function AuthPage({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const { signInDemo } = useAuth()
  const navigate = useNavigate()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (config.demo) {
      signInDemo(String(form.get(signup ? 'name' : 'email')))
      navigate('/', { replace: true })
      return
    }
    if (!supabase) {
      setError(
        'Supabase is not configured. Add the public Supabase URL and publishable key to your environment.',
      )
      return
    }
    setPending(true)
    setError('')
    setNotice('')
    try {
      const email = String(form.get('email'))
      const password = String(form.get('password'))
      const result = signup
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: String(form.get('name')) } },
          })
        : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      if (signup) {
        const user = result.data.user
        if (!user?.id) {
          throw new Error('Supabase did not confirm account creation. Please try again.')
        }
        if (user.identities?.length === 0) {
          setNotice('Supabase did not confirm a new account. Check your email or try signing in.')
          return
        }
        if (!result.data.session) {
          setNotice('Your account was created in Supabase. Check your email for a confirmation link.')
          return
        }
      }
      navigate('/', { replace: true })
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : `Could not ${signup ? 'create your account' : 'sign in'}. Please try again.`,
      )
    } finally {
      setPending(false)
    }
  }
  async function continueWithGoogle() {
    if (config.demo || !supabase) {
      setError(
        config.demo
          ? 'Google sign-in is available when demo mode is disabled and Supabase is configured.'
          : 'Supabase is not configured. Add the public Supabase URL and publishable key to your environment.',
      )
      return
    }
    setPending(true)
    setError('')
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (oauthError) throw oauthError
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Google sign-in failed. Please try again.')
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
        <h1>{signup ? 'Find your people out there.' : 'Welcome back, wanderer.'}</h1>
        <p className="muted">
          {config.demo
            ? 'Demo mode is on. Enter any username and password to continue.'
            : signup
              ? 'Create an account and start planning your next journey.'
              : 'A good trip. A great squad. A little closer.'}
        </p>
        {!config.demo && (
          <>
            <button className="button outline auth-google" type="button" disabled={pending} onClick={continueWithGoogle}>
              <Mail size={17} />
              Continue with Google
            </button>
            <div className="auth-divider"><span>or continue with email</span></div>
          </>
        )}
        {signup && (
          <label>
            Full name
            <input name="name" type="text" autoComplete="name" required placeholder="Your name" />
          </label>
        )}
        <label>
          {config.demo ? 'Username' : 'Email address'}
          <input
            name="email"
            type={config.demo ? 'text' : 'email'}
            autoComplete={config.demo ? 'username' : 'email'}
            required
            placeholder={config.demo ? 'Choose a username' : 'you@example.com'}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={config.demo ? undefined : 6}
            required
          />
        </label>
        {!signup && !config.demo && (
          <Link className="auth-forgot" to="/forgot-password">
            Forgot password?
          </Link>
        )}
        {notice && (
          <p className="auth-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={pending}>
          {pending ? (signup ? 'Creating account...' : 'Signing in...') : signup ? 'Create account' : 'Sign in'}
          <ArrowRight size={17} />
        </button>
        <p className="muted auth-switch">
          {signup ? 'Already have an account? ' : 'New to SquadYatra? '}
          <Link to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</Link>
        </p>
      </form>
    </main>
  )
}
export function LoginPage() {
  return <AuthPage />
}
export function SignupPage() {
  return <AuthPage signup />
}
export function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (config.demo || !supabase) {
      setError('Password recovery requires demo mode to be disabled and Supabase to be configured.')
      return
    }
    setPending(true)
    setError('')
    setNotice('')
    try {
      const form = new FormData(event.currentTarget)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        String(form.get('email')),
        { redirectTo: `${window.location.origin}/reset-password` },
      )
      if (resetError) throw resetError
      setNotice('If an account exists for that email, password reset instructions have been sent.')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not request a password reset.')
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
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Reset your password.</h1>
        <p className="muted">Enter the email address associated with your account.</p>
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={pending}>
          {pending ? 'Sending...' : 'Send reset link'}
          <ArrowRight size={17} />
        </button>
        <p className="muted auth-switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </main>
  )
}
export function ResetPasswordPage() {
  const [checking, setChecking] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (config.demo || !supabase) {
      setError('Password recovery requires demo mode to be disabled and Supabase to be configured.')
      setChecking(false)
      return
    }
    let active = true
    let recoveryDetected = false
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const callbackError =
      params.get('error_description') ??
      hashParams.get('error_description') ??
      params.get('error') ??
      hashParams.get('error')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (
        session &&
        (event === 'PASSWORD_RECOVERY' ||
          (event === 'INITIAL_SESSION' && isSupabaseRecoveryCallback))
      ) {
        recoveryDetected = true
        setSessionReady(true)
        setError('')
        setChecking(false)
      } else if (event === 'INITIAL_SESSION' && !recoveryDetected) {
        setError(
          callbackError
            ? callbackError
            : 'No recovery session was received. The reset link may have expired; verify the redirect URL is allowed in Supabase Auth settings, then request a new link.',
        )
        setChecking(false)
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !sessionReady) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== String(form.get('confirmPassword'))) {
      setError('The passwords do not match.')
      return
    }
    setPending(true)
    setError('')
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      if (!data.user?.id) throw new Error('Supabase did not confirm the password update.')
      navigate('/', { replace: true })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not update your password.')
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
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Choose a new password.</h1>
        <p className="muted">Set a new password to secure your account.</p>
        {checking && <p className="muted" role="status">Checking your reset link...</p>}
        {sessionReady && (
          <>
            <label>
              New password
              <input name="password" type="password" autoComplete="new-password" minLength={6} required />
            </label>
            <label>
              Confirm new password
              <input name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required />
            </label>
            <button className="button primary" disabled={pending}>
              {pending ? 'Updating password...' : 'Update password'}
              <ArrowRight size={17} />
            </button>
          </>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!sessionReady && !checking && (
          <p className="muted auth-switch">
            <Link to="/forgot-password">Request another reset link</Link>
          </p>
        )}
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
      </section>
    </div>
  )
}
