/* Курсор: точка + рамка из уголков с инерцией, красный шлейф, координаты.
   Ссылки/кнопки — «захват цели» (рамка обхватывает элемент), [data-cursor] — подпись («Смотреть»),
   [data-cursor-drag] — «Тяните», поля — мигающая каретка, клик — ударная волна. На светлых секциях уголки тёмные.
   Только для мыши; при prefers-reduced-motion остаётся системный курсор. */
import gsap from 'gsap'
import { onResize, onTick, S, t, U } from './core'

const LOCK = 'a, button, [role="button"], label, select, summary'
const FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]), textarea'
const CARD = '[data-tilt], [data-step], [data-brand]'
const TRAIL_LENGTH = 9 // точек в хвосте (кадров)
const TRAIL_ALPHA = 0.32 // непрозрачность у головы хвоста

let el: HTMLElement
let dot: HTMLElement
let frame: HTMLElement
let label: HTMLElement
let trail: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
const pos = { x: -200, y: -200 }
const dp = { x: -200, y: -200 }
const fr = { x: -200, y: -200, w: 28, h: 28 }
const st = { down: 1 }
let mode = 'default'
let target: Element | null = null
let text = ''
let visible = false
let light = false
const pts: { x: number; y: number }[] = []
let idle = 0
let lastLabel = ''

function pad(n: number) {
  return ('000' + Math.max(0, Math.round(n))).slice(-4)
}

function setMode(m: string, tg?: Element | null, txt?: string | null) {
  target = tg || null
  text = txt || ''
  if (m === mode) return
  el.classList.remove('is-' + mode)
  mode = m
  el.classList.add('is-' + mode)
}

// что под курсором
function resolve(tg: Element | null) {
  if (!tg || !tg.closest) return setMode('default')
  const l = !!tg.closest('.sec--light')
  if (l !== light) {
    light = l
    el.classList.toggle('is-on-light', l)
  }
  if (tg.closest(FIELD)) return setMode('text')
  const lab = tg.closest('[data-cursor]')
  if (lab) return setMode('label', lab, lab.getAttribute('data-cursor'))
  const hit = tg.closest(LOCK)
  if (hit) return setMode('lock', hit)
  if (tg.closest('[data-cursor-drag]')) return setMode('drag', null, t('drag'))
  if (tg.closest(CARD)) return setMode('card', tg.closest(CARD))
  setMode('default')
}

function show(v: boolean) {
  if (v === visible) return
  visible = v
  el.classList.toggle('is-visible', v)
}

function ripple() {
  const r = document.createElement('span')
  r.className = 'cursor__ripple'
  el.appendChild(r)
  gsap.set(r, { x: pos.x, y: pos.y })
  gsap.fromTo(
    r,
    { scale: 0.2, opacity: 1 },
    {
      scale: 1.7,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: () => r.remove()
    }
  )
}

function resize() {
  trail.width = Math.round(S.vw * S.dpr)
  trail.height = Math.round(S.vh * S.dpr)
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0)
}

function drawTrail() {
  pts.unshift({ x: dp.x, y: dp.y })
  if (pts.length > TRAIL_LENGTH) pts.pop()
  const a = pts[0]
  const b = pts[pts.length - 1]
  const moving = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 0.6
  if (!moving && idle > 1) return
  idle = moving ? 0 : idle + 1
  ctx.clearRect(0, 0, S.vw, S.vh)
  if (!moving || mode === 'text') return
  ctx.lineCap = 'round'
  for (let i = 1; i < pts.length; i++) {
    const k = 1 - i / pts.length
    ctx.strokeStyle = 'rgba(255,25,35,' + (k * TRAIL_ALPHA).toFixed(3) + ')'
    ctx.lineWidth = 0.4 + 1.8 * k
    ctx.beginPath()
    ctx.moveTo(pts[i - 1].x, pts[i - 1].y)
    ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
  }
}

