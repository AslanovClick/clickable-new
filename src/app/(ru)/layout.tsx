import { SiteDocument } from '@/components/SiteDocument'
import { VIEWPORT } from '@/content/metadata'

export const viewport = VIEWPORT

// русская версия — корень сайта
export default function RuLayout({ children }: LayoutProps<'/'>) {
  return <SiteDocument lang="ru">{children}</SiteDocument>
}
