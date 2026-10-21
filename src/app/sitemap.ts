import type { MetadataRoute } from 'next'
import { LANGS, LANG_ORDER } from '@/content/i18n'
import { SITE } from '@/content/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LANG_ORDER.map((l) => [l, SITE + LANGS[l].path]))
  return LANG_ORDER.map((l) => ({
    url: SITE + LANGS[l].path,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: l === 'ru' ? 1 : 0.9,
    alternates: { languages }
  }))
}
