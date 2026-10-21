/* Виджеты: аккордеоны (+ превью за курсором), табы с бегущей плашкой, масонри-фильтр кейсов (FLIP),
   слайдер с перетаскиванием, интерактивный бриф, просмотрщик кейсов и шоурила */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { app, onResize, refresh, S, t, U } from './core'
import { jumpTo } from './jump'
import { text } from './text'

type AccItem = { el: HTMLElement; btn: HTMLElement; panel: HTMLElement; inner: HTMLElement; video: HTMLVideoElement | null; open: boolean }
type Lightbox = {
  el: HTMLElement
  frame: HTMLElement
  media: HTMLElement
  num: HTMLElement
  of: HTMLElement
  title: HTMLElement
  kind: HTMLElement
  text: HTMLElement
  order: number[]
  pos: number
  opener: HTMLElement | null
  open: boolean
  close: () => void
  show: (opener: HTMLElement, ev: MouseEvent | null) => void
}

let filterApi: ((cat: string) => void) | null = null
let lb: Lightbox | null = null

function playVideo(v: HTMLVideoElement | null) {
  if (!v) return
  if (!v.getAttribute('src') && v.getAttribute('data-src')) v.src = v.getAttribute('data-src')!
  // muted — и свойством: без него браузер не даст запустить ролик без клика
  v.muted = true
  if (!S.reduced) v.play().catch(() => {})
}

// ---------- аккордеон ----------
function accordion(root: HTMLElement) {
  const items: AccItem[] = U.$$('[data-acc-item]', root).map((it) => ({
    el: it,
    btn: U.$('[data-acc-btn]', it),
    panel: U.$('[data-acc-panel]', it),
    inner: U.$('.acc__inner', it),
    video: U.$<HTMLVideoElement>('video', it),
    open: it.classList.contains('is-open')
  }))
  let inView = false

  function set(I: AccItem, v: boolean) {
    if (I.open === v) return
    I.open = v
    I.el.classList.toggle('is-open', v)
    I.btn.setAttribute('aria-expanded', v ? 'true' : 'false')
    gsap.killTweensOf([I.panel, I.inner])
    if (v) {
      I.panel.hidden = false
      gsap.fromTo(I.panel, { height: 0 }, { height: 'auto', duration: S.reduced ? 0 : 0.9, ease: 'expo.out', onComplete: () => refresh() })
      gsap.fromTo(I.inner, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.08, ease: 'power3.out' })
      if (inView) playVideo(I.video)
    } else {
      gsap.to(I.panel, {
        height: 0,
        duration: S.reduced ? 0 : 0.6,
        ease: 'expo.inOut',
        onComplete: () => {
          I.panel.hidden = true
          refresh()
        }
      })
      if (I.video) I.video.pause()
    }
  }

  items.forEach((I, i) => {
    I.btn.addEventListener('click', () => {
      const v = !I.open
      if (v) items.forEach((J) => J !== I && set(J, false))
      set(I, v)
    })
    // стрелки, Home/End — между заголовками
    I.btn.addEventListener('keydown', (e) => {
      const k = ({ ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 } as Record<string, number>)[e.key]
      if (k == null) return
      e.preventDefault()
      items[(k + items.length) % items.length].btn.focus()
    })
  })

  // видео в открытом пункте играет, только пока аккордеон в кадре
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (st) => {
      inView = st.isActive
      items.forEach((I) => {
        if (!I.open || !I.video) return
        if (inView) playVideo(I.video)
        else I.video.pause()
      })
    }
  })
  return items
}

