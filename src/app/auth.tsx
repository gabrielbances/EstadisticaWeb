import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, type UserProfile } from './auth-context'

type Credentials = {
  email: string
  password: string
}

type SessionSyncReason = AuthChangeEvent | 'INITIAL_SESSION' | 'MANUAL_REFRESH'

type RawProfile = Record<string, unknown>

const profileSyncFallbackError = 'Profile is not available yet in public.profiles.'

const isRecord = (value: unknown): value is RawProfile =>
  typeof value === 'object' && value !== null

const asString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : null

const normalizeProfile = (value: unknown): UserProfile | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = asString(value.id)
  if (!id) {
    return null
  }

  return {
    id,
    approvalStatus:
      asString(value.approval_status) ?? asString(value.approvalStatus),
    email: asString(value.email),
    role: asString(value.role),
    fullName: asString(value.full_name) ?? asString(value.fullName),
    createdAt: asString(value.created_at) ?? asString(value.createdAt),
    raw: value,
  }
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })

const fetchProfileByUserId = async (
  userId: string,
  retryCount = 1,
): Promise<{ error: string | null; profile: UserProfile | null }> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return {
      error: error.message,
      profile: null,
    }
  }

  const profile = normalizeProfile(data)
  if (profile) {
    return {
      error: null,
      profile,
    }
  }

  if (retryCount > 0) {
    await wait(600)
    return fetchProfileByUserId(userId, retryCount - 1)
  }

  return {
    error: profileSyncFallbackError,
    profile: null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)
  const syncRequestRef = useRef(0)
  const currentUserIdRef = useRef<string | null>(null)

  const syncSession = async (
    nextSession: Session | null,
    reason: SessionSyncReason,
  ) => {
    const requestId = syncRequestRef.current + 1
    syncRequestRef.current = requestId
    const nextUser = nextSession?.user ?? null
    const nextUserId = nextUser?.id ?? null
    const shouldReloadProfile =
      reason === 'INITIAL_SESSION' ||
      reason === 'MANUAL_REFRESH' ||
      reason === 'SIGNED_IN' ||
      reason === 'USER_UPDATED' ||
      currentUserIdRef.current !== nextUserId

    setSession(nextSession)
    setUser(nextUser)
    currentUserIdRef.current = nextUserId

    if (!nextUser) {
      setProfile(null)
      setProfileError(null)
      setIsLoading(false)
      return
    }

    if (!shouldReloadProfile) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const { error, profile: nextProfile } = await fetchProfileByUserId(
      nextUser.id,
    )

    if (!mountedRef.current || syncRequestRef.current !== requestId) {
      return
    }

    setProfile(nextProfile)
    setProfileError(error)
    setIsLoading(false)
  }

  useEffect(() => {
    mountedRef.current = true

    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!mountedRef.current) {
        return
      }

      if (error) {
        setSession(null)
        setUser(null)
        setProfile(null)
        setProfileError(error.message)
        setIsLoading(false)
        return
      }

      await syncSession(data.session, 'INITIAL_SESSION')
    }

    void initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void syncSession(nextSession, event)
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async ({ email, password }: Credentials) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return {
      error: null,
      requiresEmailConfirmation: !data.session,
    }
  }

  const signInWithPassword = async ({ email, password }: Credentials) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  }

  const refreshProfile = async () => {
    await syncSession(session, 'MANUAL_REFRESH')
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session?.user,
        isLoading,
        profile,
        profileError,
        refreshProfile,
        session,
        signInWithPassword,
        signOut,
        signUp,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
