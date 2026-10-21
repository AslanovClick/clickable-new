/* Ядро: общее состояние, плавный скролл (Lenis) и единый цикл кадров на тикере GSAP */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import type { EngineStrings } from '@/content/page'

export type Frame = (time: number, dt: number) => void

// Lenis создаётся при запуске (при prefers-reduced-motion его нет — обычный скролл)
export const app = { lenis: null as Lenis | null, booted: false }

// строки интерфейса и числа по правилам языка страницы (словарь приходит из content/page.ts)
let I18N = {} as EngineStrings
const numFormats: Record<string, { format(v: number): string }> = {}

export function t<K extends keyof EngineStrings>(key: K): EngineStrings[K] {
  return I18N[key]
}

export function num(v: number, dec = 0, group = false): string {
  const k = dec + (group ? 'g' : '')
  if (!numFormats[k]) {
    try {
      numFormats[k] = new Intl.NumberFormat(I18N.intl || 'ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: group })
    } catch {
      numFormats[k] = { format: (x) => x.toFixed(dec) }
    }
  }
  return numFormats[k].format(v)
}

export const U = {
  clamp: (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v),
  lerp: (a: number, b: number, k: number): number => a + (b - a) * k,
  range: (v: number, a: number, b: number): number => U.clamp((v - a) / (b - a), 0, 1),
  damp: (a: number, b: number, lambda: number, dt: number): number => U.lerp(a, b, 1 - Math.exp(-lambda * dt)),
  smooth: (k: number): number => k * k * (3 - 2 * k),
  // разметку собирают наши компоненты: элемент считается найденным, где он необязателен — стоит проверка
  $: <T extends Element = HTMLElement>(s: string, ctx?: ParentNode | null): NoInfer<T> => (ctx || document).querySelector(s) as T,
  $$: <T extends Element = HTMLElement>(s: string, ctx?: ParentNode | null): NoInfer<T>[] => Array.from((ctx || document).querySelectorAll<T>(s))
}

export const S = {
  vw: 0,
  vh: 0,
  dpr: 1,
  isMobile: false,
  isTouch: false,
  reduced: false,
  scroll: 0,
  time: 0,
  mouse: { x: 0, y: 0, sx: 0, sy: 0 }
}

const reads: Frame[] = []
const ticks: Frame[] = []
const resizers: (() => void)[] = []

// read — только чтение layout (getBoundingClientRect), tick — запись стилей и рендер
export function onRead(fn: Frame) {
  reads.push(fn)
}
export function onTick(fn: Frame) {
  ticks.push(fn)
}
export function onResize(fn: () => void) {
  resizers.push(fn)
}

function measure() {
  S.vw = window.innerWidth
  S.vh = window.innerHeight
  S.isMobile = S.vw < 768 || S.vw / S.vh < 0.8
  S.dpr = Math.min(window.devicePixelRatio || 1, 2)
}

export function initCore(strings: EngineStrings) {
  I18N = strings
  S.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  S.isTouch = window.matchMedia('(hover: none)').matches
  if (S.reduced) document.documentElement.classList.add('is-reduced')

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
  measure()

  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.config({ ignoreMobileResize: true })

  if (!S.reduced) {
    app.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true })
    app.lenis.on('scroll', ScrollTrigger.update)
    app.lenis.stop()
  }

  gsap.ticker.add((time, deltaTime) => {
    const dt = Math.min(deltaTime / 1000, 0.1)
    if (app.lenis) app.lenis.raf(time * 1000)
    S.time = time
    S.scroll = window.scrollY || window.pageYOffset
    S.mouse.sx = U.damp(S.mouse.sx, S.mouse.x, 3.5, dt)
    S.mouse.sy = U.damp(S.mouse.sy, S.mouse.y, 3.5, dt)
    for (let i = 0; i < reads.length; i++) reads[i](time, dt)
    for (let i = 0; i < ticks.length; i++) ticks[i](time, dt)
  })
  gsap.ticker.lagSmoothing(0)

  if (!S.isTouch) {
    window.addEventListener(
      'mousemove',
      (e) => {
        S.mouse.x = (e.clientX / S.vw) * 2 - 1
        S.mouse.y = (e.clientY / S.vh) * 2 - 1
      },
      { passive: true }
    )
  }

  let lastW = S.vw
  let lastH = S.vh
  let timer: ReturnType<typeof setTimeout>
  window.addEventListener('resize', () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const w = window.innerWidth
      const h = window.innerHeight
      // на телефонах прячется/появляется адресная строка — это не настоящий ресайз
      if (S.isTouch && w === lastW && Math.abs(h - lastH) < 160) return
      lastW = w
      lastH = h
      measure()
      resizers.forEach((fn) => fn())
      ScrollTrigger.refresh()
    }, 150)
  })
}

// высота контента поменялась (аккордеон, фильтр) — пины ниже должны пересчитаться
let refreshTimer: ReturnType<typeof setTimeout>
export function refresh(delay?: number) {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), delay == null ? 60 : delay)
}

const expoOut = (k: number) => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k))

// плавный скролл (для близких целей; дальние переходы — через шторку, см. jumpTo в jump.ts)
export function scrollTo(target: number | HTMLElement, done?: () => void) {
  if (app.lenis) {
    app.lenis.scrollTo(target, { duration: 1.3, easing: expoOut, onComplete: done })
    return
  }
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: y, behavior: S.reduced ? 'auto' : 'smooth' })
  if (done) setTimeout(done, S.reduced ? 0 : 800)
}