// превью услуги летит за курсором над закрытыми пунктами
function accFloat(root: HTMLElement, items: AccItem[]) {
  const fl = U.$('[data-acc-float]')
  if (!fl || S.isTouch || S.reduced) return
  const img = U.$<HTMLImageElement>('img', fl)
  const xTo = gsap.quickTo(fl, 'x', { duration: 0.55, ease: 'power3.out' })
  const yTo = gsap.quickTo(fl, 'y', { duration: 0.55, ease: 'power3.out' })
  const rTo = gsap.quickTo(fl, 'rotation', { duration: 0.8, ease: 'power3.out' })
  let lastX = 0
  let shown = false
  let cur = ''

  function show(v: boolean) {
    if (v === shown) return
    shown = v
    gsap.to(fl, { opacity: v ? 1 : 0, scale: v ? 1 : 0.6, duration: 0.5, ease: v ? 'back.out(1.6)' : 'power2.in', overwrite: 'auto' })
  }

  root.addEventListener('mousemove', (e) => {
    const hit = items.find((x) => x.btn.contains(e.target as Node))
    if (!hit || hit.open) {
      show(false)
      return
    }
    const src = hit.btn.getAttribute('data-preview')
    if (src && src !== cur) {
      cur = src
      img.src = src
    }
    if (!shown) gsap.set(fl, { x: e.clientX, y: e.clientY })
    xTo(e.clientX)
    yTo(e.clientY)
    rTo(U.clamp((e.clientX - lastX) * 0.6, -14, 14))
    lastX = e.clientX
    show(true)
  })
  root.addEventListener('mouseleave', () => show(false))
  root.addEventListener('click', () => show(false))
  window.addEventListener(
    'scroll',
    () => {
      if (shown) show(false)
    },
    { passive: true }
  )
}

// ---------- табы: бегущая плашка + клавиатура ----------
function tabs(root: HTMLElement, onSelect: (btn: HTMLElement) => void) {
  const ind = U.$('[data-tabs-ind]', root)
  const btns = U.$$('[role="tab"]', root)
  let current = btns.filter((b) => b.getAttribute('aria-selected') === 'true')[0] || btns[0]

  function move(btn: HTMLElement, instant?: boolean) {
    gsap.to(ind, { x: btn.offsetLeft, y: btn.offsetTop, width: btn.offsetWidth, height: btn.offsetHeight, duration: instant ? 0 : 0.65, ease: 'expo.out' })
  }

  function select(btn: HTMLElement, focus?: boolean) {
    if (btn !== current) {
      current.setAttribute('aria-selected', 'false')
      current.setAttribute('tabindex', '-1')
      btn.setAttribute('aria-selected', 'true')
      btn.setAttribute('tabindex', '0')
      current = btn
      onSelect(btn)
    }
    if (focus) btn.focus()
    move(btn)
  }

  btns.forEach((b, i) => {
    b.addEventListener('click', () => select(b))
    b.addEventListener('keydown', (e) => {
      const k = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: btns.length - 1 } as Record<string, number>)[e.key]
      if (k == null) return
      e.preventDefault()
      select(btns[(k + btns.length) % btns.length], true)
    })
  })
  move(current, true)
  onResize(() => move(current, true))
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => move(current, true))
  return {
    select(id: string, attr: string) {
      const b = btns.filter((x) => x.getAttribute(attr) === id)[0]
      if (b) select(b)
    }
  }
}

