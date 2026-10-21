/* Текст: разбивка на буквы, печать по буквам с кареткой, «дешифровка», градиент на разбитых буквах */
import gsap from 'gsap'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/'
const splitted: HTMLElement[] = []
const charsOf = new WeakMap<HTMLElement, HTMLElement[]>()
const remeasureOf = new WeakMap<HTMLElement, () => void>()

type Spot = { x: number; y: number; h: number }

function split(el: HTMLElement) {
  const done = charsOf.get(el)
  if (done) return done
  const chars: HTMLElement[] = []
  const label = (el.textContent || '').replace(/\s+/g, ' ').trim()

  function splitText(node: Text) {
    const text = (node.nodeValue || '').replace(/\s+/g, ' ')
    if (!text.trim()) return
    const frag = document.createDocumentFragment()
    text.split(/( )/).forEach((part) => {
      if (!part) return
      if (part === ' ') {
        frag.appendChild(document.createTextNode(' '))
        return
      }
      const word = document.createElement('span')
      word.className = 'word'
      for (let i = 0; i < part.length; i++) {
        const c = document.createElement('span')
        c.className = 'char'
        c.textContent = part[i]
        word.appendChild(c)
        chars.push(c)
      }
      frag.appendChild(word)
    })
    node.parentNode!.replaceChild(frag, node)
  }

  function walk(node: Node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) splitText(child as Text)
      else if (child.nodeType === 1) walk(child)
    })
  }

  walk(el)
  // для скринридеров — цельная строка, буквы скрыты
  el.querySelectorAll('.word').forEach((w) => w.setAttribute('aria-hidden', 'true'))
  const sr = document.createElement('span')
  sr.className = 'sr-only'
  sr.textContent = label
  el.appendChild(sr)

  el.setAttribute('data-typed', '')
  charsOf.set(el, chars)
  splitted.push(el)
  paintGradient(el)
  return chars
}

// каждой букве внутри .grad — свой кусок общего градиента, чтобы он не «рвался» по буквам
function paintGradient(el: HTMLElement) {
  const grads = el.classList.contains('grad') ? [el] : Array.from(el.querySelectorAll<HTMLElement>('.grad'))
  grads.forEach((g) => {
    g.classList.add('is-split')
    const gr = g.getBoundingClientRect()
    g.querySelectorAll<HTMLElement>('.char').forEach((c) => {
      const r = c.getBoundingClientRect()
      // градиент горизонтальный — важен только сдвиг по X (Y-анимация букв на него не влияет)
      c.style.backgroundSize = gr.width + 'px 100%'
      c.style.backgroundPosition = gr.left - r.left + 'px 0'
    })
  })
}

function measureCaret(el: HTMLElement, chars: HTMLElement[]): Spot[] {
  const er = el.getBoundingClientRect()
  return chars.map((c) => {
    const r = c.getBoundingClientRect()
    return { x: r.right - er.left, y: r.top - er.top + r.height * 0.06, h: r.height * 0.86 }
  })
}

type TypeOptions = { caret?: boolean; stagger?: number; duration?: number; caretHold?: number }

// печать по буквам: буква проявляется из размытия и чуть снизу, каретка бежит следом
function type(el: HTMLElement, o: TypeOptions = {}) {
  const chars = split(el)
  const n = chars.length
  const stagger = o.stagger || Math.min(0.045, 1.4 / n)
  const duration = o.duration || 0.5
  let caret: HTMLElement | null = null
  let spots: Spot[] = []
  let hideCall: gsap.core.Tween | null = null

  if (o.caret) {
    caret = document.createElement('span')
    caret.className = 'caret'
    caret.setAttribute('aria-hidden', 'true')
    el.appendChild(caret)
    spots = measureCaret(el, chars)
    remeasureOf.set(el, () => {
      spots = measureCaret(el, chars)
    })
  }

  function placeCaret(i: number) {
    const p = spots[Math.max(0, Math.min(n - 1, i))]
    caret!.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0)'
    caret!.style.height = p.h + 'px'
  }

  function showCaret() {
    if (hideCall) hideCall.kill()
    gsap.killTweensOf(caret)
    caret!.classList.remove('is-blink')
    caret!.style.opacity = '1'
  }

  const tl = gsap.timeline({ paused: true })
  const tween = gsap.fromTo(
    chars,
    { opacity: 0, y: '0.32em', filter: 'blur(8px)' },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration,
      ease: 'power3.out',
      stagger,
      onStart: caret ? showCaret : undefined,
      // this — сам твин: onUpdate срабатывает уже при его создании (immediateRender), до присваивания переменной
      onUpdate: caret
        ? function (this: gsap.core.Tween) {
            if (caret!.style.opacity !== '1') showCaret()
            placeCaret(Math.floor(this.time() / stagger))
          }
        : undefined,
      onComplete: () => {
        gsap.set(chars, { clearProps: 'filter' })
        if (!caret) return
        placeCaret(n - 1)
        caret.classList.add('is-blink')
        hideCall = gsap.delayedCall(o.caretHold || 2.6, () => {
          caret!.classList.remove('is-blink')
          gsap.to(caret, { opacity: 0, duration: 0.6 })
        })
      },
      onReverseComplete: caret
        ? () => {
            if (hideCall) hideCall.kill()
            caret!.classList.remove('is-blink')
            caret!.style.opacity = '0'
          }
        : undefined
    }
  )
  tl.add(tween, 0)
  return tl
}

// «дешифровка»: буквы перебирают случайные символы и встают на место
function scramble(el: HTMLElement, o: { per?: number; dur?: number } = {}) {
  const chars = split(el)
  const finals = chars.map((c) => c.textContent)
  const n = chars.length
  const per = o.per || 0.028
  const dur = o.dur || 0.42
  const total = per * (n - 1) + dur
  const st = { t: 0 }
  let lastSwap = 0

  gsap.set(chars, { opacity: 0 })

  function lock() {
    chars.forEach((c) => {
      c.style.width = c.getBoundingClientRect().width + 'px'
      c.classList.add('is-locked')
    })
  }

  function unlock() {
    chars.forEach((c, i) => {
      c.textContent = finals[i]
      c.style.width = ''
      c.style.opacity = '1'
      c.classList.remove('is-locked')
    })
  }

  return gsap.timeline({ paused: true }).to(st, {
    t: total,
    duration: total,
    ease: 'none',
    onStart: lock,
    onUpdate: () => {
      const now = performance.now()
      const swap = now - lastSwap > 45
      if (swap) lastSwap = now
      for (let i = 0; i < n; i++) {
        const local = (st.t - i * per) / dur
        const c = chars[i]
        if (local <= 0) {
          c.style.opacity = '0'
        } else if (local < 1) {
          c.style.opacity = String(Math.min(1, local * 2.5))
          if (swap && finals[i] !== ' ') c.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0]
        } else {
          c.style.opacity = '1'
          c.textContent = finals[i]
        }
      }
    },
    onComplete: unlock
  })
}

export const text = {
  split,
  type,
  scramble,
  // размеры шрифта «тянутся» от ширины экрана — после ресайза пересчитываем градиенты и каретки
  refresh() {
    splitted.forEach((el) => {
      paintGradient(el)
      remeasureOf.get(el)?.()
    })
  }
}
