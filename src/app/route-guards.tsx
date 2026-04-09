import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'
import { AdminMfaGate } from '../components/AdminMfaGate'
import {
  isAdminRole,
  normalizeApprovalStatus,
} from '../lib/access-control'
import { useAuth } from './auth-context'

function AuthPendingScreen() {
  const { t } = useTranslation()

  return (
    <div className="atelier-page flex min-h-screen items-center justify-center px-6 py-12">
      <div className="atelier-panel max-w-xl text-center">
        <p className="eyebrow">{t('common.loading')}</p>
        <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.04em] text-[#1b1c15]">
          {t('auth.loadingHeading')}
        </h1>
        <p className="mt-4 text-base leading-7 text-[#444654]">
          {t('auth.loadingBody')}
        </p>
      </div>
    </div>
  )
}

function ProfilePendingScreen() {
  const { t } = useTranslation()
  const { refreshProfile, signOut } = useAuth()

  return (
    <div className="atelier-page flex min-h-screen items-center justify-center px-6 py-12">
      <div className="atelier-panel max-w-xl">
        <p className="eyebrow">{t('common.loading')}</p>
        <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.04em] text-[#1b1c15]">
          {t('auth.profilePendingTitle')}
        </h1>
        <p className="mt-4 text-base leading-7 text-[#444654]">
          {t('auth.profilePending')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="atelier-primary-button"
            onClick={() => {
              void refreshProfile()
            }}
            type="button"
          >
            {t('auth.retryProfile')}
          </button>
          <button
            className="atelier-outline-button"
            onClick={() => {
              void signOut()
            }}
            type="button"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ApprovalStatusScreen({ status }: { status: 'pending' | 'rejected' }) {
  const { t } = useTranslation()
  const { refreshProfile, signOut } = useAuth()

  return (
    <div className="atelier-page flex min-h-screen items-center justify-center px-6 py-12">
      <div className="atelier-panel max-w-2xl">
        <p className="eyebrow">{t('auth.approvalEyebrow')}</p>
        <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.04em] text-[#1b1c15]">
          {status === 'pending'
            ? t('auth.pendingApprovalTitle')
            : t('auth.rejectedApprovalTitle')}
        </h1>
        <p className="mt-4 text-base leading-7 text-[#444654]">
          {status === 'pending'
            ? t('auth.pendingApprovalBody')
            : t('auth.rejectedApprovalBody')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="atelier-primary-button"
            onClick={() => {
              void refreshProfile()
            }}
            type="button"
          >
            {t('auth.checkApproval')}
          </button>
          <button
            className="atelier-outline-button"
            onClick={() => {
              void signOut()
            }}
            type="button"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthPendingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/auth" />
  }

  if (!profile) {
    return <ProfilePendingScreen />
  }

  const approvalStatus = normalizeApprovalStatus(profile.approvalStatus)

  if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
    return <ApprovalStatusScreen status={approvalStatus} />
  }

  if (isAdminRole(profile.role)) {
    return <AdminMfaGate>{children}</AdminMfaGate>
  }

  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const from = location.state as { from?: { pathname?: string } } | null
  const target = from?.from?.pathname
  const safeTo = target && target.startsWith('/') ? target : '/dashboard'

  if (isLoading) {
    return <AuthPendingScreen />
  }

  if (isAuthenticated) {
    return <Navigate replace to={safeTo} />
  }

  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isLoading, profile } = useAuth()

  if (isLoading) {
    return <AuthPendingScreen />
  }

  if (!profile) {
    return <ProfilePendingScreen />
  }

  if (!isAdminRole(profile.role)) {
    return <Navigate replace to="/dashboard" />
  }

  return <>{children}</>
}
