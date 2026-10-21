/* Дальний переход: шторка закрывает экран → страница мгновенно встаёт на цель → шторка уходит вверх.
   Близкие цели (до ~1.6 экрана) — обычный плавный скролл */
import gsap from 'gsap'
import { S, scrollTo, t, U } from './core'
import { rest } from './rest'
import { text } from './text'

let el: HTMLElement | null = null
let red: HTMLElement
let ink: HTMLElement
let glyph: HTMLElement
let label: HTMLElement
let busy = false

export function initJump() {
  el = U.$('[data-jump]')
  if (!el) return
  red = U.$('[data-jump-red]', el)
  ink = U.$('[data-jump-ink]', el)
  glyph = U.$('.jump__a', el)
  label = U.$('[data-jump-label]', el)
}

export function jumpTo(target: number | HTMLElement, id: string, done?: () => void) {
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY
  const far = Math.abs(y - window.scrollY) > S.vh * 1.6
  if (!el || S.reduced || !far) {
    scrollTo(target, done)
    return
  }
  if (busy) return
  busy = true
  const l = t('sections')[id] || ['', '']
  label.innerHTML = ''
  if (l[0]) {
    const num = document.createElement('b')
    num.textContent = '[' + l[0] + ']'
    label.appendChild(num)
  }
  const txt = document.createElement('span')
  txt.textContent = l[1]
  label.appendChild(txt)

  gsap
    .timeline({
      onComplete: () => {
        busy = false
        if (done) done()
      }
    })
    .set(el, { visibility: 'visible', pointerEvents: 'auto' })
    .fromTo(red, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'power3.inOut' }, 0)
    .fromTo(ink, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'power3.inOut' }, 0.08)
    .fromTo(glyph, { scale: 0.6, rotation: -12, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.32)
    .add(() => {
      text.scramble(txt, { per: 0.03, dur: 0.35 }).play()
    }, 0.36)
    // экран закрыт — прыгаем (пины и сцены пересчитываются, пока шторка стоит)
    .add(() => rest.go(y), 0.66)
    .to(glyph, { scale: 1.12, opacity: 0, duration: 0.35, ease: 'power2.in' }, 1.02)
    .to(label, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, 1.02)
    .to(ink, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, 1.1)
    .to(red, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, 1.18)
    .set(label, { opacity: 1, y: 0 })
    .set(el, { visibility: 'hidden', pointerEvents: 'none' })
}
