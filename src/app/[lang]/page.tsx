import { notFound } from 'next/navigation'
import { HomePage } from '@/components/HomePage'
import { isLang } from '@/content/i18n'
import { pageMetadata } from '@/content/metadata'
import { getPage } from '@/content/page'

export async function generateMetadata({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  return isLang(lang) ? pageMetadata(lang) : {}
}

export default async function Page({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <HomePage p={getPage(lang)} />
}
