/* Точка входа движка: порядок запуска модулей. Вызывается один раз из components/Engine.tsx */
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { EngineStrings } from '@/content/page'
import { app, initCore, onResize, U } from './core'
import { cursor } from './cursor'
import { globeModule } from './globe'
import { hero } from './hero'
import { marquee } from './marquee'
import { preloader } from './preloader'
import { rest } from './rest'
import { stage } from './stage'
import { text } from './text'
import { ui } from './ui'
import { widgets } from './widgets'

declare global {
  interface Window {
    // аварийный таймер в <head> (components/SiteDocument.tsx) проверяет, запустился ли движок
    __clickableBooted?: boolean
  }
}

export function boot(strings: EngineStrings) {
  if (app.booted) return
  try {
    initCore(strings)
    stage.init()
    hero.init()
    ui.init()
    widgets.init()
    globeModule.init()
    marquee.init(U.$('[data-marquee]'))
    cursor.init()
    rest.init()
  } catch (e) {
    console.error(e)
    document.documentElement.classList.add('is-loaded')
    return
  }
  app.booted = true
  window.__clickableBooted = true

  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
  const fontsSafe = Promise.race([fonts, new Promise((r) => setTimeout(r, 3000))])

  // всё, что меряет текст, — после шрифтов
  fontsSafe.then(() => {
    try {
      hero.build()
      ui.reel()
      ui.process()
      ui.reveals()
      ui.aboutPhoto()
      ui.footerMark()
      ui.footer()
      ui.nav()
      const mq = U.$('[data-marquee]')
      if (mq) {
        ScrollTrigger.create({
          trigger: mq,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (st) => marquee.setActive(st.isActive)
        })
      }
      onResize(text.refresh)
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
      // после перезагрузки — на запомненную секцию, но в её «готовом» состоянии
      rest.restore()
    } catch (e) {
      console.error(e)
    }
    document.documentElement.classList.add('is-ready')
  })

  // пока идёт загрузка, страница для скринридеров «занята»
  const main = document.getElementById('main')
  if (main) main.setAttribute('aria-busy', 'true')

  preloader(fontsSafe, () => {
    rest.settle()
    if (app.lenis) app.lenis.start()
    if (main) main.removeAttribute('aria-busy')
    hero.intro()
  })
}
