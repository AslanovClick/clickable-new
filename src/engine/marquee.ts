/* Лента логотипов: бесконечная, ускоряется от скорости скролла, замедляется под курсором; плашка наклоняется к курсору */
import { app, onResize, onTick, S, U } from './core'

const BASE_SPEED = 38 // px/s

type Row = { row: HTMLElement; track: HTMLElement; count: number; dir: number; x: number; speed: number; setW: number; hover: boolean }

const rows: Row[] = []
let active = false

function measure() {
  rows.forEach((R) => {
    const kids = R.track.children as HTMLCollectionOf<HTMLElement>
    R.setW = kids[R.count].offsetLeft - kids[0].offsetLeft
  })
}

function tick(time: number, dt: number) {
  if (!active) return
  const v = app.lenis ? Math.abs(app.lenis.velocity || 0) : 0
  rows.forEach((R) => {
    const target = R.hover ? 0.08 : 1 + Math.min(v * 0.12, 5)
    R.speed = U.damp(R.speed, target, R.hover ? 6 : 3, dt)
    R.x += R.dir * BASE_SPEED * R.speed * dt
    if (R.x <= -R.setW) R.x += R.setW
    if (R.x > 0) R.x -= R.setW
    R.track.style.transform = 'translate3d(' + R.x.toFixed(2) + 'px,0,0)'
  })
}

function tilt(brand: HTMLElement) {
  if (S.isTouch || S.reduced) return
  brand.addEventListener('mousemove', (e) => {
    const r = brand.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    brand.style.setProperty('--rx', ((0.5 - py) * 24).toFixed(2) + 'deg')
    brand.style.setProperty('--ry', ((px - 0.5) * 28).toFixed(2) + 'deg')
  })
  brand.addEventListener('mouseleave', () => {
    brand.style.setProperty('--rx', '0deg')
    brand.style.setProperty('--ry', '0deg')
  })
}

export const marquee = {
  init(root: HTMLElement | null) {
    if (!root) return
    U.$$('.marquee__row', root).forEach((row) => {
      const track = U.$('.marquee__track', row)
      const items = Array.from(track.children)
      // копии набора, чтобы лента была бесшовной на любой ширине
      for (let k = 0; k < 3; k++) {
        items.forEach((it) => {
          const c = it.cloneNode(true) as HTMLElement
          c.setAttribute('aria-hidden', 'true')
          c.setAttribute('tabindex', '-1')
          track.appendChild(c)
        })
      }
      const R: Row = { row, track, count: items.length, dir: parseFloat(row.getAttribute('data-dir') || '-1'), x: 0, speed: 1, setW: 0, hover: false }
      row.addEventListener('mouseenter', () => (R.hover = true))
      row.addEventListener('mouseleave', () => (R.hover = false))
      rows.push(R)
    })
    U.$$('[data-brand]', root).forEach(tilt)
    measure()
    rows.forEach((R) => {
      if (R.dir > 0) R.x = -R.setW
    })
    onResize(measure)
    // логотипы могли ещё грузиться — после load ширину набора перемеряем
    if (document.readyState !== 'complete') window.addEventListener('load', measure)
    onTick(tick)
  },

  setActive(v: boolean) {
    active = v && !S.reduced
  }
}
