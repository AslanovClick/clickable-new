import type { ReactNode } from 'react'
import { preload } from 'react-dom'
import { JetBrains_Mono } from 'next/font/google'
import type { Lang } from '@/content/i18n'
import { InlineScript } from './InlineScript'
import '@/styles/main.scss'

const mono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], weight: ['400', '500'], display: 'swap', variable: '--font-mono' })

// корень помнит выбранный язык: вернувшегося посетителя ведём на его версию (поисковиков это не касается)
const REMEMBER_LANG = `try{var l=localStorage.getItem('clickable-lang');if(l==='en'||l==='uk')location.replace('/'+l+'/'+location.hash)}catch(e){}`

// .js — стили анимаций включены; если движок не запустился за 12 с, страница показывается как есть
const BOOT_FLAGS = `document.documentElement.classList.add('js');setTimeout(function(){if(!window.__clickableBooted)document.documentElement.classList.add('is-loaded')},12000)`

// <html> для обеих корневых раскладок: ru (корень сайта) и [lang] (en, uk)
export function SiteDocument({ lang, children }: { lang: Lang; children: ReactNode }) {
  // фирменный шрифт нужен первому экрану — грузим сразу
  preload('/fonts/CLICKABLE-Black.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  preload('/fonts/Montserrat-Light.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })

  return (
    // классы на <html> дальше ставят inline-скрипт и движок — расхождение с серверной разметкой ожидаемо
    <html lang={lang} className={mono.variable} suppressHydrationWarning>
      {/* правило — для Pages Router; в App Router корневая раскладка сама рендерит <head> */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {lang === 'ru' ? <InlineScript html={REMEMBER_LANG} /> : null}
        <InlineScript html={BOOT_FLAGS} />
      </head>
      <body>{children}</body>
    </html>
  )
}
