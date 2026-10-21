/* Интерфейс: шапка, меню, якоря, магнитные кнопки, наклон карточек, навигация, пин процесса, шоурил, появления секций */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { app, onResize, onTick, S, t, U } from './core'
import { initJump, jumpTo } from './jump'
import { rest } from './rest'
import { reveal } from './reveal'
import { widgets } from './widgets'

let menuOpen = false
let menuApi: { close(): void } | null = null

function header() {
  const el = U.$('[data-header]')
  let lastY = 0
  let hidden = false
  let scrolled = false
  let light = false
  let lights: [number, number][] = []
  // где на странице светлые секции — шапка над ними перекрашивается
  ScrollTrigger.addEventListener('refresh', () => {
    lights = U.$$('.sec--light').map((s) => {
      const r = s.getBoundingClientRect()
      return [r.top + window.scrollY, r.bottom + window.scrollY]
    })
  })
  // клавиатурный фокус внутри шапки — шапку не прячем
  el.addEventListener('focusin', () => {
    hidden = false
    el.classList.remove('is-hidden')
  })
  onTick(() => {
    const y = S.scroll
    const sc = y > 40
    if (sc !== scrolled) {
      scrolled = sc
      el.classList.toggle('is-scrolled', sc)
    }
    const mid = y + 40
    const l = lights.some((r) => mid >= r[0] && mid < r[1]) && !menuOpen
    if (l !== light) {
      light = l
      el.classList.toggle('is-light', l)
    }
    const dy = y - lastY
    if (Math.abs(dy) > 6) {
      const h = dy > 0 && y > S.vh * 0.6 && !menuOpen && !el.contains(document.activeElement)
      if (h !== hidden) {
        hidden = h
        el.classList.toggle('is-hidden', h)
      }
      lastY = y
    }
  })
}

function menu() {
  const btn = U.$('[data-burger]')
  const m = U.$('[data-menu]')
  if (!btn || !m) return
  const links = U.$$('.menu__link, .menu__lang, .menu__bottom a', m)
  const outside = U.$$('main, footer')
  const tl = gsap
    .timeline({ paused: true })
    .set(m, { visibility: 'visible' })
    .fromTo(m, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' })
    .fromTo(links, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.05 }, '-=0.45')

  function set(open: boolean) {
    menuOpen = open
    btn.classList.toggle('is-open', open)
    btn.setAttribute('aria-expanded', open ? 'true' : 'false')
    btn.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'))
    // остальная страница недоступна, пока открыто меню (диалог)
    outside.forEach((el) => (el.inert = open))
    if (open) {
      tl.timeScale(1).play()
      if (app.lenis) app.lenis.stop()
      setTimeout(() => links[0].focus(), 60)
    } else {
      tl.timeScale(1.6).reverse()
      if (app.lenis) app.lenis.start()
      if (m.contains(document.activeElement)) btn.focus()
    }
  }
  btn.addEventListener('click', () => set(!menuOpen))
  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return
    if (e.key === 'Escape') {
      set(false)
      btn.focus()
      return
    }
    // ловушка фокуса: бургер ↔ пункты меню
    if (e.key === 'Tab') {
      const items = [btn].concat(links)
      const i = items.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        items[items.length - 1].focus()
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault()
        items[0].focus()
      }
    }
  })
  menuApi = {
    close() {
      if (menuOpen) set(false)
    }
  }
}

// выбор языка: выпадающий список в шапке; выбор запоминается (корень потом сам ведёт на эту версию)
function langSwitch() {
  U.$$('[data-lang-link]').forEach((a) => {
    a.addEventListener('click', () => {
      try {
        localStorage.setItem('clickable-lang', a.getAttribute('data-lang-link') || '')
      } catch {}
    })
  })
  const root = U.$('[data-lang]')
  if (!root) return
  const btn = U.$('[data-lang-btn]', root)
  const list = U.$('[data-lang-list]', root)
  const items = U.$$('a', list)
  let open = false

  function set(v: boolean, focusBtn?: boolean) {
    open = v
    root.classList.toggle('is-open', v)
    btn.setAttribute('aria-expanded', v ? 'true' : 'false')
    if (v) items[0].focus({ preventScroll: true })
    else if (focusBtn) btn.focus({ preventScroll: true })
  }

  btn.addEventListener('click', () => set(!open))
  document.addEventListener('click', (e) => {
    if (open && !root.contains(e.target as Node)) set(false)
  })
  root.addEventListener('keydown', (e) => {
    if (!open) return
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      set(false, true)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(i + 1) % items.length].focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(i - 1 + items.length) % items.length].focus()
    }
  })
  root.addEventListener('focusout', (e) => {
    if (open && !root.contains(e.relatedTarget as Node | null)) set(false)
  })
  // шапка уехала при скролле — список закрываем
  window.addEventListener(
    'scroll',
    () => {
      if (open) set(false)
    },
    { passive: true }
  )
}

