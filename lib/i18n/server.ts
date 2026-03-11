import { cookies } from 'next/headers'
import { translations, type Lang, type TranslationKey } from './translations'

export const LANG_COOKIE = 'rm_lang'

export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LANG_COOKIE)?.value
  return value === 'en' || value === 'es' ? value : 'es'
}

export function tServer(
  key: TranslationKey,
  lang: Lang,
  vars?: Record<string, string | number>
): string {
  const dict = translations[lang] as Record<string, string>
  let str = dict[key] ?? (translations.es as Record<string, string>)[key] ?? key
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v))
    })
  }
  return str
}
