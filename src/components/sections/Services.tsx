import type { PageData } from '@/content/page'
import { Icon } from '../icons'

// 2 (чётная, светлая) — услуги: аккордеон + превью, летящее за курсором
export function Services({ p }: { p: PageData }) {
  const { T, SERVICES, pl } = p
  return (
    <section className="sec sec--light services" id="services" aria-labelledby="services-title" data-rest>
      <div className="container">
        <div className="sec__head">
          <div>
            <p className="label" data-scramble>
              <span className="label__num">[02]</span>
              {' ' + T.services.label}
            </p>
            <h2 className="title" id="services-title" data-type>
              {T.services.t1}
              <br />
              <span className="accent">{T.services.t2}</span>
            </h2>
          </div>
          <div className="sec__aside">
            <p className="text" data-fade>
              {T.services.text}
            </p>
            <p className="sec__count" data-fade>
              <span data-count={SERVICES.length}>{SERVICES.length}</span>
              {' ' + pl(SERVICES.length, 'services')}
            </p>
          </div>
        </div>

        <div className="acc acc--services" data-acc>
          {SERVICES.map((s, i) => (
            <div key={s.id} className={'acc__item' + (i === 0 ? ' is-open' : '')} data-acc-item data-card>
              <h3 className="acc__h">
                <button
                  className="acc__btn"
                  type="button"
                  id={'svc-btn-' + s.id}
                  aria-controls={'svc-panel-' + s.id}
                  aria-expanded={i === 0 ? 'true' : 'false'}
                  data-acc-btn
                  data-preview={s.media.poster || s.media.img}
                >
                  <span className="acc__num">{'0' + (i + 1)}</span>
                  <span className="acc__title">{s.title}</span>
                  <span className="acc__short">{s.short}</span>
                  <span className="acc__icon">
                    <Icon name="plus" />
                  </span>
                </button>
              </h3>
              <div className="acc__panel" id={'svc-panel-' + s.id} role="region" aria-labelledby={'svc-btn-' + s.id} hidden={i !== 0} data-acc-panel>
                <div className="acc__inner">
                  <div className="acc__body">
                    <p className="acc__text">{s.text}</p>
                    <ul className="acc__chips" aria-label={T.services.includes}>
                      {s.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                    <a className="link" href="#contact" data-brief-pick={i}>
                      <span>{T.services.discuss}</span>
                      <Icon name="arrow" />
                    </a>
                  </div>
                  <div className="acc__media">
                    {s.media.video ? (
                      <video muted loop playsInline preload="none" poster={s.media.poster} data-src={s.media.video} />
                    ) : (
                      <img src={s.media.img} alt="" loading="lazy" decoding="async" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* превью услуги, которое летит за курсором над закрытыми пунктами */}
      <div className="acc-float" data-acc-float aria-hidden="true">
        <img alt="" data-acc-float-img />
      </div>
    </section>
  )
}