function anchors() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('a[href^="#"]')
    if (!a) return
    const id = a.getAttribute('href')!
    if (id === '#') {
      e.preventDefault()
      return
    }
    const target = U.$(id)
    if (!target) return
    e.preventDefault()
    if (menuApi) menuApi.close()
    // глава/пин — сразу в «готовое» состояние
    jumpTo(id === '#home' ? 0 : rest.target(target), id)
    // фокус — на цель якоря, чтобы клавиатура и скринридер продолжили оттуда
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  })
}

function magnetic() {
  if (S.isTouch || S.reduced) return
  U.$$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' })
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - r.left - r.width / 2) * 0.25)
      yTo((e.clientY - r.top - r.height / 2) * 0.35)
    })
    el.addEventListener('mouseleave', () => {
      xTo(0)
      yTo(0)
    })
  })
}

// наклон к курсору + подсветка, бегущая за курсором
function tilt() {
  if (S.isTouch || S.reduced) return
  function spot(card: HTMLElement, e: MouseEvent) {
    const r = card.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
    card.style.setProperty('--my', (py * 100).toFixed(1) + '%')
    return [px, py]
  }
  U.$$('[data-tilt]').forEach((card) => {
    gsap.set(card, { transformPerspective: 1000 })
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: 'power3.out' })
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: 'power3.out' })
    card.addEventListener('mousemove', (e) => {
      const p = spot(card, e)
      rx((0.5 - p[1]) * 6)
      ry((p[0] - 0.5) * 8)
    })
    card.addEventListener('mouseleave', () => {
      rx(0)
      ry(0)
    })
  })
  U.$$('[data-step], .brief').forEach((card) => {
    card.addEventListener('mousemove', (e) => spot(card, e))
  })
}

function nav() {
  const navEl = U.$('[data-nav]')
  if (!navEl) return
  const links = U.$$('.nav__link', navEl)
  const ind = U.$('[data-nav-indicator]', navEl)
  let current: HTMLElement | null = null

  function move(link: HTMLElement | null, instant?: boolean) {
    if (!link) {
      gsap.to(ind, { scaleX: 0, duration: instant ? 0 : 0.6, ease: 'expo.out' })
      return
    }
    gsap.to(ind, { x: link.offsetLeft, scaleX: link.offsetWidth / 100, duration: instant ? 0 : 0.8, ease: 'expo.out' })
  }

  function setActive(link: HTMLElement | null) {
    if (link === current) return
    if (current) {
      current.classList.remove('is-active')
      current.removeAttribute('aria-current')
    }
    if (link) {
      link.classList.add('is-active')
      link.setAttribute('aria-current', 'true')
    }
    current = link
    move(link)
  }

  links.forEach((l, i) => {
    l.addEventListener('mouseenter', () => move(l))
    const target = U.$(l.getAttribute('href') || '')
    if (!target) return
    const last = i === links.length - 1
    ScrollTrigger.create({
      trigger: target,
      start: last ? 'top 85%' : 'top 55%',
      end: last ? 'bottom bottom' : 'bottom 55%',
      onToggle: (st) => {
        if (st.isActive) setActive(l)
        else if (current === l && !st.isActive && i === 0 && st.direction < 0) setActive(null)
      }
    })
  })
  navEl.addEventListener('mouseleave', () => move(current))
  move(null, true)
  onResize(() => move(current, true))
}

