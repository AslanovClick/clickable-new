import { Fragment } from 'react'
import type { PageData } from '@/content/page'
import { IMG, VID, YEAR } from '@/content/site'
import { Icon } from '../icons'

// 4 (чётная, непрозрачная) — шоурил: рамка раскрывается по скроллу, клик — полный ролик в просмотрщике
export function Reel({ p }: { p: PageData }) {
  const { T } = p
  return (
    <section className="reel" id="reel" aria-labelledby="reel-title" data-reel>
      <div className="reel__box" data-reel-box>
        <video
          className="reel__video"
          muted
          loop
          playsInline
          preload="none"
          poster={IMG + 'cases/reel-loop.webp'}
          data-src={VID + 'reel-loop.mp4'}
          data-reel-video
        />
        <div className="reel__shade" />
        <div className="container reel__content">
          <p className="label" data-scramble>
            <span className="label__num">[04]</span>
            {' Showreel ' + YEAR}
          </p>
          <h2 className="title title--xl" id="reel-title" data-type>
            {T.reel.t1}
            <br />
            <span className="accent">{T.reel.t2}</span>
          </h2>
          <button
            className="reel__play"
            type="button"
            data-reel-play
            data-reel-src={VID + 'showreel.mp4'}
            data-reel-poster={IMG + 'cases/showreel.webp'}
            data-magnetic
            data-cursor="Play"
          >
            <span className="reel__play-ring">
              <Icon name="play" />
            </span>
            <span className="reel__play-text">{T.reel.play}</span>
          </button>
        </div>
      </div>
      <div className="reel__ticker" aria-hidden="true">
        {/* набор дважды — лента бесшовная (сдвиг на половину) */}
        <div className="reel__ticker-track">
          {[0, 1].map((k) =>
            T.reel.ticker.map((w) => (
              <Fragment key={k + w}>
                <span>{w}</span>
                <i />
              </Fragment>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
