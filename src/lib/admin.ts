import { supabase } from './supabase'
import {
  type ApprovalStatus,
  type ProfileRole,
} from './access-control'

export type AdminProfileRecord = {
  id: string
  email: string | null
  fullName: string | null
  role: ProfileRole
  approvalStatus: ApprovalStatus
  createdAt: string | null
  approvedAt: string | null
  approvedBy: string | null
}

type RawAdminProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: ProfileRole
  approval_status: ApprovalStatus
  created_at: string | null
  approved_at: string | null
  approved_by: string | null
}

const normalizeAdminProfile = (value: RawAdminProfile): AdminProfileRecord => ({
  id: value.id,
  email: value.email,
  fullName: value.full_name,
  role: value.role,
  approvalStatus: value.approval_status,
  createdAt: value.created_at,
  approvedAt: value.approved_at,
  approvedBy: value.approved_by,
})

export async function listAdminProfiles() {
  const { data, error } = await supabase.rpc('admin_list_profiles')

  if (error) {
    return {
      data: null,
      error: error.message,
    }
  }

  return {
    data: ((data ?? []) as RawAdminProfile[]).map(normalizeAdminProfile),
    error: null,
  }
}

export async function updateAdminProfileAccess(input: {
  targetUserId: string
  nextApprovalStatus: ApprovalStatus
  nextRole: ProfileRole
}) {
  const { data, error } = await supabase.rpc('admin_update_profile_access', {
    next_approval_status: input.nextApprovalStatus,
    next_role: input.nextRole,
    target_user_id: input.targetUserId,
  })

  if (error) {
    return {
      data: null,
      error: error.message,
    }
  }

  const row = Array.isArray(data) ? data[0] : data

  return {
    data: row ? normalizeAdminProfile(row as RawAdminProfile) : null,
    error: null,
  }
}

export async function removeAdminProfile(targetUserId: string) {
  const { error } = await supabase.rpc('admin_remove_user', {
    target_user_id: targetUserId,
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  return {
    error: null,
  }
}
