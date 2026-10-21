/* Hero-«глава»: липкая сцена, прогресс скролла → разлёт букв CLICKABLE, отрыв буквы A (её рисует stage.ts),
   манифест — слова загораются по скроллу. Здесь же меряется, где в слове стоит A, — по этим цифрам 3D-буква
   встаёт ровно на место глифа */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onRead, onResize, onTick, S, t, U } from './core'
import { rest } from './rest'
import { reveal } from './reveal'
import { text } from './text'

const FADE = 0.035 // доля главы на въезд/выезд панели
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/'
// метрики A в шрифте CLICKABLE (доли кегля): левый/правый край, высота прописной
const A_LEFT = -0.063
const A_RIGHT = 0.722
const A_CAP = 0.706

type Panel = { el: HTMLElement; a: number; b: number; rest: number; on?: boolean; entered?: boolean }

let el: HTMLElement | null = null
let stage: HTMLElement
let mark: HTMLElement
let letters: HTMLElement[] = []
let aEl: HTMLElement
let baseEl: HTMLElement
let panels: Panel[] = []
let st: ScrollTrigger | null = null
let p = 0
let stageTop = 0
let stageLeft = 0
const glyph = { ox: 0, oy: 0, h: 0, w: 0 }
const hooks: (() => void)[] = []
const out = { p: 0, glyph: { x: 0, y: 0, h: 0 } }

// смещение элемента относительно предка — без учёта transform (буквы в это время анимируются)
function offsetTo(node: HTMLElement | null, anc: HTMLElement) {
  let x = 0
  let y = 0
  while (node && node !== anc) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { x, y }
}

function measureGlyph() {
  const F = parseFloat(getComputedStyle(mark).fontSize)
  const a = offsetTo(aEl, stage)
  const b = offsetTo(baseEl, stage)
  glyph.h = A_CAP * F
  glyph.w = (A_RIGHT - A_LEFT) * F
  glyph.ox = a.x + ((A_LEFT + A_RIGHT) / 2) * F
  glyph.oy = b.y - glyph.h / 2
}

function read() {
  const r = stage.getBoundingClientRect()
  stageTop = r.top
  stageLeft = r.left
}

// ---------- разлёт букв (кроме A) ----------
function scatter(tl: gsap.core.Timeline) {
  const ai = letters.indexOf(aEl)
  const desk = !S.isMobile
  letters.forEach((ch, i) => {
    if (ch === aEl) return
    const d = i - ai
    const dir = d < 0 ? -1 : 1
    const dist = Math.abs(d)
    const start = 0.03 + (dist - 1) * 0.018
    const to: gsap.TweenVars = {
      xPercent: dir * (150 + dist * 95),
      yPercent: Math.sin(i * 2.3) * 70,
      rotation: dir * (10 + dist * 5),
      rotationY: dir * (40 + dist * 7),
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      immediateRender: false
    }
    if (desk) to.filter = 'blur(10px)'
    tl.fromTo(ch, { xPercent: 0, yPercent: 0, rotation: 0, rotationY: 0, opacity: 1, filter: 'blur(0px)', transformPerspective: 900 }, to, start)
  })
  const tag = U.$('[data-hero-tag]', el)
  const foot = U.$('[data-hero-foot]', el)
  tl.fromTo([tag, foot], { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 0.08, ease: 'power1.in', immediateRender: false }, 0.012)
}

// ---------- манифест: слова загораются по скроллу (слова разбиты на сервере, см. sections/Hero.tsx) ----------
function manifesto(P: Panel) {
  const spans = U.$$('[data-words] .w', P.el)
  let last = -1
  hooks.push(() => {
    const local = U.range(p, P.a + 0.01, P.b - 0.07)
    if (Math.abs(local - last) < 0.0005) return
    last = local
    const x = local * (spans.length + 1.5) - 0.5
    for (let i = 0; i < spans.length; i++) {
      spans[i].style.opacity = (0.14 + 0.86 * U.clamp(x - i, 0, 1)).toFixed(3)
    }
  })
}

// «with desire» — слово меняется с эффектом дешифровки
function loves() {
  const w = U.$('[data-hero-love]', el)
  const list = t('loves')
  if (!w || !list || !list.length || S.reduced) return
  let i = 0
  setInterval(() => {
    if (document.hidden || p > 0.1) return
    i = (i + 1) % list.length
    const target = list[i].toLowerCase()
    const o = { t: 0 }
    gsap.to(o, {
      t: 1,
      duration: 0.6,
      ease: 'none',
      onUpdate: () => {
        const n = Math.round(target.length * o.t)
        let s = target.slice(0, n)
        for (let k = n; k < target.length; k++) s += GLYPHS[(Math.random() * GLYPHS.length) | 0]
        w.textContent = s
      },
      onComplete: () => {
        w.textContent = target
      }
    })
  }, 2800)
}

