import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources, type AppLanguage } from './translations'

const languageKey = 'estadisticaweb-language'

const getInitialLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') {
    return 'es'
  }

  const saved = window.localStorage.getItem(languageKey)
  if (saved === 'es' || saved === 'en') {
    return saved
  }

  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(languageKey, language)
  }
  document.documentElement.lang = language
})

document.documentElement.lang = i18n.language

export { languageKey }
export default i18n
