import { ShieldCheck, Smartphone, KeyRound, LogOut, RefreshCcw } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../app/auth-context'

type TotpFactor = {
  id: string
  friendly_name?: string | null
  status?: string
  factor_type?: string
}

type EnrollmentState = {
  factorId: string
  qrCode: string
  secret: string
  uri: string
}

export function AdminMfaGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSatisfied, setIsSatisfied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifiedFactor, setVerifiedFactor] = useState<TotpFactor | null>(null)
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadMfaState = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const [aalResult, factorsResult] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ])

    if (aalResult.error) {
      setError(aalResult.error.message)
      setIsLoading(false)
      return
    }

    if (factorsResult.error) {
      setError(factorsResult.error.message)
      setIsLoading(false)
      return
    }

    if (aalResult.data.currentLevel === 'aal2') {
      setIsSatisfied(true)
      setVerifiedFactor(null)
      setEnrollment(null)
      setIsLoading(false)
      return
    }

    const nextVerifiedFactor =
      factorsResult.data.totp.find((factor) => factor.status === 'verified') ?? null

    setVerifiedFactor(nextVerifiedFactor)
    setIsSatisfied(false)
    setIsLoading(false)
  }

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      void loadMfaState()
    }, 0)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [])

  const handleEnroll = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Admin access',
    })

    if (enrollError) {
      setError(enrollError.message)
      setIsSubmitting(false)
      return
    }

    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    })
    setVerificationCode('')
    setIsSubmitting(false)
  }

  const handleVerifyEnrollment = async () => {
    if (!enrollment) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.factorId,
      code: verificationCode.trim(),
    })

    if (verifyError) {
      setError(verifyError.message)
      setIsSubmitting(false)
      return
    }

    setSuccess(t('adminMfa.enrollSuccess'))
    setEnrollment(null)
    setVerificationCode('')
    await loadMfaState()
    setIsSubmitting(false)
  }

  const handleVerifyExistingFactor = async () => {
    if (!verifiedFactor) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: verifiedFactor.id,
      code: verificationCode.trim(),
    })

    if (verifyError) {
      setError(verifyError.message)
      setIsSubmitting(false)
      return
    }

    setSuccess(t('adminMfa.verifySuccess'))
    setVerificationCode('')
    await loadMfaState()
    setIsSubmitting(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!isLoading && isSatisfied) {
    return children
  }

  return (
    <div className="atelier-page flex min-h-screen items-center justify-center px-6 py-12">
      <div className="atelier-panel max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dde1ff] text-[#002c98]">
            <ShieldCheck size={26} />
          </div>
          <div>
            <p className="eyebrow">{t('adminMfa.eyebrow')}</p>
            <h1 className="mt-2 font-headline text-4xl font-extrabold tracking-[-0.04em] text-[#1b1c15]">
              {t('adminMfa.title')}
            </h1>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-base leading-7 text-[#444654]">
          {t('adminMfa.body')}
        </p>

        {error ? (
          <div className="mt-6 rounded-[22px] border border-[#f4c7c3] bg-[#fff3f1] px-4 py-3 text-sm leading-7 text-[#8a2b1d]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-[22px] border border-[#a0f399] bg-[#eefde9] px-4 py-3 text-sm leading-7 text-[#1b6d24]">
            {success}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 rounded-[24px] bg-[#f5f4e8] p-6 text-sm leading-7 text-[#444654]">
            {t('adminMfa.loading')}
          </div>
        ) : null}

        {!isLoading && !verifiedFactor && !enrollment ? (
          <div className="mt-8 rounded-[24px] bg-[#f5f4e8] p-6">
            <div className="flex items-center gap-3 text-[#002c98]">
              <Smartphone size={22} />
              <h2 className="font-headline text-xl font-bold text-[#1b1c15]">
                {t('adminMfa.enrollTitle')}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#444654]">
              {t('adminMfa.enrollBody')}
            </p>
            <button
              className="atelier-primary-button mt-6"
              disabled={isSubmitting}
              onClick={() => {
                void handleEnroll()
              }}
              type="button"
            >
              <KeyRound size={16} />
              {isSubmitting ? t('adminMfa.enrolling') : t('adminMfa.enrollAction')}
            </button>
          </div>
        ) : null}

        {enrollment ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
            <div className="rounded-[24px] bg-white p-5 shadow-[0_14px_30px_rgba(27,28,21,0.05)]">
              <img
                alt={t('adminMfa.qrAlt')}
                className="mx-auto w-full max-w-[16rem] rounded-2xl bg-white p-3"
                src={enrollment.qrCode}
              />
            </div>
            <div className="rounded-[24px] bg-[#f5f4e8] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
                {t('adminMfa.secretLabel')}
              </p>
              <p className="mt-2 break-all rounded-2xl bg-white px-4 py-3 font-mono text-sm text-[#1b1c15]">
                {enrollment.secret}
              </p>
              <label className="mt-6 block text-xs font-bold uppercase tracking-[0.18em] text-[#6c6d78]">
                {t('adminMfa.codeLabel')}
              </label>
              <input
                className="atelier-input mt-2"
                inputMode="numeric"
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder={t('adminMfa.codePlaceholder')}
                value={verificationCode}
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="atelier-primary-button"
                  disabled={isSubmitting || verificationCode.trim().length < 6}
                  onClick={() => {
                    void handleVerifyEnrollment()
                  }}
                  type="button"
                >
                  {isSubmitting ? t('adminMfa.verifying') : t('adminMfa.verifyAction')}
                </button>
                <button
                  className="atelier-outline-button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEnrollment(null)
                    setVerificationCode('')
                  }}
                  type="button"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && verifiedFactor ? (
          <div className="mt-8 rounded-[24px] bg-[#f5f4e8] p-6">
            <h2 className="font-headline text-xl font-bold text-[#1b1c15]">
              {t('adminMfa.challengeTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#444654]">
              {t('adminMfa.challengeBody')}
            </p>
            <label className="mt-6 block text-xs font-bold uppercase tracking-[0.18em] text-[#6c6d78]">
              {t('adminMfa.codeLabel')}
            </label>
            <input
              className="atelier-input mt-2"
              inputMode="numeric"
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder={t('adminMfa.codePlaceholder')}
              value={verificationCode}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="atelier-primary-button"
                disabled={isSubmitting || verificationCode.trim().length < 6}
                onClick={() => {
                  void handleVerifyExistingFactor()
                }}
                type="button"
              >
                {isSubmitting ? t('adminMfa.verifying') : t('adminMfa.verifyAction')}
              </button>
              <button
                className="atelier-outline-button"
                disabled={isSubmitting}
                onClick={() => {
                  void loadMfaState()
                }}
                type="button"
              >
                <RefreshCcw size={16} />
                {t('adminMfa.refresh')}
              </button>
            </div>
          </div>
        ) : null}

        <button
          className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6c6d78]"
          onClick={() => {
            void handleSignOut()
          }}
          type="button"
        >
          <LogOut size={14} />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  )
}