function build() {
  const tl = gsap.timeline({ paused: true })
  const shift = S.reduced ? 0 : 1
  panels.forEach((P) => {
    if (P.a > 0) {
      tl.fromTo(P.el, { opacity: 0, y: 90 * shift }, { opacity: 1, y: 0, duration: FADE, ease: 'power2.out' }, P.a)
    } else {
      gsap.set(P.el, { opacity: 1 })
    }
    if (P.b < 1) {
      tl.fromTo(P.el, { opacity: 1 }, { opacity: 0, duration: FADE, ease: 'power2.in', immediateRender: false }, P.b - FADE)
    }
  })
  scatter(tl)
  tl.to({}, { duration: 0.001 }, 1)
  tl.progress(0)

  const man = panels[1]
  const mg = reveal.group(man.el)
  if (S.reduced) mg.progress(1)

  function sync() {
    panels.forEach((P) => {
      const o = parseFloat(P.el.style.opacity)
      const on = (isNaN(o) ? 1 : o) > 0.5
      if (on !== P.on) {
        P.on = on
        P.el.style.pointerEvents = on ? '' : 'none'
      }
    })
  }

  st = ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (s) => {
      p = s.progress
      tl.progress(p)
      sync()
      if (!man.entered && p >= man.a) {
        man.entered = true
        mg.play()
      }
    }
  })

  // Tab в манифест посреди перехода — встаём на его «готовую» точку
  man.el.addEventListener('focusin', () => {
    if (p < man.a + FADE) rest.go(restY(man))
  })
}

function restY(P: Panel) {
  const a = P.a > 0 ? P.a + FADE : 0
  const b = P.b < 1 ? P.b - FADE : 1
  const k = P.a === 0 ? 0 : a + (b - a) * P.rest
  return st!.start + k * (st!.end - st!.start)
}

export const hero = {
  init() {
    el = U.$('[data-hero]')
    if (!el) return
    stage = U.$('.hero__stage', el)
    mark = U.$('[data-hero-mark]', el)
    letters = U.$$('.hero__ch', mark)
    aEl = U.$('[data-hero-a]', el)
    baseEl = U.$('[data-hero-base]', el)
    panels = U.$$('[data-panel]', el).map((n) => ({
      el: n,
      a: parseFloat(n.getAttribute('data-in') || '0'),
      b: parseFloat(n.getAttribute('data-out') || '1'),
      rest: parseFloat(n.getAttribute('data-rest-at') || '0.3')
    }))
    // до прелоадера буквы спрятаны под нижним краем строки
    gsap.set(letters, { y: '1.05em' })
    gsap.set(mark, { clipPath: 'inset(-30% -30% 0% -30%)' })
    onRead(read)
    onTick(() => {
      for (let i = 0; i < hooks.length; i++) hooks[i]()
    })
  },

  // после загрузки шрифтов: меряем глиф и строим скролл-сцену
  build() {
    if (!el) return
    measureGlyph()
    onResize(measureGlyph)
    manifesto(panels[1])
    build()
    loves()
    rest.zone(() => {
      if (!st) return null
      return { el: el!, start: st.start, end: st.end, points: panels.map(restY) }
    })
  },

  // где сейчас стоит A (в px экрана) и прогресс главы — для 3D-сцены
  state() {
    out.p = p
    out.glyph.x = stageLeft + glyph.ox
    out.glyph.y = stageTop + glyph.oy
    out.glyph.h = glyph.h
    return out
  },

  // прямоугольник глифа A (для перелёта буквы из прелоадера)
  glyphRect() {
    read()
    return { x: stageLeft + glyph.ox - glyph.w / 2, y: stageTop + glyph.oy - glyph.h / 2, w: glyph.w, h: glyph.h }
  },

  range() {
    return st ? { start: st.start, end: st.end } : null
  },

  // буквы поднимаются вокруг уже стоящей A, подпись дешифруется
  intro() {
    if (!el) return
    const others = letters.filter((l) => l !== aEl)
    const tag = U.$('[data-hero-tag-text]', el)
    const foot = U.$('[data-hero-foot]', el)
    gsap.set(aEl, { y: 0 })
    if (S.reduced) {
      gsap.set(others, { y: 0 })
      gsap.set(mark, { clipPath: 'none' })
      return
    }
    gsap.set(foot, { opacity: 0, y: 16 })
    gsap
      .timeline()
      .to(others, { y: 0, duration: 1.35, ease: 'expo.out', stagger: { each: 0.055, from: 'center' } }, 0)
      .set(mark, { clipPath: 'none' })
      .add(() => {
        text.scramble(tag, { per: 0.03, dur: 0.5 }).play()
      }, 0.45)
      .to(foot, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.8)
  }
}
