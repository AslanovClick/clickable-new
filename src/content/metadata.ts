import type { Metadata, Viewport } from 'next'
import { LANGS, LANG_ORDER, type Lang } from './i18n'
import { getPage } from './page'
import { SITE } from './site'

export const VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#070707',
  colorScheme: 'dark'
}

// title, description, canonical, hreflang, Open Graph, Twitter, иконки
export function pageMetadata(lang: Lang): Metadata {
  const { META } = getPage(lang)
  const url = SITE + LANGS[lang].path
  return {
    metadataBase: new URL(SITE),
    title: META.title,
    description: META.description,
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LANG_ORDER.map((l) => [l, SITE + LANGS[l].path])),
        'x-default': SITE + LANGS.en.path
      }
    },
    openGraph: {
      type: 'website',
      siteName: 'CLICKABLE',
      locale: LANGS[lang].locale,
      alternateLocale: LANG_ORDER.filter((l) => l !== lang).map((l) => LANGS[l].locale),
      url,
      title: META.title,
      description: META.description,
      images: [{ url: META.image, width: 1200, height: 630, alt: META.imageAlt }]
    },
    twitter: {
      card: 'summary_large_image',
      title: META.title,
      description: META.description,
      images: [META.image]
    },
    icons: {
      icon: [
        { url: '/img/favicon.svg', type: 'image/svg+xml' },
        { url: '/img/icon-192.png', type: 'image/png', sizes: '192x192' }
      ],
      apple: '/img/apple-touch-icon.png'
    }
  }
}