// ---------- кейсы: масонри + фильтр с FLIP ----------
function work() {
  const grid = U.$('[data-work-grid]')
  if (!grid) return
  const cards = U.$$('.case', grid)
  let cols: HTMLElement[] = []
  let visible = cards.slice()
  let busy = false

  function count() {
    return S.vw < 768 ? 2 : S.vw < 1100 ? 3 : 5
  }

  // раскладка: первый ряд — по порядку слева направо, дальше каждая карточка — в самую короткую колонку
  function layout(list: HTMLElement[]) {
    const n = count()
    if (cols.length !== n) {
      cards.forEach((c) => grid.appendChild(c))
      cols.forEach((c) => c.remove())
      cols = []
      for (let i = 0; i < n; i++) {
        const col = document.createElement('div')
        col.className = 'work__col'
        grid.insertBefore(col, cards[0])
        cols.push(col)
      }
      grid.classList.add('is-masonry')
    }
    // стартовая высота колонки — её отступ сверху («гуляющие» колонки)
    const h = cols.map((c) => parseFloat(getComputedStyle(c).paddingTop) || 0)
    list.forEach((card, i) => {
      const k = i < n ? i : h.indexOf(Math.min(...h))
      cols[k].appendChild(card)
      h[k] += card.offsetHeight + 16
    })
    cards.forEach((c) => {
      if (!list.includes(c)) cols[cols.length - 1].appendChild(c)
    })
  }

  function apply(cat: string) {
    if (busy) return
    const next = cards.filter((c) => cat === 'all' || (c.getAttribute('data-cats') || '').split(' ').includes(cat))
    const leaving = visible.filter((c) => !next.includes(c))
    const entering = next.filter((c) => !visible.includes(c))
    const first = new Map<HTMLElement, DOMRect>()
    visible.forEach((c) => first.set(c, c.getBoundingClientRect()))
    busy = true
    gsap.killTweensOf(cards)

    function swap() {
      leaving.forEach((c) => (c.hidden = true))
      entering.forEach((c) => (c.hidden = false))
      gsap.set(next, { opacity: 1, scale: 1, x: 0, y: 0 })
      layout(next)
      next.forEach((c) => {
        const f = first.get(c)
        if (!f || entering.includes(c)) return
        const r = c.getBoundingClientRect()
        gsap.fromTo(c, { x: f.left - r.left, y: f.top - r.top }, { x: 0, y: 0, duration: 0.95, ease: 'expo.out' })
      })
      gsap.fromTo(entering, { opacity: 0, scale: 0.9, y: 50 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 })
      visible = next
      busy = false
      refresh(1000)
    }

    if (leaving.length && !S.reduced) {
      gsap.to(leaving, { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power2.in', onComplete: swap })
    } else {
      swap()
    }
  }

  layout(visible)
  onResize(() => layout(visible))

  const tb = tabs(U.$('[data-filter-tabs]'), (btn) => {
    grid.setAttribute('aria-labelledby', btn.id)
    apply(btn.getAttribute('data-filter') || 'all')
  })
  filterApi = (cat) => tb.select(cat, 'data-filter')

  // видео в карточке — по наведению
  if (!S.isTouch) {
    cards.forEach((c) => {
      const v = U.$<HTMLVideoElement>('video', c)
      if (!v) return
      c.addEventListener('mouseenter', () => {
        playVideo(v)
        c.classList.add('is-playing')
      })
      c.addEventListener('mouseleave', () => {
        v.pause()
        c.classList.remove('is-playing')
      })
    })
  }

  grid.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-case-open]')
    if (!b) return
    const order = visible.map((c) => parseInt(c.getAttribute('data-case') || '0', 10))
    openCase(parseInt(b.getAttribute('data-case-open') || '0', 10), order, b, e)
  })
}