// пин: секция прилипает, шаги едут горизонтально, буквы-осколки собираются
function process() {
  const sec = U.$('[data-process]')
  if (!sec) return
  const track = U.$('[data-process-track]', sec)
  const bar = U.$('[data-process-bar]', sec)
  const idx = U.$('[data-process-index]', sec)
  const steps = U.$$('[data-step]', sec)
  let last = 0

  reveal.onEnter(U.$('.process__head', sec), 'top 75%')
  gsap.fromTo(
    track,
    { opacity: 0, y: 90 },
    {
      opacity: 1,
      y: 0,
      duration: 1.4,
      ease: 'power3.out',
      scrollTrigger: { trigger: sec, start: 'top 70%', once: true }
    }
  )

  function dist() {
    return Math.max(0, track.scrollWidth - S.vw)
  }

  const tween = gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: sec,
      start: 'top top',
      end: () => '+=' + dist(),
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      // пин сдвигает всё ниже — пересчитывается раньше остальных триггеров
      refreshPriority: 1,
      onUpdate: (st) => {
        bar.style.transform = 'scaleX(' + st.progress.toFixed(4) + ')'
        const n = 1 + Math.round(st.progress * (steps.length - 1))
        if (n !== last) {
          last = n
          idx.textContent = '0' + n
        }
      }
    }
  })

  steps.forEach((step) => {
    gsap.fromTo(
      step,
      { opacity: 0.35, scale: 0.94 },
      {
        opacity: 1,
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 100%', end: 'left 60%', scrub: true }
      }
    )
  })

  // «готовые» точки пина: целые шаги счётчика 01…05
  rest.zone(() => {
    const st = tween.scrollTrigger
    if (!st || st.end <= st.start) return null
    return {
      el: sec,
      start: st.start,
      end: st.end,
      points: steps.map((s, i) => st.start + (i / (steps.length - 1)) * (st.end - st.start))
    }
  })
}

// шоурил: рамка раскрывается до полного экрана, видео играет только в кадре
function reel() {
  const sec = U.$('[data-reel]')
  if (!sec) return
  const box = U.$('[data-reel-box]', sec)
  const video = U.$<HTMLVideoElement>('[data-reel-video]', sec)
  reveal.onEnter(U.$('.reel__content', sec), 'top 60%')
  if (!S.reduced) {
    gsap.fromTo(
      box,
      { clipPath: 'inset(12% 9% 12% 9% round 18px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        ease: 'none',
        scrollTrigger: { trigger: box, start: 'top 92%', end: 'top 8%', scrub: true }
      }
    )
    gsap.fromTo(
      video,
      { scale: 1.18 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true }
      }
    )
  }
  ScrollTrigger.create({
    trigger: box,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (st) => {
      if (st.isActive) {
        if (!video.src) video.src = video.getAttribute('data-src') || ''
        video.muted = true
        if (!S.reduced) video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
  })
  U.$('[data-reel-play]', sec).addEventListener('click', () => widgets.reel())
}

// фото команды — параллакс внутри рамки
function aboutPhoto() {
  const img = U.$('[data-about-img]')
  if (!img || S.reduced) return
  gsap.fromTo(
    img,
    { yPercent: -7 },
    {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: img.parentNode as Element, start: 'top bottom', end: 'bottom top', scrub: true }
    }
  )
}

// огромный логотип в подвале: буквы поднимаются волной
function footerMark() {
  const mark = U.$('[data-footer-mark]')
  if (!mark) return
  const chars = U.$$('span', mark)
  if (S.reduced) return
  gsap.set(chars, { yPercent: 100, opacity: 0 })
  ScrollTrigger.create({
    trigger: mark,
    start: 'top 95%',
    once: true,
    onEnter: () => {
      gsap.to(chars, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.06 })
      chars.forEach((c, i) => {
        gsap.delayedCall(0.5 + i * 0.08, () => {
          c.classList.add('is-lit')
          gsap.delayedCall(0.45, () => c.classList.remove('is-lit'))
        })
      })
    }
  })
}

// появления: заголовки секций — «сценой», карточки — пачками по мере появления
function reveals() {
  U.$$('.sec__head, .about__top, .about__stats, .about__proof, .about__faq-head, .geo__info, .contact__main, .slider__head, .work__foot').forEach((scope) => {
    reveal.onEnter(scope, 'top 80%')
  })
  const items = U.$$('.acc__item[data-card], .case[data-card]')
  if (!items.length) return
  if (S.reduced) return
  gsap.set(items, { opacity: 0, y: 50 })
  ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    // при прыжке по якорю в пачку попадает всё, что выше, — анимируем только видимое, остальное показываем сразу
    onEnter: (batch) => {
      const vis = batch.filter((el) => {
        const r = el.getBoundingClientRect()
        return r.bottom > 0 && r.top < S.vh
      })
      gsap.set(
        batch.filter((el) => !vis.includes(el)),
        { opacity: 1, y: 0, overwrite: true }
      )
      gsap.to(vis, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08, overwrite: true })
    }
  })
}

export const ui = {
  init() {
    header()
    menu()
    langSwitch()
    initJump()
    anchors()
    magnetic()
    tilt()
    U.$$('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())))
  },
  nav,
  process,
  reel,
  aboutPhoto,
  footerMark,
  reveals,
  footer() {
    reveal.fades(U.$('.footer'))
  }
}
