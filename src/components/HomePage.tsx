import type { PageData } from '@/content/page'
import { Engine } from './Engine'
import { Footer } from './Footer'
import { Header } from './Header'
import { Layers } from './Layers'
import { Lightbox } from './Lightbox'
import { About } from './sections/About'
import { Clients } from './sections/Clients'
import { Contact } from './sections/Contact'
import { Geo } from './sections/Geo'
import { Hero } from './sections/Hero'
import { Process } from './sections/Process'
import { Reel } from './sections/Reel'
import { Services } from './sections/Services'
import { Work } from './sections/Work'

// Вся страница — серверные компоненты (чистая разметка); поведение и анимации подключает <Engine>
export function HomePage({ p }: { p: PageData }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(p.LD).replace(/</g, '\\u003c') }} />
      <a className="skip-link" href="#main">
        {p.T.skip}
      </a>
      <Layers />
      <Header p={p} />
      <main className="body-wrap" id="main" tabIndex={-1}>
        {/* нечётные секции прозрачные — под ними живёт 3D-буква A; чётные — непрозрачные и закрывают её */}
        <Hero p={p} />
        <Services p={p} />
        <Work p={p} />
        <Reel p={p} />
        <Process p={p} />
        <Geo p={p} />
        <Clients p={p} />
        <About p={p} />
        <Contact p={p} />
      </main>
      <Footer p={p} />
      <Lightbox p={p} />
      <Engine strings={p.JS} />
    </>
  )
}
