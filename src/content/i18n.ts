// Языки: ru — корень, en — /en/, uk — /uk/
export const LANG_ORDER = ['ru', 'en', 'uk'] as const
export type Lang = (typeof LANG_ORDER)[number]

export const LANGS: Record<Lang, { code: string; name: string; locale: string; intl: string; path: string }> = {
  ru: { code: 'RU', name: 'Русский', locale: 'ru_RU', intl: 'ru-RU', path: '' },
  en: { code: 'EN', name: 'English', locale: 'en_US', intl: 'en-US', path: 'en/' },
  uk: { code: 'UA', name: 'Українська', locale: 'uk_UA', intl: 'uk-UA', path: 'uk/' }
}

export function isLang(v: string): v is Lang {
  return (LANG_ORDER as readonly string[]).includes(v)
}

// ссылка на версию сайта на языке l
export function langHref(l: Lang) {
  return '/' + LANGS[l].path
}
