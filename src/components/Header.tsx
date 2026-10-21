import { LANGS, LANG_ORDER, langHref, type Lang } from '@/content/i18n'
import type { PageData } from '@/content/page'
import { CONTACTS } from '@/content/site'
import { Icon, Logo } from './icons'

// языковые версии — обычные ссылки: каждая версия — отдельная статическая страница
function LangLinks({ cls, lang }: { cls: string; lang: Lang }) {
  return LANG_ORDER.map((l) => (
    <li key={l}>
      <a className={cls} href={langHref(l)} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined} data-lang-link={l}>
        <span className={cls + '-code'}>{LANGS[l].code}</span>
        <span className={cls + '-name'}>{LANGS[l].name}</span>
      </a>
    </li>
  ))
}

export function Header({ p }: { p: PageData }) {
  const { T, NAV, lang } = p
  return (
    <>
      <header className="header" data-header>
        <div className="container header__inner">
          <a className="logo" href="#home" aria-label={T.logoHome}>
            <Logo />
          </a>
          <nav className="nav" data-nav aria-label={T.nav.aria}>
            {NAV.map((n) => (
              <a key={n.href} className="nav__link" href={n.href}>
                {n.name}
              </a>
            ))}
            <span className="nav__indicator" data-nav-indicator />
          </nav>
          {/* выбор языка */}
          <div className="lang" data-lang>
            <button
              className="lang__btn"
              type="button"
              aria-expanded="false"
              aria-controls="lang-list"
              aria-label={T.lang + ': ' + LANGS[lang].name}
              data-lang-btn
            >
              <Icon name="globe" />
              <span>{LANGS[lang].code}</span>
              <span className="lang__caret" aria-hidden="true" />
            </button>
            <ul className="lang__list" id="lang-list" data-lang-list>
              <LangLinks cls="lang__opt" lang={lang} />
            </ul>
          </div>
          <a className="btn btn--red header__cta" href="#contact" data-magnetic>
            <span>{T.nav.cta}</span>
            <Icon name="arrow" />
          </a>
          <button className="burger" type="button" data-burger aria-label={T.js.menuOpen} aria-expanded="false" aria-controls="menu">
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className="menu" id="menu" data-menu role="dialog" aria-modal="true" aria-label={T.nav.menu}>
        <nav className="menu__nav" aria-label={T.nav.ariaMobile}>
          {NAV.map((n, i) => (
            <a key={n.href} className="menu__link" href={n.href}>
              <span className="menu__num">{'0' + (i + 1)}</span>
              {n.name}
            </a>
          ))}
        </nav>
        <ul className="menu__langs" aria-label={T.lang}>
          <LangLinks cls="menu__lang" lang={lang} />
        </ul>
        <div className="menu__bottom">
          <a className="menu__mail" href={'mailto:' + CONTACTS.email}>
            {CONTACTS.email}
          </a>
          <a className="menu__phone" href={'tel:' + CONTACTS.phoneHref}>
            {CONTACTS.phone}
          </a>
        </div>
      </div>
    </>
  )
}
