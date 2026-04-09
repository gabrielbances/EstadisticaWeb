import {
  BarChart3,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  UserCircle2,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../app/auth-context'
import { Brand } from '../components/Brand'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import {
  isAdminRole,
  normalizeProfileRole,
} from '../lib/access-control'

const navItems = [
  { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/anova', label: 'nav.anova', icon: BarChart3 },
  { to: '/chi-square', label: 'nav.chiSquare', icon: FileSpreadsheet },
  { to: '/results', label: 'nav.results', icon: Search },
  { to: '/admin', label: 'nav.admin', icon: Shield, adminOnly: true },
]

export function AppShell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, profileError, signOut, user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const email = profile?.email ?? user?.email ?? 'sin-correo'
  const displayName =
    profile?.fullName ??
    email
      .split('@')[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ')
  const role = normalizeProfileRole(profile?.role)
  const visibleNavItems = navItems.filter((item) =>
    item.adminOnly ? isAdminRole(role) : true,
  )

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setSignOutError(null)

    const { error } = await signOut()
    setIsSigningOut(false)

    if (error) {
      setSignOutError(`${t('auth.genericError')}: ${error}`)
      return
    }

    navigate('/auth', { replace: true })
  }

  return (
    <div className="atelier-shell">
      <aside className="atelier-sidebar">
        <div className="space-y-8">
          <div className="px-4">
            <Brand />
          </div>

          <nav className="space-y-1">
            {visibleNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
                key={to}
                to={to}
              >
                <Icon size={18} />
                <span>{t(label)}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="space-y-4 px-2">
          <div className="rounded-[24px] bg-[#f0efe3] p-4">
            <button
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6c6d78]"
              disabled={isSigningOut}
              onClick={() => {
                void handleSignOut()
              }}
              type="button"
            >
              <LogOut size={14} />
              {isSigningOut ? t('auth.signingOutButton') : t('nav.logout')}
            </button>
            {profileError ? (
              <p className="mt-3 text-xs leading-5 text-[#8a2b1d]">
                {t('auth.profilePending')}
              </p>
            ) : null}
            {signOutError ? (
              <p className="mt-3 text-xs leading-5 text-[#8a2b1d]">
                {signOutError}
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      <main className="atelier-main">
        <header className="atelier-topbar">
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
            <div className="rounded-full bg-white px-5 py-3 shadow-[0_10px_20px_rgba(27,28,21,0.05)]">
              <div className="flex items-center gap-3">
                <UserCircle2 className="text-[#002c98]" size={20} />
                <div>
                  <p className="font-headline text-sm font-bold text-[#1b1c15]">
                    {displayName}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#6c6d78]">
                    {role}
                  </p>
                </div>
                <div className="h-8 w-px bg-[#e4e3d7]" />
                <p className="max-w-[16rem] truncate text-sm text-[#444654]">{email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
