'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, type Lang, type TranslationKey } from '@/lib/i18n/translations'

const COOKIE = 'rm_lang'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    // Read cookie first (set by previous session), then localStorage
    const fromCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE}=`))
      ?.split('=')[1] as Lang | undefined
    const stored = fromCookie ?? (localStorage.getItem(COOKIE) as Lang | null) ?? 'es'
    if (stored === 'en' || stored === 'es') setLangState(stored)
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem(COOKIE, newLang)
    // Set cookie so server components can read the preference
    document.cookie = `${COOKIE}=${newLang}; path=/; max-age=31536000; SameSite=Lax`
    // Update the HTML lang attribute immediately
    document.documentElement.lang = newLang
  }, [])

  const translate = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const dict = translations[lang] as Record<string, string>
      let str = dict[key] ?? (translations.es as Record<string, string>)[key] ?? key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, String(v))
        })
      }
      return str
    },
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
