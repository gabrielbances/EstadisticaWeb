export const PROFILE_ROLES = ['student', 'admin', 'superadmin'] as const
export type ProfileRole = (typeof PROFILE_ROLES)[number]

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export const normalizeProfileRole = (value: string | null | undefined): ProfileRole => {
  if (value && PROFILE_ROLES.includes(value as ProfileRole)) {
    return value as ProfileRole
  }

  return 'student'
}

export const normalizeApprovalStatus = (
  value: string | null | undefined,
): ApprovalStatus => {
  if (value && APPROVAL_STATUSES.includes(value as ApprovalStatus)) {
    return value as ApprovalStatus
  }

  return 'pending'
}

export const isAdminRole = (value: string | null | undefined) =>
  normalizeProfileRole(value) === 'admin' ||
  normalizeProfileRole(value) === 'superadmin'

export const requiresAdminMfa = (value: string | null | undefined) =>
  isAdminRole(value)

export const isSuperadminRole = (value: string | null | undefined) =>
  normalizeProfileRole(value) === 'superadmin'
