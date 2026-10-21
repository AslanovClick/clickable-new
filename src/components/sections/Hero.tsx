import { Fragment } from 'react'
import type { PageData } from '@/content/page'
import { YEAR } from '@/content/site'
import { Icon } from '../icons'

// 1 (нечётная) — «глава»: высокая секция + липкая сцена. По скроллу буква A отделяется от слова и уходит в 3D,
// остальные буквы разлетаются, затем загорается манифест
export function Hero({ p }: { p: PageData }) {
  const { T } = p
  // манифест: слова загораются по скроллу; слова-акценты (фирменным шрифтом) — на каждом языке свои
  const words = T.hero.man.trim().split(/\s+/)
  const acc = new Set(T.hero.manAcc.map((w) => w.toLowerCase()))

  return (
    <section className="hero" id="home" aria-labelledby="hero-title" data-hero data-odd>
      <div className="hero__stage">
        <div className="hero__panel hero__panel--intro" data-panel data-in="0" data-out=".24">
          <h1 className="sr-only" id="hero-title">
            {T.hero.h1}
          </h1>
          <div className="hero__center">
            {/* A в слове — прозрачная: на её месте стоит 3D-буква (без WebGL — показывается сама буква) */}
            <p className="hero__mark" aria-hidden="true" data-hero-mark>
              {'CLICK'.split('').map((ch, i) => (
                <span key={'l' + i} className="hero__ch">
                  {ch}
                </span>
              ))}
              <span className="hero__ch hero__ch--a" data-hero-a>
                A
              </span>
              {'BLE'.split('').map((ch, i) => (
                <span key={'r' + i} className="hero__ch">
                  {ch}
                </span>
              ))}
              <i className="hero__base" data-hero-base />
            </p>
            <p className="hero__tag" data-hero-tag>
              <span data-hero-tag-text>{T.hero.tag}</span>
              <Icon name="down" />
            </p>
          </div>
          <div className="container hero__foot" data-hero-foot>
            <p className="hero__meta">
              <span className="label__dot" />
              <span>Creative agency</span>
            </p>
            <ul className="hero__list">
              {T.hero.list.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="hero__copy">
              {'© ' + YEAR + ' from clickable with '}
              <span data-hero-love>desire</span>
            </p>
          </div>
        </div>

        <div className="hero__panel hero__panel--manifesto" data-panel data-in=".4" data-out="1" data-rest-at=".85">
          <div className="container manifesto">
            <p className="label">
              <span className="label__num">[01]</span>
              <span>{T.hero.manLabel}</span>
            </p>
            <p className="manifesto__text" data-words>
              <span className="sr-only">{words.join(' ')}</span>
              <span aria-hidden="true">
                {words.map((w, i) => (
                  <Fragment key={i}>
                    {i > 0 ? ' ' : null}
                    <span className={'w' + (acc.has(w.toLowerCase()) ? ' w--acc' : '')}>{w}</span>
                  </Fragment>
                ))}
              </span>
            </p>
            <ul className="manifesto__meta">
              {T.hero.manMeta.map((m) => (
                <li key={m[0]}>
                  <span>{m[0]}</span>
                  <strong>{m[1]}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