// ---------- слайдер с перетаскиванием ----------
function slider(root: HTMLElement) {
  const vp = U.$('[data-slider-viewport]', root)
  const track = U.$('[data-slider-track]', root)
  const slides = U.$$('[data-slide]', root)
  const prev = U.$<HTMLButtonElement>('[data-slider-prev]', root)
  const next = U.$<HTMLButtonElement>('[data-slider-next]', root)
  const idxEl = U.$('[data-slider-index]', root)
  const bar = U.$('[data-slider-bar]', root)
  let index = 0
  let x = 0
  let drag: { x0: number; y0: number; start: number; t: number; lock: string | null; id: number } | null = null
  let moved = false

  function maxX() {
    return Math.max(0, track.scrollWidth - vp.clientWidth + parseFloat(getComputedStyle(vp).paddingLeft) * 2)
  }
  function last() {
    const m = maxX()
    for (let i = 0; i < slides.length; i++) if (slides[i].offsetLeft - slides[0].offsetLeft >= m - 2) return i
    return slides.length - 1
  }
  function posOf(i: number) {
    return -Math.min(maxX(), slides[i].offsetLeft - slides[0].offsetLeft)
  }

  function go(i: number, instant?: boolean) {
    index = U.clamp(i, 0, last())
    x = posOf(index)
    gsap.to(track, { x, duration: instant || S.reduced ? 0 : 1.1, ease: 'expo.out', overwrite: true })
    idxEl.textContent = (index < 9 ? '0' : '') + (index + 1)
    bar.style.transform = 'scaleX(' + ((index + 1) / (last() + 1)).toFixed(3) + ')'
    prev.disabled = index === 0
    next.disabled = index >= last()
  }

  prev.addEventListener('click', () => go(index - 1))
  next.addEventListener('click', () => go(index + 1))
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index + 1)
    else if (e.key === 'ArrowLeft') go(index - 1)
  })

  vp.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    drag = { x0: e.clientX, y0: e.clientY, start: x, t: performance.now(), lock: null, id: e.pointerId }
    moved = false
  })
  vp.addEventListener('pointermove', (e) => {
    if (!drag) return
    const dx = e.clientX - drag.x0
    const dy = e.clientY - drag.y0
    if (drag.lock == null && Math.abs(dx) + Math.abs(dy) > 6) {
      drag.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (drag.lock === 'x') vp.setPointerCapture(drag.id)
    }
    if (drag.lock !== 'x') return
    moved = true
    const m = maxX()
    let nx = drag.start + dx
    // резинка на краях
    if (nx > 0) nx *= 0.35
    if (nx < -m) nx = -m + (nx + m) * 0.35
    gsap.set(track, { x: nx })
    x = nx
  })
  function end(e: PointerEvent) {
    if (!drag) return
    const dx = e.clientX - drag.x0
    const v = dx / Math.max(1, performance.now() - drag.t)
    if (drag.lock === 'x') {
      // ближайший слайд с учётом «броска»
      const target = x + v * 220
      let best = 0
      let bd = Infinity
      for (let i = 0; i <= last(); i++) {
        const d = Math.abs(posOf(i) - target)
        if (d < bd) {
          bd = d
          best = i
        }
      }
      go(best)
    }
    drag = null
  }
  vp.addEventListener('pointerup', end)
  vp.addEventListener('pointercancel', end)
  // после перетаскивания клик по кнопке внутри слайда не срабатывает
  vp.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
        moved = false
      }
    },
    true
  )

  go(0, true)
  onResize(() => go(index, true))
}

// «Смотреть кейсы» в слайдере индустрий → к кейсам, сразу с нужным фильтром
function filterLinks() {
  document.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-filter-go]')
    if (!b) return
    // фильтр включается, когда переход закончился, — перестройку сетки видно
    jumpTo(U.$('#work'), '#work', () => {
      if (filterApi) filterApi(b.getAttribute('data-filter-go') || 'all')
    })
  })
}

