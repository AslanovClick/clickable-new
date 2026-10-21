import { notFound } from 'next/navigation'
import { SiteDocument } from '@/components/SiteDocument'
import { isLang } from '@/content/i18n'
import { VIEWPORT } from '@/content/metadata'

export const viewport = VIEWPORT

// en и uk собираются статически; остальные адреса — 404 (ru живёт в корне, см. app/(ru))
export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'uk' }]
}

export default async function LangLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLang(lang) || lang === 'ru') notFound()
  return <SiteDocument lang={lang}>{children}</SiteDocument>
}
