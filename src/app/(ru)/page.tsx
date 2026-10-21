import { HomePage } from '@/components/HomePage'
import { pageMetadata } from '@/content/metadata'
import { getPage } from '@/content/page'

export const metadata = pageMetadata('ru')

export default function Page() {
  return <HomePage p={getPage('ru')} />
}
