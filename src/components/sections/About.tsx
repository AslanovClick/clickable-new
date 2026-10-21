import type { PageData } from '@/content/page'
import { IMG } from '@/content/site'
import { Icon } from '../icons'

// 8 (чётная, светлая) — о нас: «Не просто клик. Реакция.», цифры, отзыв, награды, FAQ-аккордеон
export function About({ p }: { p: PageData }) {
  const { T, STATS, QUOTE, AWARDS, FAQ } = p
  return (
    <section className="sec sec--light about" id="about" aria-labelledby="about-title" data-rest>
      <div className="container">
        <div className="about__top">
          <h2 className="title title--xl" id="about-title" data-type>
            {T.about.t1}
            <br />
            {T.about.t2}
            <br />
            <span className="accent">{T.about.t3}</span>
          </h2>
          <div className="about__intro">
            <p className="about__lead" data-fade>
              {T.about.lead}
            </p>
            <a className="link" href="#contact" data-fade>
              <span>{T.about.more}</span>
              <Icon name="arrow" />
            </a>
          </div>
        </div>

        <figure className="about__photo" data-about-photo>
          <img src={IMG + 'about/team.webp'} alt={T.about.photoAlt} width="1400" height="1442" loading="lazy" decoding="async" data-about-img />
          <figcaption className="about__cap">
            <span className="label__dot" />
            {T.about.caption}
          </figcaption>
        </figure>

        <div className="about__stats" role="list">
          {STATS.map((s) => (
            <div key={s.k} className="stat" role="listitem" data-card>
              <p className="stat__v">
                <span data-count={s.v}>{s.v}</span>
              </p>
              <p className="stat__k">{s.k}</p>
            </div>
          ))}
        </div>

        <div className="about__proof">
          <blockquote className="quote" data-fade>
            <span className="quote__mark" aria-hidden="true">
              “
            </span>
            <p className="quote__text">{QUOTE.text}</p>
            <footer className="quote__who">
              <span>{QUOTE.who}</span>
              <strong>{QUOTE.company}</strong>
            </footer>
          </blockquote>
          <ul className="awards" aria-label={T.about.awardsAria}>
            {AWARDS.map((a) => (
              <li key={a.name} className="award" data-card>
                <img src={a.img} alt={a.name} loading="lazy" decoding="async" />
                <span className="award__t">{a.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="about__faq">
          <div className="about__faq-head">
            <p className="label" data-scramble>
              <span className="label__num">[08]</span>
              {' FAQ'}
            </p>
            <h3 className="title title--sm" data-type>
              {T.about.faq1}
              <br />
              <span className="accent">{T.about.faq2}</span>
            </h3>
          </div>
          <div className="acc acc--faq" data-acc>
            {FAQ.map((f, i) => (
              <div key={f.q} className="acc__item" data-acc-item data-card>
                <h4 className="acc__h">
                  <button className="acc__btn" type="button" id={'faq-btn-' + i} aria-controls={'faq-panel-' + i} aria-expanded="false" data-acc-btn>
                    <span className="acc__title">{f.q}</span>
                    <span className="acc__icon">
                      <Icon name="plus" />
                    </span>
                  </button>
                </h4>
                <div className="acc__panel" id={'faq-panel-' + i} role="region" aria-labelledby={'faq-btn-' + i} hidden data-acc-panel>
                  <div className="acc__inner">
                    <p className="acc__text">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