function tick(time: number, dt: number) {
  if (!visible) return
  // точка — почти без задержки, рамка — с мягкой инерцией
  dp.x = U.damp(dp.x, pos.x, 38, dt)
  dp.y = U.damp(dp.y, pos.y, 38, dt)

  let tx: number, ty: number, tw: number, th: number
  if (mode === 'lock' && target && target.isConnected) {
    const r = target.getBoundingClientRect()
    tx = r.left - 6
    ty = r.top - 6
    tw = r.width + 12
    th = r.height + 12
  } else {
    const size = mode === 'label' || mode === 'drag' ? 54 : mode === 'card' ? 44 : 28
    tx = pos.x - size / 2
    ty = pos.y - size / 2
    tw = size
    th = size
  }
  const k = mode === 'lock' ? 16 : 13
  fr.x = U.damp(fr.x, tx, k, dt)
  fr.y = U.damp(fr.y, ty, k, dt)
  fr.w = U.damp(fr.w, tw, k, dt)
  fr.h = U.damp(fr.h, th, k, dt)

  dot.style.transform = 'translate3d(' + dp.x.toFixed(1) + 'px,' + dp.y.toFixed(1) + 'px,0)'
  frame.style.width = fr.w.toFixed(1) + 'px'
  frame.style.height = fr.h.toFixed(1) + 'px'
  frame.style.transform = 'translate3d(' + fr.x.toFixed(1) + 'px,' + fr.y.toFixed(1) + 'px,0) scale(' + st.down.toFixed(3) + ')'

  // подпись под рамкой: координаты или текст режима
  const txt = text || 'X ' + pad(pos.x) + ' · Y ' + pad(pos.y)
  if (txt !== lastLabel) {
    lastLabel = txt
    label.textContent = txt
  }
  label.style.transform = 'translate3d(' + (fr.x + fr.w + 8).toFixed(1) + 'px,' + (fr.y + fr.h + 4).toFixed(1) + 'px,0)'

  drawTrail()
}

export const cursor = {
  init() {
    if (S.reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    el = document.createElement('div')
    el.className = 'cursor is-default'
    el.setAttribute('aria-hidden', 'true')
    el.innerHTML =
      '<canvas class="cursor__trail"></canvas>' +
      '<div class="cursor__frame">' +
      '<span class="cursor__c cursor__c--tl"></span><span class="cursor__c cursor__c--tr"></span>' +
      '<span class="cursor__c cursor__c--bl"></span><span class="cursor__c cursor__c--br"></span>' +
      '</div>' +
      '<span class="cursor__dot"></span>' +
      '<span class="cursor__label"></span>'
    document.body.appendChild(el)
    trail = U.$<HTMLCanvasElement>('.cursor__trail', el)
    ctx = trail.getContext('2d')!
    frame = U.$('.cursor__frame', el)
    dot = U.$('.cursor__dot', el)
    label = U.$('.cursor__label', el)
    document.documentElement.classList.add('has-cursor')

    window.addEventListener(
      'mousemove',
      (e) => {
        pos.x = e.clientX
        pos.y = e.clientY
        if (!visible) {
          // первое появление — без «прилёта» из угла
          dp.x = fr.x = pos.x
          dp.y = fr.y = pos.y
          pts.length = 0
          show(true)
        }
      },
      { passive: true }
    )
    document.addEventListener('mouseover', (e) => resolve(e.target as Element))
    document.documentElement.addEventListener('mouseleave', () => show(false))
    window.addEventListener('blur', () => show(false))
    window.addEventListener('mousedown', () => {
      gsap.to(st, { down: 0.8, duration: 0.18, ease: 'power2.out' })
      ripple()
    })
    window.addEventListener('mouseup', () => {
      gsap.to(st, { down: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    })
    // элемент под курсором мог уехать при скролле — пересчитываем режим
    window.addEventListener(
      'scroll',
      () => {
        if (visible) resolve(document.elementFromPoint(pos.x, pos.y))
      },
      { passive: true }
    )

    resize()
    onResize(resize)
    onTick(tick)
  }
}
