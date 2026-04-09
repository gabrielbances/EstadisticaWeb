import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  approvalStatus: string | null
  email: string | null
  role: string | null
  fullName: string | null
  createdAt: string | null
  raw: Record<string, unknown>
}

export type AuthActionResult = {
  error: string | null
  requiresEmailConfirmation?: boolean
}

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  profileError: string | null
  refreshProfile: () => Promise<void>
  signInWithPassword: (credentials: {
    email: string
    password: string
  }) => Promise<AuthActionResult>
  signOut: () => Promise<AuthActionResult>
  signUp: (credentials: {
    email: string
    password: string
  }) => Promise<AuthActionResult>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
