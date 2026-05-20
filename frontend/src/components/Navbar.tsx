import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { LogOut, Zap, User, LayoutDashboard, Briefcase, Sun, Moon } from 'lucide-react'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="glass-dark fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center glow-orange">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text">Karmaphala</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive('/dashboard') ? 'rgba(255,107,53,0.1)' : 'transparent',
                  color: isActive('/dashboard') ? '#ff6b35' : 'var(--nav-link)',
                }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/jobs"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive('/jobs') ? 'rgba(255,107,53,0.1)' : 'transparent',
                  color: isActive('/jobs') ? '#ff6b35' : 'var(--nav-link)',
                }}
              >
                <Briefcase className="w-4 h-4" />
                Job Feed
              </Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* ── Dark / Light Mode Toggle ─────────────────── */}
          <button
            onClick={toggleTheme}
            className="btn-theme"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle theme"
          >
            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {isAuthenticated ? (
            <>
              {/* Role badge */}
              <span
                className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: user?.role === 'agent' ? 'rgba(0,212,255,0.1)' : 'rgba(255,107,53,0.1)',
                  color: user?.role === 'agent' ? '#00d4ff' : '#ff6b35',
                  border: `1px solid ${user?.role === 'agent' ? 'rgba(0,212,255,0.2)' : 'rgba(255,107,53,0.2)'}`,
                }}
              >
                {user?.role === 'agent' ? '🔧 Agent' : '👤 Customer'}
              </span>

              {/* User chip */}
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)' }}
              >
                <div className="w-6 h-6 rounded-full gradient-orange flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-red-400/5"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm py-2 px-4">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
