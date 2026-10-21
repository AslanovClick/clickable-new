import type { PageData } from '@/content/page'
import { CONTACTS } from '@/content/site'
import { Icon } from '../icons'

// 9 (нечётная, прозрачная) — контакты: интерактивный бриф; справа — 3D-буква в кольце
export function Contact({ p }: { p: PageData }) {
  const { T, BRIEF } = p
  return (
    <section className="sec sec--clear contact" id="contact" aria-labelledby="contact-title" data-odd data-rest>
      <div className="container contact__grid">
        <div className="contact__main">
          <p className="label" data-scramble>
            <span className="label__num">[09]</span>
            {' ' + T.contact.label}
          </p>
          <h2 className="title contact__title" id="contact-title" data-type>
            {T.contact.t1}
            <br />
            <span className="accent">{T.contact.t2}</span>
          </h2>

          {/* отправка — src/engine/widgets.ts → /api/brief/ */}
          <form className="brief" data-brief noValidate data-card>
            <fieldset className="brief__group">
              <legend className="brief__legend">
                <span>01</span>
                {T.contact.need}
              </legend>
              <div className="brief__chips">
                {BRIEF.services.map((s, i) => (
                  <label key={s} className="pick">
                    <input type="checkbox" name="service" value={s} data-brief-service={i} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="brief__row">
              <fieldset className="brief__group">
                <legend className="brief__legend">
                  <span>02</span>
                  {T.contact.budget}
                </legend>
                <div className="seg" data-seg>
                  {BRIEF.budgets.map((b, i) => (
                    <label key={b} className="seg__opt">
                      <input type="radio" name="budget" value={b} defaultChecked={i === 1} />
                      <span>{b}</span>
                    </label>
                  ))}
                  <span className="seg__ind" data-seg-ind aria-hidden="true" />
                </div>
              </fieldset>

              <div className="brief__group">
                <label className="brief__legend" htmlFor="brief-time">
                  <span>03</span>
                  {T.contact.time}
                </label>
                <div className="range">
                  <input
                    id="brief-time"
                    type="range"
                    name="months"
                    min="1"
                    max="6"
                    step="1"
                    defaultValue="2"
                    data-brief-range
                    aria-describedby="brief-time-out"
                  />
                  <output className="range__out" id="brief-time-out" htmlFor="brief-time" data-brief-range-out>
                    {'2 ' + T.js.briefMonths}
                  </output>
                </div>
              </div>
            </div>

            <div className="brief__fields">
              <div className="field">
                <input id="brief-name" type="text" name="name" placeholder=" " autoComplete="name" required />
                <label htmlFor="brief-name">{T.contact.name}</label>
              </div>
              <div className="field">
                <input id="brief-contact" type="text" name="contact" placeholder=" " autoComplete="email" required />
                <label htmlFor="brief-contact">{T.contact.contact}</label>
              </div>
              <div className="field field--wide">
                <textarea id="brief-msg" name="message" rows={3} placeholder=" " />
                <label htmlFor="brief-msg">{T.contact.message}</label>
              </div>
              {/* ловушка для ботов: людям поле не видно, заполненное — бриф отбрасывается */}
              <input className="sr-only" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            </div>

            <div className="brief__bottom">
              <p className="brief__summary" data-brief-summary aria-live="polite">
                {'→ ' + T.js.briefEmpty}
              </p>
              <button className="btn btn--red" type="submit" data-magnetic>
                <span data-brief-label>{T.contact.submit}</span>
                <Icon name="send" />
              </button>
            </div>
            <p className="brief__status" role="status" aria-live="polite" data-brief-status />
          </form>

          {/* контакты — под брифом: правая колонка отдана 3D-букве в кольце */}
          <ul className="contact__list" aria-label={T.contact.listAria}>
            <li data-fade>
              <span className="contact__k">{T.contact.coop}</span>
              <a className="contact__v" href={'mailto:' + CONTACTS.email}>
                {CONTACTS.email}
              </a>
            </li>
            <li data-fade>
              <span className="contact__k">{CONTACTS.messengers}</span>
              <a className="contact__v" href={'tel:' + CONTACTS.phoneHref}>
                {CONTACTS.phone}
              </a>
            </li>
            <li data-fade>
              <span className="contact__k">{T.contact.career}</span>
              <a className="contact__v" href={'mailto:' + CONTACTS.hr}>
                {CONTACTS.hr}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