// ---------- бриф ----------
function brief() {
  const form = U.$<HTMLFormElement>('[data-brief]')
  if (!form) return
  const services = U.$$<HTMLInputElement>('[data-brief-service]', form)
  const seg = U.$('[data-seg]', form)
  const segInd = U.$('[data-seg-ind]', form)
  const radios = U.$$<HTMLInputElement>('input[type="radio"]', seg)
  const range = U.$<HTMLInputElement>('[data-brief-range]', form)
  const rangeOut = U.$('[data-brief-range-out]', form)
  const summary = U.$('[data-brief-summary]', form)
  const status = U.$('[data-brief-status]', form)
  const label = U.$('[data-brief-label]', form)
  const months = t('briefMonths')
  let sending = false

  function field(name: string) {
    return form.elements.namedItem(name) as HTMLInputElement
  }

  function monthsText() {
    return (range.value === range.max ? range.value + '+' : range.value) + ' ' + months
  }

  function picked() {
    return services.filter((s) => s.checked).map((s) => s.value)
  }

  function update() {
    const sel = picked()
    const budget = radios.filter((r) => r.checked)[0]
    const bi = radios.indexOf(budget)
    segInd.style.transform = 'translateX(' + bi * 100 + '%)'
    range.style.setProperty('--p', (((+range.value - +range.min) / (+range.max - +range.min)) * 100).toFixed(1) + '%')
    rangeOut.textContent = monthsText()
    summary.textContent = '→ ' + (sel.length ? sel.join(' + ') : t('briefEmpty')) + ' · ' + (budget ? budget.value : '') + ' · ' + monthsText()
  }

  function fail(msg: string) {
    status.classList.add('is-error')
    status.textContent = msg
  }

  form.addEventListener('input', update)
  form.addEventListener('change', update)

  U.$$<HTMLInputElement>('.field input', form).forEach((inp) => {
    inp.addEventListener('input', () => (inp.parentNode as HTMLElement).classList.remove('is-error'))
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (sending || form.classList.contains('is-sent')) return
    const name = field('name')
    const contact = field('contact')
    const bad = [name, contact].filter((f) => !f.value.trim())
    ;[name, contact].forEach((f) => {
      const b = bad.includes(f)
      ;(f.parentNode as HTMLElement).classList.toggle('is-error', b)
      if (b) f.setAttribute('aria-invalid', 'true')
      else f.removeAttribute('aria-invalid')
    })
    if (bad.length) {
      fail(t('briefErr'))
      bad[0].focus()
      return
    }
    status.classList.remove('is-error')
    status.textContent = t('briefSending') + '…'
    sending = true
    const budget = radios.filter((r) => r.checked)[0]
    fetch('/api/brief/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name.value,
        contact: contact.value,
        message: field('message').value,
        services: picked(),
        budget: budget ? budget.value : '',
        months: monthsText(),
        lang: t('lang'),
        website: field('website').value
      })
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: { ok?: boolean } | null) => {
        sending = false
        if (!res || !res.ok) {
          fail(t('briefFail'))
          return
        }
        form.classList.add('is-sent')
        label.textContent = '✓'
        status.textContent = ''
        const ok = document.createElement('span')
        ok.textContent = t('briefOk')
        status.appendChild(ok)
        text.scramble(ok, { per: 0.015, dur: 0.3 }).play()
      })
      .catch(() => {
        sending = false
        fail(t('briefFail'))
      })
  })

  update()

  // «Обсудить задачу» в услугах — услуга сразу отмечена в брифе
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('[data-brief-pick]')
    if (!a) return
    const s = services[parseInt(a.getAttribute('data-brief-pick') || '', 10)]
    if (!s) return
    s.checked = true
    update()
    // импульс — когда переход к брифу закончился
    gsap.fromTo(s.nextElementSibling, { scale: 1.25 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)', delay: 1.75 })
  })
}

