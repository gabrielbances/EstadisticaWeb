import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../app/auth-context'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

const AUTH_RATE_LIMIT_KEY = 'estadistica-web-auth-rate-limit'
const MAX_AUTH_ATTEMPTS = 5
const AUTH_COOLDOWN_MS = 30_000

const readStoredCooldown = () => {
  if (typeof window === 'undefined') {
    return 0
  }

  const rawValue = window.localStorage.getItem(AUTH_RATE_LIMIT_KEY)
  const parsedValue = rawValue ? Number(rawValue) : 0
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const persistCooldown = (value: number) => {
  if (typeof window === 'undefined') {
    return
  }

  if (value > 0) {
    window.localStorage.setItem(AUTH_RATE_LIMIT_KEY, String(value))
    return
  }

  window.localStorage.removeItem(AUTH_RATE_LIMIT_KEY)
}

export function AuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signInWithPassword, signUp } = useAuth()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState(() => readStoredCooldown())
  const [feedback, setFeedback] = useState<{
    message: string
    tone: 'error' | 'success'
  } | null>(null)

  const isSignInMode = mode === 'signIn'

  const registerFailure = () => {
    const nextAttempts = failedAttempts + 1

    if (nextAttempts >= MAX_AUTH_ATTEMPTS) {
      const nextCooldownUntil = Date.now() + AUTH_COOLDOWN_MS
      setFailedAttempts(0)
      setCooldownUntil(nextCooldownUntil)
      persistCooldown(nextCooldownUntil)
      return {
        cooldownActivated: true,
        remainingSeconds: Math.ceil(AUTH_COOLDOWN_MS / 1000),
      }
    }

    setFailedAttempts(nextAttempts)
    return {
      cooldownActivated: false,
      remainingSeconds: 0,
    }
  }

  const clearThrottle = () => {
    setFailedAttempts(0)
    setCooldownUntil(0)
    persistCooldown(0)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    if (Date.now() < cooldownUntil) {
      const remainingCooldownSeconds = Math.ceil(
        Math.max(0, cooldownUntil - Date.now()) / 1000,
      )
      setFeedback({
        message: t('auth.rateLimitMessage', {
          seconds: remainingCooldownSeconds,
        }),
        tone: 'error',
      })
      return
    }

    setIsSubmitting(true)

    if (isSignInMode) {
      const { error } = await signInWithPassword({ email, password })

      if (error) {
        const failureState = registerFailure()
        setFeedback({
          message: failureState.cooldownActivated
            ? t('auth.rateLimitMessage', {
                seconds: failureState.remainingSeconds,
              })
            : `${t('auth.genericError')}: ${error}`,
          tone: 'error',
        })
        setIsSubmitting(false)
        return
      }

      clearThrottle()
      setIsSubmitting(false)
      navigate('/dashboard', { replace: true })
      return
    }

    const { error, requiresEmailConfirmation } = await signUp({
      email,
      password,
    })

    if (error) {
      const failureState = registerFailure()
      setFeedback({
        message: failureState.cooldownActivated
          ? t('auth.rateLimitMessage', {
              seconds: failureState.remainingSeconds,
            })
          : `${t('auth.genericError')}: ${error}`,
        tone: 'error',
      })
      setIsSubmitting(false)
      return
    }

    clearThrottle()
    if (requiresEmailConfirmation) {
      setFeedback({
        message: t('auth.signUpCheckEmail'),
        tone: 'success',
      })
      setMode('signIn')
      setPassword('')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    navigate('/dashboard', { replace: true })
  }

  const handleModeChange = (nextMode: 'signIn' | 'signUp') => {
    setMode(nextMode)
    setFeedback(null)
    setShowPassword(false)
  }

  return (
    <div className="atelier-page grid min-h-screen lg:grid-cols-[1fr_0.92fr]">
      <section className="hidden bg-[#002c98] px-12 py-16 text-white lg:flex lg:flex-col lg:justify-center">
        <span className="status-pill w-fit bg-[#a0f399] text-[#005312]">
          {t('common.brand')}
        </span>
        <h1 className="mt-8 max-w-xl font-headline text-6xl font-extrabold tracking-[-0.06em]">
          {t('common.brand')}
        </h1>
        <p className="mt-4 max-w-xl text-xl leading-9 text-[#dde1ff]">
          {t('auth.body')}
        </p>
        <blockquote className="mt-12 max-w-xl border-l-4 border-[#a0f399] pl-6 text-2xl font-light italic leading-10 text-[#b2bfff]">
          Statistical thinking should feel guided, not intimidating.
        </blockquote>
      </section>

      <section className="flex items-center justify-center px-6 py-12 lg:px-14">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center justify-between">
            <Link className="font-headline text-2xl font-extrabold tracking-[-0.06em] text-[#002c98]" to="/">
              {t('common.brand')}
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="atelier-panel">
            <div className="mb-8">
              <h1 className="font-headline text-4xl font-extrabold tracking-[-0.04em]">
                {t('auth.heading')}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-[#444654]">
                {t('auth.body')}
              </p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-2 rounded-2xl bg-[#efeee3] p-1">
              <button
                className={`rounded-2xl px-4 py-3 font-headline text-sm ${
                  isSignInMode
                    ? 'bg-white font-bold text-[#002c98]'
                    : 'font-semibold text-[#6c6d78]'
                }`}
                onClick={() => handleModeChange('signIn')}
                type="button"
              >
                {t('auth.loginTab')}
              </button>
              <button
                className={`rounded-2xl px-4 py-3 font-headline text-sm ${
                  !isSignInMode
                    ? 'bg-white font-bold text-[#002c98]'
                    : 'font-semibold text-[#6c6d78]'
                }`}
                onClick={() => handleModeChange('signUp')}
                type="button"
              >
                {t('auth.registerTab')}
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {feedback ? (
                <div
                  className={`rounded-[22px] border px-4 py-3 text-sm leading-7 ${
                    feedback.tone === 'error'
                      ? 'border-[#f4c7c3] bg-[#fff3f1] text-[#8a2b1d]'
                      : 'border-[#a0f399] bg-[#eefde9] text-[#1b6d24]'
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#6c6d78]">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c6d78]" size={18} />
                  <input
                    autoComplete="email"
                    className="atelier-input pl-11"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#6c6d78]">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c6d78]" size={18} />
                  <input
                    autoComplete={
                      isSignInMode ? 'current-password' : 'new-password'
                    }
                    className="atelier-input pr-12 pl-11"
                    minLength={6}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c6d78] transition hover:text-[#002c98]"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="rounded-[22px] bg-[#f5f4e8] px-4 py-3 text-sm leading-7 text-[#444654]">
                {t('auth.sessionManaged')}
              </div>

              <button
                className="atelier-primary-button w-full justify-center"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? t(
                      isSignInMode ? 'auth.signingInButton' : 'auth.signingUpButton',
                    )
                  : t(
                      isSignInMode ? 'auth.signInButton' : 'auth.signUpButton',
                    )}
                <ArrowRight size={16} />
              </button>
            </form>

            <p className="mt-6 text-sm leading-7 text-[#6c6d78]">
              {t(isSignInMode ? 'auth.switchToSignUpPrompt' : 'auth.switchToSignInPrompt')}{' '}
              <button
                className="font-semibold text-[#002c98]"
                onClick={() => handleModeChange(isSignInMode ? 'signUp' : 'signIn')}
                type="button"
              >
                {t(
                  isSignInMode
                    ? 'auth.switchToSignUpAction'
                    : 'auth.switchToSignInAction',
                )}
              </button>
            </p>
            <p className="mt-3 text-sm leading-7 text-[#6c6d78]">{t('auth.helper')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
