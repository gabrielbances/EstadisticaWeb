import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const languageOptions = [
  { code: 'es', flag: '🇬🇹', labelKey: 'common.spanish' },
  { code: 'en', flag: '🇺🇸', labelKey: 'common.english' },
] as const

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const activeLanguage = useMemo(
    () =>
      languageOptions.find((option) => option.code === i18n.language) ??
      languageOptions[0],
    [i18n.language],
  )

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-label={t('common.language')}
        className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[#1b1c15] shadow-[0_10px_20px_rgba(27,28,21,0.05)] transition hover:bg-[#f8f7ef]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="text-lg leading-none">{activeLanguage.flag}</span>
        <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} size={16} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 min-w-44 overflow-hidden rounded-[22px] border border-[#e4e3d7] bg-white p-2 shadow-[0_18px_40px_rgba(27,28,21,0.12)]">
          <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6c6d78]">
            {t('common.language')}
          </div>
          <div className="space-y-1">
            {languageOptions.map((option) => {
              const active = activeLanguage.code === option.code
              return (
                <button
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                    active ? 'bg-[#efeee3] text-[#002c98]' : 'text-[#1b1c15] hover:bg-[#f8f7ef]'
                  }`}
                  key={option.code}
                  onClick={() => {
                    void i18n.changeLanguage(option.code)
                    setOpen(false)
                  }}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg leading-none">{option.flag}</span>
                    <span className="text-sm font-semibold">{t(option.labelKey)}</span>
                  </span>
                  {active ? <Check size={16} /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