// ---------- просмотрщик ----------
function lightbox() {
  const el = U.$('[data-lightbox]')
  if (!el) return
  const outside = U.$$('main, header, footer')

  function focusables() {
    return U.$$('button, [href], video[controls]', el).filter((n) => n.offsetParent !== null)
  }

  const box: Lightbox = {
    el,
    frame: U.$('.lightbox__frame', el),
    media: U.$('[data-lb-media]', el),
    num: U.$('[data-lb-num]', el),
    of: U.$('[data-lb-of]', el),
    title: U.$('[data-lb-title]', el),
    kind: U.$('[data-lb-kind]', el),
    text: U.$('[data-lb-text]', el),
    order: [],
    pos: 0,
    opener: null,
    open: false,

    close() {
      if (!box.open) return
      box.open = false
      gsap.to(el, {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => {
          el.hidden = true
          box.media.innerHTML = ''
          el.classList.remove('is-reel')
        }
      })
      outside.forEach((n) => (n.inert = false))
      if (app.lenis) app.lenis.start()
      if (box.opener) box.opener.focus({ preventScroll: true })
    },

    show(opener, ev) {
      box.opener = opener
      if (box.open) return
      box.open = true
      el.hidden = false
      outside.forEach((n) => (n.inert = true))
      if (app.lenis) app.lenis.stop()
      const cx = ev && ev.clientX ? ev.clientX : S.vw / 2
      const cy = ev && ev.clientY ? ev.clientY : S.vh / 2
      gsap.set(el, { opacity: 1 })
      if (!S.reduced) {
        gsap.fromTo(
          el,
          { clipPath: 'circle(0% at ' + cx + 'px ' + cy + 'px)' },
          { clipPath: 'circle(150% at ' + cx + 'px ' + cy + 'px)', duration: 0.9, ease: 'expo.inOut', clearProps: 'clipPath' }
        )
        gsap.fromTo(box.frame, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: 0.35, ease: 'power3.out' })
      }
      setTimeout(() => U.$('.lightbox__close', el).focus({ preventScroll: true }), 80)
    }
  }
  lb = box

  U.$$('[data-lb-close]', el).forEach((b) => b.addEventListener('click', box.close))
  U.$('[data-lb-prev]', el).addEventListener('click', () => showCase(box.pos - 1))
  U.$('[data-lb-next]', el).addEventListener('click', () => showCase(box.pos + 1))
  document.addEventListener('keydown', (e) => {
    if (!box.open) return
    if (e.key === 'Escape') box.close()
    else if (e.key === 'ArrowRight' && !el.classList.contains('is-reel')) showCase(box.pos + 1)
    else if (e.key === 'ArrowLeft' && !el.classList.contains('is-reel')) showCase(box.pos - 1)
    else if (e.key === 'Tab') {
      const f = focusables()
      const i = f.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        f[f.length - 1].focus()
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault()
        f[0].focus()
      }
    }
  })
}

function media(src: string, poster: string, isVideo: boolean) {
  if (isVideo) {
    const v = document.createElement('video')
    v.src = src
    if (poster) v.poster = poster
    v.controls = true
    v.playsInline = true
    v.autoplay = true
    v.loop = true
    return v
  }
  const img = document.createElement('img')
  img.src = src
  img.alt = ''
  return img
}

function showCase(pos: number) {
  if (!lb) return
  const cases = t('cases')
  const n = lb.order.length
  lb.pos = (pos + n) % n
  const c = cases[lb.order[lb.pos]]
  lb.media.innerHTML = ''
  lb.media.appendChild(media(c.video || c.img, c.img, !!c.video))
  lb.num.textContent = c.num
  lb.of.textContent = t('caseOf') + ' ' + (n < 10 ? '0' : '') + n
  lb.title.textContent = c.client
  lb.kind.textContent = c.kind
  lb.text.textContent = c.text
  if (lb.open && !S.reduced) gsap.fromTo([lb.media, lb.title, lb.text], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05 })
}

function openCase(i: number, order: number[], opener: HTMLElement, ev: MouseEvent) {
  if (!lb) return
  lb.el.classList.remove('is-reel')
  lb.order = order
  showCase(Math.max(0, order.indexOf(i)))
  lb.show(opener, ev)
}

export const widgets = {
  tabs,

  init() {
    lightbox()
    U.$$('[data-acc]').forEach((root) => {
      const items = accordion(root)
      if (root.classList.contains('acc--services')) accFloat(root, items)
    })
    work()
    U.$$('[data-slider]').forEach(slider)
    filterLinks()
    brief()
  },

  // полный шоурил в просмотрщике
  reel() {
    if (!lb) return
    const b = U.$('[data-reel-play]')
    lb.el.classList.add('is-reel')
    lb.media.innerHTML = ''
    const v = media(b.getAttribute('data-reel-src') || '', b.getAttribute('data-reel-poster') || '', true) as HTMLVideoElement
    v.loop = false
    lb.media.appendChild(v)
    lb.show(b, null)
  }
}
