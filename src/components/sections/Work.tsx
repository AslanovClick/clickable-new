import type { PageData } from '@/content/page'
import { Icon } from '../icons'

// 3 (нечётная, прозрачная — фоном 3D-буква) — кейсы: табы-фильтр, масонри, просмотрщик
export function Work({ p }: { p: PageData }) {
  const { T, FILTERS, CASES } = p
  return (
    <section className="sec sec--clear work" id="work" aria-labelledby="work-title" data-odd>
      <div className="container">
        <div className="sec__head">
          <div>
            <p className="label" data-scramble>
              <span className="label__num">[03]</span>
              {' ' + T.work.label}
            </p>
            <h2 className="title" id="work-title" data-type>
              {T.work.t1}
              <br />
              <span className="accent">{T.work.t2}</span>
            </h2>
          </div>
          <div className="sec__aside">
            <p className="text" data-fade>
              {T.work.text}
            </p>
          </div>
        </div>

        <div className="tabs work__tabs" role="tablist" aria-label={T.work.filterAria} data-filter-tabs data-fade>
          {FILTERS.map((f, i) => {
            const n = f.id === 'all' ? CASES.length : CASES.filter((c) => c.cats.includes(f.id)).length
            return (
              <button
                key={f.id}
                className="tabs__btn"
                type="button"
                role="tab"
                id={'wf-' + f.id}
                aria-selected={i === 0 ? 'true' : 'false'}
                aria-controls="work-grid"
                tabIndex={i === 0 ? 0 : -1}
                data-filter={f.id}
              >
                <span>{f.name}</span>
                <sup className="tabs__n">{n < 10 ? '0' + n : n}</sup>
              </button>
            )
          })}
          <span className="tabs__ind" data-tabs-ind aria-hidden="true" />
        </div>

        <div className="work__grid" id="work-grid" role="tabpanel" aria-labelledby="wf-all" data-work-grid>
          {CASES.map((c, i) => (
            <article key={c.num} className={'case case--' + c.shape} data-case={i} data-cats={c.cats.join(' ')} data-card>
              <div className="case__media">
                <img src={c.img} alt="" loading="lazy" decoding="async" />
                {c.video ? <video muted loop playsInline preload="none" data-src={c.video} /> : null}
                {c.video || c.full ? (
                  <span className="case__badge">
                    <Icon name="play" />
                    Video
                  </span>
                ) : null}
              </div>
              <div className="case__meta">
                <span className="case__num">{c.num}</span>
                <span className="case__client">{c.client}</span>
                <span className="case__kind">{c.kind}</span>
              </div>
              <button className="case__hit" type="button" data-case-open={i} data-cursor={T.work.view}>
                <span className="sr-only">{T.work.open + ': ' + c.client + ', ' + c.kind}</span>
              </button>
            </article>
          ))}
        </div>

        <div className="work__foot" data-fade>
          <p className="work__note">{T.work.note}</p>
          <a className="link" href="#contact">
            <span>{T.work.discuss}</span>
            <Icon name="arrow" />
          </a>
        </div>
      </div>
    </section>
  )
}
