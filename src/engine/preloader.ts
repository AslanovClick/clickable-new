/* Прелоадер: контур буквы A рисуется по прогрессу загрузки, заливается фирменным красным
   и перелетает на своё место в слове CLICKABLE — там его без шва подменяет 3D-буква */
import gsap from 'gsap'
import { onTick, S, t, U } from './core'
import { hero } from './hero'
import { stage } from './stage'
import { text } from './text'

const RATIO = 706 / 785 // высота/ширина глифа A
const LOG_AT = [0, 0.2, 0.45, 0.7, 0.95]

export function preloader(fontsReady: Promise<unknown>, onDone: () => void) {
  const el = U.$('[data-preloader]')
  if (!el) {
    onDone()
    return
  }
  const ui = U.$('[data-pre-ui]', el)
  const svg = U.$<SVGSVGElement>('[data-pre-a]', el)
  const line = U.$<SVGPathElement>('[data-pre-line]', el)
  const fill = U.$<SVGPathElement>('[data-pre-fill]', el)
  const countEl = U.$('[data-pre-count]', el)
  const barEl = U.$('[data-pre-bar]', el)
  const logEl = U.$('[data-pre-log]', el)
  const LOG = t('log')

  const st = { shown: 0 }
  let fontsOk = false
  let finished = false
  let running = true
  const started = performance.now()
  let logIdx = 0
  let lastCount = ''
  const box = { x: 0, y: 0, w: 0 }
  fontsReady.then(() => {
    fontsOk = true
  })

  line.setAttribute('pathLength', '1')
  line.style.strokeDasharray = '1'
  line.style.strokeDashoffset = '1'

  function layout() {
    box.w = Math.min(S.vh * 0.26, S.vw * 0.36, 230)
    box.x = (S.vw - box.w) / 2
    box.y = (S.vh - box.w * RATIO) / 2
    gsap.set(svg, { x: box.x, y: box.y, width: box.w, height: box.w * RATIO })
  }
  layout()
  window.addEventListener('resize', layout)

  function addLog(msg: string) {
    const row = document.createElement('div')
    row.textContent = '> ' + msg
    logEl.appendChild(row)
    while (logEl.children.length > 4) logEl.removeChild(logEl.firstChild!)
    text.scramble(row, { per: 0.012, dur: 0.25 }).play()
  }

  function target() {
    const k = Math.min(1, (performance.now() - started) / 1800)
    return (fontsOk ? 0.6 : 0) + 0.4 * k
  }

  function update() {
    const c = ('00' + Math.round(st.shown * 100)).slice(-3)
    if (c !== lastCount) {
      lastCount = c
      countEl.textContent = c
    }
    barEl.style.transform = 'scaleX(' + st.shown.toFixed(4) + ')'
    line.style.strokeDashoffset = (1 - st.shown).toFixed(4)
    while (logIdx < LOG_AT.length && st.shown >= LOG_AT[logIdx]) addLog(LOG[logIdx++])
  }

  function done() {
    running = false
    el.style.display = 'none'
    window.removeEventListener('resize', layout)
  }

  function exit() {
    if (finished) return
    finished = true
    st.shown = 1
    update()
    if (S.reduced) {
      gsap.to(el, { opacity: 0, duration: 0.5, onComplete: done })
      stage.show(true)
      onDone()
      return
    }
    const to = hero.glyphRect()
    const tl = gsap.timeline({ onComplete: done })
    tl.to(fill, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0)
      .to(line, { opacity: 0, duration: 0.4 }, 0.15)
      .to(ui, { opacity: 0, y: -12, duration: 0.6, ease: 'power2.in' }, 0.1)
    if (to && to.w > 0) {
      // буква летит в слово, фон растворяется
      tl.to(svg, { x: to.x, y: to.y, width: to.w, height: to.h, duration: 1.15, ease: 'expo.inOut' }, 0.4)
        .to(el, { backgroundColor: 'rgba(7,7,7,0)', duration: 0.9, ease: 'power2.inOut' }, 0.75)
        .add(() => {
          stage.show(true)
          onDone()
        }, 1.55)
        .to(svg, { opacity: 0, duration: 0.25 }, 1.6)
    } else {
      tl.to(el, { opacity: 0, duration: 0.7 }, 0.5).add(() => {
        stage.show()
        onDone()
      }, 0.7)
    }
  }

  onTick((time, dt) => {
    if (!running) return
    if (!finished) {
      st.shown = U.damp(st.shown, target(), 3.4, dt)
      if (target() >= 0.999 && st.shown > 0.985 && fontsOk) exit()
      update()
    }
  })

  // страховка: не держим посетителя дольше 9 секунд
  setTimeout(exit, 9000)
}
