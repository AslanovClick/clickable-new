import type { PageData } from '@/content/page'
import { IMG } from '@/content/site'
import { Icon } from '../icons'

type Client = PageData['CLIENTS'][number]

// raw — растровый по сути логотип: в белый силуэт не перекрашиваем, только обесцвечиваем
function ClientLogo({ c }: { c: Client }) {
  return (
    <li className={'client' + (c.raw ? ' client--raw' : '')} data-brand>
      <img src={IMG + 'clients/' + c.id + '.svg'} alt={c.name} loading="lazy" decoding="async" />
    </li>
  )
}

// 7 (нечётная, прозрачная) — клиенты: бесконечная лента логотипов + слайдер индустрий
export function Clients({ p }: { p: PageData }) {
  const { T, CLIENTS, INDUSTRIES } = p
  return (
    <section className="sec sec--clear clients" id="clients" aria-labelledby="clients-title" data-odd>
      <div className="container">
        <div className="sec__head">
          <div>
            <p className="label" data-scramble>
              <span className="label__num">[07]</span>
              {' ' + T.clients.label}
            </p>
            <h2 className="title" id="clients-title" data-type>
              {T.clients.t1}
              <br />
              <span className="accent">{T.clients.t2}</span>
            </h2>
          </div>
          <div className="sec__aside">
            <p className="text" data-fade>
              {T.clients.text}
            </p>
          </div>
        </div>
      </div>

      <div className="marquee" data-marquee>
        <div className="marquee__row" data-dir="-1">
          <ul className="marquee__track" aria-label={T.clients.listAria}>
            {CLIENTS.map((c) => (
              <ClientLogo key={c.id} c={c} />
            ))}
          </ul>
        </div>
        {/* второй ряд — визуальный дубль, скринридерам не нужен */}
        <div className="marquee__row" data-dir="1" aria-hidden="true">
          <ul className="marquee__track">
            {CLIENTS.toReversed().map((c) => (
              <ClientLogo key={c.id} c={c} />
            ))}
          </ul>
        </div>
      </div>

      <div className="container">
        <div className="slider" data-slider role="region" aria-roledescription="carousel" aria-label={T.clients.industries}>
          <div className="slider__head">
            <h3 className="slider__title" data-fade>
              <span className="label__dot" />
              {T.clients.industries}
            </h3>
            <div className="slider__ctrl" data-fade>
              <button className="slider__btn" type="button" data-slider-prev aria-label={T.clients.prev}>
                <Icon name="prev" />
              </button>
              <p className="slider__count" aria-hidden="true">
                <span data-slider-index>01</span>
                {' / 0' + INDUSTRIES.length}
              </p>
              <button className="slider__btn" type="button" data-slider-next aria-label={T.clients.next}>
                <Icon name="arrow" />
              </button>
            </div>
          </div>
          <div className="slider__viewport" data-slider-viewport data-cursor-drag>
            <div className="slider__track" data-slider-track>
              {INDUSTRIES.map((ind, i) => (
                <article
                  key={ind.title}
                  className={'ind' + (ind.cta ? ' ind--cta' : '')}
                  data-slide
                  role="group"
                  aria-roledescription={T.clients.slide}
                  aria-label={i + 1 + ' ' + T.clients.of + ' ' + INDUSTRIES.length}
                  data-tilt
                >
                  <span className="ind__num">{'0' + (i + 1)}</span>
                  <h4 className="ind__title">{ind.title}</h4>
                  <p className="ind__text">{ind.text}</p>
                  {ind.clients.length ? (
                    <ul className="ind__clients" aria-label={T.clients.clientsAria}>
                      {ind.clients.map((cl) => (
                        <li key={cl}>{cl}</li>
                      ))}
                    </ul>
                  ) : null}
                  {ind.cta ? (
                    <a className="link" href="#contact">
                      <span>{T.clients.discuss}</span>
                      <Icon name="arrow" />
                    </a>
                  ) : (
                    <button className="link" type="button" data-filter-go={ind.filter}>
                      <span>{T.clients.viewCases}</span>
                      <Icon name="arrow" />
                    </button>
                  )}
                </article>
              ))}
            </div>
          </div>
          <div className="slider__bar" aria-hidden="true">
            <span data-slider-bar />
          </div>
        </div>
      </div>
    </section>
  )
}
