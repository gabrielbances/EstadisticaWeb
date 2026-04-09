import { useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../app/auth-context'
import {
  type AdminProfileRecord,
  listAdminProfiles,
  removeAdminProfile,
  updateAdminProfileAccess,
} from '../lib/admin'
import {
  PROFILE_ROLES,
  type ApprovalStatus,
  type ProfileRole,
  isSuperadminRole,
} from '../lib/access-control'

export function AdminPage() {
  const { i18n, t } = useTranslation()
  const { profile: currentProfile } = useAuth()
  const [profiles, setProfiles] = useState<AdminProfileRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null)
  const [roleDrafts, setRoleDrafts] = useState<Record<string, ProfileRole>>({})

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value))
      : '—'

  const mapAdminError = (value: string) => {
    switch (value) {
      case 'SUPERADMIN_REQUIRED':
        return t('admin.superadminRequired')
      case 'CANNOT_MODIFY_SELF':
        return t('admin.cannotModifySelf')
      case 'LAST_ADMIN_CONSTRAINT':
        return t('admin.lastAdminProtected')
      case 'TARGET_PROFILE_NOT_FOUND':
        return t('admin.targetProfileNotFound')
      default:
        return value
    }
  }

  const loadProfiles = async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: nextError } = await listAdminProfiles()

    if (nextError) {
      setError(mapAdminError(nextError))
      setIsLoading(false)
      return
    }

    setProfiles(data ?? [])
    setRoleDrafts(
      Object.fromEntries((data ?? []).map((profile) => [profile.id, profile.role])),
    )
    setIsLoading(false)
  }

  const loadProfilesOnMount = useEffectEvent(() => {
    void loadProfiles()
  })

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      loadProfilesOnMount()
    }, 0)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [])

  const handleAccessChange = async (
    profileId: string,
    nextApprovalStatus: ApprovalStatus,
  ) => {
    const nextRole = roleDrafts[profileId]
    if (!nextRole) {
      return
    }

    setBusyProfileId(profileId)
    setError(null)

    const { data, error: nextError } = await updateAdminProfileAccess({
      targetUserId: profileId,
      nextApprovalStatus,
      nextRole,
    })

    if (nextError) {
      setError(mapAdminError(nextError))
      setBusyProfileId(null)
      return
    }

    if (data) {
      setProfiles((current) =>
        current.map((profile) => (profile.id === profileId ? data : profile)),
      )
    }

    setBusyProfileId(null)
  }

  const pendingProfiles = profiles.filter(
    (profile) => profile.approvalStatus === 'pending',
  )
  const approvedAdminCount = profiles.filter(
    (profile) =>
      profile.approvalStatus === 'approved' && profile.role !== 'student',
  ).length
  const canManageElevatedRoles = isSuperadminRole(currentProfile?.role)

  const handleRemoveAccess = async (targetProfile: AdminProfileRecord) => {
    setBusyProfileId(targetProfile.id)
    setError(null)

    const { error: nextError } = await removeAdminProfile(targetProfile.id)

    if (nextError) {
      setError(mapAdminError(nextError))
      setBusyProfileId(null)
      return
    }

    setProfiles((current) =>
      current.filter((currentProfile) => currentProfile.id !== targetProfile.id),
    )
    setBusyProfileId(null)
  }

  return (
    <div className="space-y-8">
      <section className="max-w-5xl">
        <p className="eyebrow mb-3">{t('nav.admin')}</p>
        <h1 className="page-title">{t('admin.title')}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#444654]">
          {t('admin.subtitle')}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="atelier-card">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
            {t('admin.pendingUsers')}
          </p>
          <p className="mt-3 font-headline text-4xl font-extrabold">
            {pendingProfiles.length}
          </p>
        </article>
        <article className="atelier-card">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
            {t('admin.approvedUsers')}
          </p>
          <p className="mt-3 font-headline text-4xl font-extrabold">
            {
              profiles.filter((profile) => profile.approvalStatus === 'approved').length
            }
          </p>
        </article>
        <article className="atelier-card">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
            {t('admin.adminUsers')}
          </p>
          <p className="mt-3 font-headline text-4xl font-extrabold">
            {profiles.filter((profile) => profile.role !== 'student').length}
          </p>
        </article>
      </section>

      {error ? (
        <section className="rounded-[22px] border border-[#f4c7c3] bg-[#fff3f1] px-4 py-3 text-sm leading-7 text-[#8a2b1d]">
          <p className="font-semibold">{t('admin.loadErrorTitle')}</p>
          <p>{error}</p>
          <p className="mt-2">{t('admin.loadErrorHint')}</p>
        </section>
      ) : null}

      <section className="atelier-panel">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="section-title">{t('admin.queueTitle')}</h2>
            <p className="mt-2 text-sm leading-7 text-[#444654]">
              {t('admin.queueBody')}
            </p>
          </div>
          <button
            className="atelier-outline-button"
            onClick={() => {
              void loadProfiles()
            }}
            type="button"
          >
            {t('admin.refresh')}
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-[22px] bg-[#f5f4e8] p-4 text-sm leading-7 text-[#444654]">
            {t('admin.loading')}
          </div>
        ) : null}

        {!isLoading && profiles.length > 0 ? (
          <div className="table-wrap">
            <table className="table-base" style={{ minWidth: '980px' }}>
              <thead>
                <tr>
                  <th>{t('admin.tableEmail')}</th>
                  <th>{t('admin.tableRole')}</th>
                  <th>{t('admin.tableStatus')}</th>
                  <th>{t('admin.tableDate')}</th>
                  <th>{t('admin.tableApprovedAt')}</th>
                  <th>{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <p className="font-semibold text-[#1b1c15]">
                        {profile.email ?? '—'}
                      </p>
                      {profile.fullName ? (
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#6c6d78]">
                          {profile.fullName}
                        </p>
                      ) : null}
                    </td>
                    <td>
                      {(() => {
                        const isProtectedLastAdmin =
                          profile.role !== 'student' &&
                          profile.approvalStatus === 'approved' &&
                          approvedAdminCount <= 1
                        const disableRoleSelect =
                          busyProfileId === profile.id || isProtectedLastAdmin
                        const availableRoles = canManageElevatedRoles
                          ? PROFILE_ROLES
                          : PROFILE_ROLES.filter((role) => role === 'student')

                        if (!canManageElevatedRoles && profile.role !== 'student') {
                          return (
                            <span className="status-pill bg-[#efeee3] text-[#1b1c15]">
                              {profile.role}
                            </span>
                          )
                        }

                        return (
                          <select
                            className="rounded-xl border border-[#d8d9e2] bg-white px-3 py-2 text-sm text-[#1b1c15] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={disableRoleSelect}
                            onChange={(event) =>
                              setRoleDrafts((current) => ({
                                ...current,
                                [profile.id]: event.target.value as ProfileRole,
                              }))
                            }
                            value={roleDrafts[profile.id] ?? profile.role}
                          >
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )
                      })()}
                    </td>
                    <td>
                      <span className="status-pill bg-[#efeee3] text-[#1b1c15]">
                        {profile.approvalStatus}
                      </span>
                    </td>
                    <td>{formatDate(profile.createdAt)}</td>
                    <td>{formatDate(profile.approvedAt)}</td>
                    <td>
                      {(() => {
                        const isPending = profile.approvalStatus === 'pending'
                        const isApproved = profile.approvalStatus === 'approved'
                        const isRejected = profile.approvalStatus === 'rejected'
                        const isProtectedLastAdmin =
                          profile.role !== 'student' &&
                          profile.approvalStatus === 'approved' &&
                          approvedAdminCount <= 1

                        if (isPending) {
                          return (
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="atelier-secondary-button"
                                disabled={busyProfileId === profile.id}
                                onClick={() => {
                                  void handleAccessChange(profile.id, 'approved')
                                }}
                                type="button"
                              >
                                {t('admin.approve')}
                              </button>
                              <button
                                className="atelier-outline-button"
                                disabled={busyProfileId === profile.id}
                                onClick={() => {
                                  void handleAccessChange(profile.id, 'rejected')
                                }}
                                type="button"
                              >
                                {t('admin.reject')}
                              </button>
                            </div>
                          )
                        }

                        if (isApproved || isRejected) {
                          return (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                className="atelier-outline-button"
                                disabled={
                                  busyProfileId === profile.id || isProtectedLastAdmin
                                }
                                onClick={() => {
                                  void handleRemoveAccess(profile)
                                }}
                                type="button"
                              >
                                {t('admin.removeAccess')}
                              </button>
                              {isProtectedLastAdmin ? (
                                <span className="text-xs leading-5 text-[#8a2b1d]">
                                  {t('admin.lastAdminProtected')}
                                </span>
                              ) : null}
                            </div>
                          )
                        }

                        return '—'
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}
