import { A_BOX, A_PATH, GlyphA, Logo } from './icons'

export function Layers() {
  return (
    <>
      {/* Прелоадер: контур буквы A рисуется по прогрессу, потом A перелетает на своё место в слове CLICKABLE */}
      <div className="preloader" data-preloader aria-hidden="true">
        <div className="preloader__ui" data-pre-ui>
          <div className="preloader__top">
            <span className="preloader__brand">
              <Logo />
            </span>
            <span className="preloader__meta">Creative agency</span>
          </div>
          <p className="preloader__right">
            Brand · Video · 3D
            <br />
            Web · Games
          </p>
          <div className="preloader__log" data-pre-log />
          <p className="preloader__count">
            <span data-pre-count>000</span>
            <small>%</small>
          </p>
          <div className="preloader__bar">
            <span data-pre-bar />
          </div>
        </div>
        <svg className="preloader__a" data-pre-a viewBox={A_BOX} aria-hidden="true">
          <path className="preloader__a-fill" d={A_PATH} fillRule="evenodd" data-pre-fill />
          <path className="preloader__a-line" d={A_PATH} fillRule="evenodd" data-pre-line />
        </svg>
      </div>

      {/* Шторка для дальних переходов по меню: красная волна + чёрная панель с буквой A и названием секции;
          за ней страница мгновенно встаёт на нужное место — без пролистывания через весь сайт */}
      <div className="jump" data-jump aria-hidden="true">
        <div className="jump__red" data-jump-red />
        <div className="jump__ink" data-jump-ink>
          <GlyphA className="jump__a" />
          <p className="jump__label" data-jump-label />
        </div>
      </div>

      {/* 3D-сцена с буквой A: фиксирована под контентом, видна сквозь прозрачные (нечётные) секции */}
      <canvas className="stage" data-stage aria-hidden="true" />

      <div className="noise" aria-hidden="true" />
    </>
  )
}
