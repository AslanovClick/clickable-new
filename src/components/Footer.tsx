import type { PageData } from '@/content/page'
import { CONTACTS, SOCIALS, YEAR } from '@/content/site'
import { Icon, Social } from './icons'

export function Footer({ p }: { p: PageData }) {
  const { T } = p
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__row">
          <a className="footer__link" href={'mailto:' + CONTACTS.email} data-fade>
            {CONTACTS.email}
          </a>
          <a className="footer__link" href={'tel:' + CONTACTS.phoneHref} data-fade data-delay=".06">
            {CONTACTS.phone}
          </a>
          <nav className="socials" aria-label={T.footer.social} data-fade data-delay=".12">
            {SOCIALS.map((s) => (
              <a key={s.id} href={s.href} aria-label={s.name}>
                <Social name={s.id} />
              </a>
            ))}
          </nav>
          <a className="footer__top" href="#home" data-fade data-delay=".18">
            <span>{T.footer.top}</span>
            <Icon name="down" />
          </a>
        </div>

        {/* огромный логотип: буквы загораются красным под курсором */}
        <p className="footer__mark" aria-hidden="true" data-footer-mark>
          {'CLICKABLE'.split('').map((ch, i) => (
            <span key={i} className={i === 5 ? 'is-a' : undefined}>
              {ch}
            </span>
          ))}
        </p>

        <div className="footer__bottom">
          <p>
            {'© '}
            <span data-year>{YEAR}</span>
            {' CLICKABLE. ' + T.hero.tag}
          </p>
          <a className="footer__ua" href="#">
            Support Ukraine
            <Icon name="heart" />
          </a>
        </div>
      </div>
    </footer>
  )
}
