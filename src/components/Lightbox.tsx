import type { PageData } from '@/content/page'
import { Icon } from './icons'

// Просмотрщик кейсов и шоурила (диалог); содержимое подставляет движок (src/engine/widgets.ts)
export function Lightbox({ p }: { p: PageData }) {
  const { T } = p
  return (
    <div className="lightbox" data-lightbox role="dialog" aria-modal="true" aria-labelledby="lb-title" hidden>
      <div className="lightbox__bg" data-lb-close />
      <div className="lightbox__frame">
        <div className="lightbox__media" data-lb-media />
        <div className="lightbox__info">
          <p className="lightbox__num">
            <span data-lb-num>01</span>
            <span className="lightbox__of" data-lb-of />
          </p>
          <h2 className="lightbox__title" id="lb-title" data-lb-title>
            CLICKABLE
          </h2>
          <p className="lightbox__kind" data-lb-kind />
          <p className="lightbox__text" data-lb-text />
          <div className="lightbox__nav" data-lb-nav>
            <button className="slider__btn" type="button" data-lb-prev aria-label={T.lightbox.prev}>
              <Icon name="prev" />
            </button>
            <button className="slider__btn" type="button" data-lb-next aria-label={T.lightbox.next}>
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </div>
      <button className="lightbox__close" type="button" data-lb-close aria-label={T.lightbox.close}>
        <Icon name="close" />
      </button>
    </div>
  )
}
