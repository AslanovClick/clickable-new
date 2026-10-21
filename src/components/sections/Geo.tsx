import type { FormKey, PageData } from '@/content/page'
import { Icon } from '../icons'

// 6 (чётная, непрозрачная) — география: 3D-глобус, табы регионов, список стран, местное время
export function Geo({ p }: { p: PageData }) {
  const { T, PARTNERS, REGIONS, TZ_COUNT, HQ, pl } = p
  const stats: [FormKey, number][] = [
    ['countries', PARTNERS.length],
    ['continents', REGIONS.length - 1],
    ['tz', TZ_COUNT]
  ]
  return (
    <section className="sec sec--dark geo" id="geo" aria-labelledby="geo-title" data-geo>
      <div className="container geo__grid">
        <div className="geo__info">
          <p className="label" data-scramble>
            <span className="label__num">[06]</span>
            {' ' + T.geo.label}
          </p>
          <h2 className="title" id="geo-title" data-type>
            {T.geo.t1}
            <br />
            <span className="accent">{T.geo.t2}</span>
          </h2>
          <p className="text" data-fade>
            {T.geo.text}
          </p>

          <div className="geo__stats" role="list">
            {stats.map((st) => (
              <div key={st[0]} className="geo__stat" role="listitem" data-card>
                <p className="geo__v">
                  <span data-count={st[1]}>{st[1]}</span>
                </p>
                <p className="geo__k">{pl(st[1], st[0])}</p>
              </div>
            ))}
          </div>

          <div className="tabs geo__tabs" role="tablist" aria-label={T.geo.regionAria} data-geo-tabs data-fade>
            {REGIONS.map((r, i) => (
              <button
                key={r.id}
                className="tabs__btn"
                type="button"
                role="tab"
                aria-selected={i === 0 ? 'true' : 'false'}
                aria-controls="geo-list"
                tabIndex={i === 0 ? 0 : -1}
                data-region={r.id}
              >
                <span>{r.name}</span>
                <sup className="tabs__n">{r.count}</sup>
              </button>
            ))}
            <span className="tabs__ind" data-tabs-ind aria-hidden="true" />
          </div>

          <ul className="geo__list" id="geo-list" role="tabpanel" aria-label={T.geo.listAria} data-geo-list data-fade>
            {PARTNERS.map((c) => (
              <li key={c.id} data-region={c.region}>
                <button className={'chip' + (c.hq ? ' chip--hq' : '')} type="button" data-country={c.id} aria-pressed="false">
                  {c.hq ? <span className="chip__dot" /> : null}
                  {c.name}
                </button>
              </li>
            ))}
          </ul>

          <div className="geo__card" data-geo-card aria-live="polite" data-fade>
            <p className="geo__card-k" data-geo-card-k>
              {T.js.hq}
            </p>
            <p className="geo__card-name">
              <span data-geo-card-name>{HQ.name}</span>
              <span className="geo__card-city" data-geo-card-city>
                {HQ.city}
              </span>
            </p>
            <p className="geo__card-time">
              <Icon name="clock" />
              <span data-geo-card-time>--:--</span>
              <span className="geo__card-tz" data-geo-card-tz />
            </p>
          </div>
        </div>

        <div className="geo__globe" data-globe data-cursor-drag>
          <canvas className="geo__canvas" data-globe-canvas aria-hidden="true" />
          <div className="geo__tip" data-geo-tip aria-hidden="true" />
          <p className="geo__hint" aria-hidden="true">
            <Icon name="drag" />
            {T.geo.hint}
          </p>
        </div>
      </div>
    </section>
  )
}
