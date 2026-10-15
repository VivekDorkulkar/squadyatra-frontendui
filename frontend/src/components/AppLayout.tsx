import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  CalendarDays,
  ChevronDown,
  Compass,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Mountain,
  Plane,
  Plus,
  Settings2,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { useAuth } from '../features/auth/AuthProvider'
import { useWorkspace } from '../features/workspace/WorkspaceProvider'
import { config } from '../lib/config'
import type { Role } from '../domain/models'
import { Modal } from './ui'
import { CreateSquadModal } from '../features/squads/SquadsPage'

export function AppLayout() {
  const { identity, setDemoRole } = useAuth()
  const { data } = useWorkspace()
  const [mobile, setMobile] = useState(false)
  const [modal, setModal] = useState<'help' | 'create' | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const invitations = data.invitations.filter((item) => item.status === 'pending').length
  const nav = [
    { to: '/', label: 'Explore trips', icon: Compass },
    { to: '/squads', label: 'My squads', icon: UsersRound },
    { to: '/bookings', label: 'My bookings', icon: CalendarDays },
    { to: '/saved', label: 'Saved trips', icon: Bookmark },
    { to: '/invitations', label: 'Invitations', icon: Bell },
  ]
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <Link to="/" className="brand" onClick={() => setMobile(false)}>
          <span className="brand-icon">
            <Mountain size={25} strokeWidth={2.5} />
          </span>
          <span>
            Squad<span className="brand-accent">Yatra</span>
            <small>GO PLACES. FIND YOUR PEOPLE.</small>
          </span>
        </Link>
        <button
          className="icon-button mobile-close"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
        <p className="nav-label">YOUR NEXT CHAPTER</p>
        <nav aria-label="Main navigation">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobile(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.to === '/invitations' && invitations > 0 && (
                <span className="count-badge">{invitations}</span>
              )}
            </NavLink>
          ))}
          {identity?.role === 'agency' && (
            <NavLink className="nav-item" to="/agency">
              <LayoutDashboard size={20} />
              Agency workspace
            </NavLink>
          )}
          {identity?.role === 'admin' && (
            <NavLink className="nav-item" to="/admin">
              <ShieldCheck size={20} />
              Admin workspace
            </NavLink>
          )}
        </nav>
        <div className="sidebar-prompt">
          <span className="small-illustration">
            <UsersRound size={26} />
            <span>+</span>
          </span>
          <h3>Your people. Your plans.</h3>
          <p>Some journeys are better together.</p>
          <button className="button outline full" onClick={() => setModal('create')}>
            <Plus size={16} />
            Create a squad
          </button>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setModal('help')}>
            <HelpCircle size={20} />
            Help & support
            <ArrowUpRight size={15} />
          </button>
          {config.demo && (
            <label className="demo-role">
              <Settings2 size={15} />
              <span>Demo view</span>
              <select
                aria-label="Demo role"
                value={identity?.role ?? 'consumer'}
                onChange={(event) => {
                  const role = event.target.value as Role
                  setDemoRole(role)
                  navigate(role === 'consumer' ? '/' : `/${role}`)
                }}
              >
                <option value="consumer">Traveler</option>
                <option value="agency">Agency</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          )}
          <Link to="/profile" className="profile-card">
            <span className="profile-avatar">
              {identity?.name.slice(0, 1).toUpperCase() ?? 'A'}
            </span>
            <span>
              <strong>{identity?.name ?? 'Guest'} Sharma</strong>
              <small>{config.demo ? 'Demo traveler' : 'Your account'}</small>
            </span>
            <ChevronDown size={16} />
          </Link>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={23} />
            </button>
            <Link to="/" className="mobile-brand" aria-label="SquadYatra home">
              <Mountain size={22} />
              SquadYatra
            </Link>
            <span className="topbar-title">
              {location.pathname === '/'
                ? 'Let’s go somewhere good.'
                : 'A little closer to your next adventure.'}
            </span>
          </div>
          <div className="topbar-right">
            <span className="trust-note">
              <ShieldCheck size={15} />
              Curated trips. Real connections.
            </span>
            <Link
              className="notification-button"
              to="/invitations"
              aria-label={`${invitations} pending invitations`}
            >
              <Bell size={20} />
              {invitations > 0 && <span />}
            </Link>
            <Link to="/profile" className="top-avatar" aria-label="Your profile">
              {identity?.name.slice(0, 1).toUpperCase() ?? 'A'}
            </Link>
          </div>
        </header>
        <main id="main-content">
          <Outlet />
        </main>
        <footer className="footer">
          <span>
            <Mountain size={16} />A little farther. A little closer.
          </span>
          <span>Made for the journey, and the people along the way.</span>
          <span>© {new Date().getFullYear()} SquadYatra</span>
        </footer>
      </div>
      {modal === 'create' && <CreateSquadModal onClose={() => setModal(null)} />}
      {modal === 'help' && (
        <Modal title="Here for your journey" onClose={() => setModal(null)}>
          <div className="support-content">
            <Plane size={34} />
            <p>Need help with a trip, squad, or reservation?</p>
            <a className="button primary" href="mailto:support@squadyatra.com">
              Contact support
              <ArrowUpRight size={17} />
            </a>
            <p className="muted">
              Include your trip name and reservation reference. Never share passwords, payment
              information, or identity documents by email.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
