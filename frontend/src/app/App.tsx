import { Component, type ErrorInfo, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { EmptyState } from '../components/ui'
import { AuthProvider, useAuth } from '../features/auth/AuthProvider'
import {
  ForgotPasswordPage,
  LoginPage,
  ProfilePage,
  ResetPasswordPage,
  SignupPage,
} from '../features/auth/AccountPages'
import { ExplorePage } from '../features/catalog/ExplorePage'
import { TripDetailsPage } from '../features/catalog/TripDetailsPage'
import { SquadsPage, InvitationsPage } from '../features/squads/SquadsPage'
import { BookingsPage } from '../features/bookings/BookingsPage'
import { ManagementPage } from '../features/management/ManagementPage'
import { WorkspaceProvider } from '../features/workspace/WorkspaceProvider'
import type { Role } from '../domain/models'

const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
})
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack)
  }
  render() {
    return this.state.failed ? (
      <EmptyState
        title="A small detour"
        description="Something unexpected happened. Reload to get back on your journey."
      >
        <button className="button primary" onClick={() => window.location.reload()}>
          Reload SquadYatra
        </button>
      </EmptyState>
    ) : (
      this.props.children
    )
  }
}
function Guard({ children, role }: { children: ReactNode; role?: Role }) {
  const { identity, loading } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <div className="page-state" role="status">
        Checking your session...
      </div>
    )
  if (!identity)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (role && identity?.role !== role)
    return (
      <EmptyState
        title="This space belongs to another team"
        description="Your account does not have permission to access this workspace."
      />
    )
  return children
}
export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <BrowserRouter>
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                element={
                  <Guard>
                    <WorkspaceProvider>
                      <AppLayout />
                    </WorkspaceProvider>
                  </Guard>
                }
              >
                <Route index element={<ExplorePage />} />
                <Route path="saved" element={<ExplorePage saved />} />
                <Route path="trips/:id" element={<TripDetailsPage />} />
                <Route path="squads" element={<SquadsPage />} />
                <Route path="invitations" element={<InvitationsPage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route
                  path="agency"
                  element={
                    <Guard role="agency">
                      <ManagementPage />
                    </Guard>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <Guard role="admin">
                      <ManagementPage admin />
                    </Guard>
                  }
                />
                <Route
                  path="*"
                  element={
                    <EmptyState
                      title="A road less traveled"
                      description="This page does not exist. Explore a new destination from the navigation."
                    />
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
