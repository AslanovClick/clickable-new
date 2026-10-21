import type { PageData } from '@/content/page'
import { Shards } from '../icons'

const SHARD_K = [1, 0.62, 0.34, 0.12, 0]

// 5 (нечётная, прозрачная) — процесс: пин, шаги едут горизонтально, буква собирается из осколков
export function Process({ p }: { p: PageData }) {
  const { T, STEPS } = p
  return (
    <section className="process" id="process" aria-labelledby="process-title" data-process data-odd>
      <div className="process__inner">
        <div className="container process__head">
          <div>
            <p className="label" data-scramble>
              <span className="label__num">[05]</span>
              {' ' + T.process.label}
            </p>
            <h2 className="title" id="process-title" data-type>
              {T.process.t1}
              <br />
              <span className="accent">{T.process.t2}</span>
            </h2>
          </div>
          <div className="process__meta">
            <p className="text" data-fade>
              {T.process.text}
            </p>
            <div className="process__progress" data-fade aria-hidden="true">
              <span className="process__count">
                <span data-process-index>01</span>
                {' / 0' + STEPS.length}
              </span>
              <span className="process__bar">
                <span data-process-bar />
              </span>
            </div>
          </div>
        </div>
        <div className="process__track" data-process-track>
          {STEPS.map((s, i) => (
            <article key={s.title} className="step" data-step>
              <div className="step__top">
                <span className="step__num">{'0' + (i + 1)}</span>
                <Shards k={SHARD_K[i]} />
              </div>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__text">{s.text}</p>
              <dl className="step__specs">
                {s.specs.map((sp) => (
                  <div key={sp[0]}>
                    <dt>{sp[0]}</dt>
                    <dd>{sp[1]}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
