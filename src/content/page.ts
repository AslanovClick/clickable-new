// Данные страницы для языка: тексты — из словаря, медиа и списки — общие для всех языков
import { cache } from 'react'
import { en } from './dictionaries/en'
import { ru } from './dictionaries/ru'
import { uk } from './dictionaries/uk'
import { LANGS, LANG_ORDER, type Lang } from './i18n'
import { CONTACTS, IMG, SITE, VID } from './site'

const DICT = { ru, en, uk }

export type FormKey = keyof typeof ru.forms
type Media = { video?: string; poster?: string; img?: string }

export const getPage = cache((lang: Lang) => {
  const T = DICT[lang]
  const LI = LANG_ORDER.indexOf(lang)

  // слово к числу: ru/uk — 3 формы (1 / 2–4 / 5+), en — 2 (1 / many)
  function pl(n: number, key: FormKey) {
    const f = T.forms[key]
    if (f.length === 2) return n === 1 ? f[0] : f[1]
    const a = n % 10
    const b = n % 100
    return a === 1 && b !== 11 ? f[0] : a >= 2 && a <= 4 && (b < 12 || b > 14) ? f[1] : f[2]
  }

  const META = {
    title: T.meta.title,
    description: T.meta.description,
    image: SITE + 'img/og-image.jpg',
    imageAlt: T.meta.imageAlt
  }

  const NAV = ['#services', '#work', '#process', '#geo', '#about', '#contact'].map((href, i) => ({ href, name: T.nav.items[i] }))

  // ---------- услуги (аккордеон): медиа общие, тексты — из словаря ----------
  const SERVICES = (
    [
      { id: 'brand', media: { video: VID + 'svc-brand.mp4', poster: IMG + 'cases/svc-brand.webp' } },
      { id: 'promo', media: { img: IMG + 'cases/leon.webp' } },
      { id: 'web', media: { video: VID + 'svc-web.mp4', poster: IMG + 'cases/svc-web.webp' } },
      { id: 'video', media: { video: VID + 'reel-loop.mp4', poster: IMG + 'cases/reel-loop.webp' } },
      { id: 'games', media: { video: VID + 'case-fishdom.mp4', poster: IMG + 'cases/case-fishdom.webp' } },
      { id: 'money', media: { video: VID + 'svc-money.mp4', poster: IMG + 'cases/svc-money.webp' } },
      { id: 'leads', media: { img: IMG + 'cases/parimatch.webp' } }
    ] as { id: string; media: Media }[]
  ).map((s, i) => ({ ...s, ...T.services.items[i] }))

  // ---------- кейсы (фильтр-табы + масонри + просмотрщик) ----------
  const FILTERS = ['all', 'promo', 'video', 'web', 'games', 'brand'].map((id, i) => ({ id, name: T.work.filters[i] }))

  // shape: tall / mid / square / wide — пропорции карточки в сетке
  const CASES = (
    [
      { client: 'Leon', cats: ['promo', 'video'], shape: 'mid', img: IMG + 'cases/leon.webp' },
      { client: 'Parimatch', cats: ['promo', 'web'], shape: 'tall', img: IMG + 'cases/parimatch.webp' },
      { client: 'Fleur de Lis', cats: ['promo', 'video'], shape: 'square', img: IMG + 'cases/case-fleur.webp', video: VID + 'case-fleur.mp4' },
      { client: 'OLL.TV', cats: ['web'], shape: 'mid', img: IMG + 'cases/olltv.webp' },
      { client: 'Fishdom', cats: ['games', 'video'], shape: 'wide', img: IMG + 'cases/case-fishdom.webp', video: VID + 'case-fishdom.mp4' },
      { client: 'Clickable', cats: ['brand', 'video'], shape: 'tall', img: IMG + 'cases/svc-brand.webp', video: VID + 'svc-brand.mp4' },
      { client: 'LetsExchange', cats: ['video', 'web'], shape: 'wide', img: IMG + 'cases/case-letsexchange.webp', full: VID + 'case-letsexchange.mp4' },
      { client: 'Sport Promo', cats: ['promo', 'brand'], shape: 'tall', img: IMG + 'cases/sport.webp' },
      { client: 'Explainer', cats: ['video'], shape: 'wide', img: IMG + 'cases/case-explainer.webp', full: VID + 'case-explainer.mp4' },
      { client: 'Clickable', cats: ['web', 'video', 'brand'], shape: 'square', img: IMG + 'cases/svc-web.webp', video: VID + 'svc-web.mp4' }
    ] as { client: string; cats: string[]; shape: string; img: string; video?: string; full?: string }[]
  ).map((c, i) => ({ ...c, num: (i < 9 ? '0' : '') + (i + 1), ...T.work.cases[i] }))

  // ---------- процесс ----------
  const STEPS = T.process.steps

  // ---------- география (3D-глобус) ----------
  // id — числовой код ISO 3166-1 (как в Natural Earth); n — страна, c — город [ru, en, uk];
  // lat/lon — точка на глобусе, tz — часовой пояс для «местного времени». РФ и Беларусь в список не входят.
  // ЗАМЕНИТЬ список на реальный.
  const REGIONS = [{ id: 'all' }, { id: 'eu', lat: 50, lon: 14 }, { id: 'asia', lat: 34, lon: 62 }, { id: 'af', lat: 3, lon: 18 }, { id: 'am', lat: 8, lon: -75 }]
  const PARTNERS = [
    { id: '804', n: ['Украина', 'Ukraine', 'Україна'], c: ['Киев', 'Kyiv', 'Київ'], lat: 50.45, lon: 30.52, tz: 'Europe/Kyiv', region: 'eu', hq: true },
    { id: '616', n: ['Польша', 'Poland', 'Польща'], c: ['Варшава', 'Warsaw', 'Варшава'], lat: 52.23, lon: 21.01, tz: 'Europe/Warsaw', region: 'eu' },
    { id: '276', n: ['Германия', 'Germany', 'Німеччина'], c: ['Берлин', 'Berlin', 'Берлін'], lat: 52.52, lon: 13.4, tz: 'Europe/Berlin', region: 'eu' },
    { id: '826', n: ['Великобритания', 'United Kingdom', 'Велика Британія'], c: ['Лондон', 'London', 'Лондон'], lat: 51.51, lon: -0.13, tz: 'Europe/London', region: 'eu' },
    { id: '372', n: ['Ирландия', 'Ireland', 'Ірландія'], c: ['Дублин', 'Dublin', 'Дублін'], lat: 53.35, lon: -6.26, tz: 'Europe/Dublin', region: 'eu' },
    { id: '528', n: ['Нидерланды', 'Netherlands', 'Нідерланди'], c: ['Амстердам', 'Amsterdam', 'Амстердам'], lat: 52.37, lon: 4.9, tz: 'Europe/Amsterdam', region: 'eu' },
    { id: '724', n: ['Испания', 'Spain', 'Іспанія'], c: ['Мадрид', 'Madrid', 'Мадрид'], lat: 40.42, lon: -3.7, tz: 'Europe/Madrid', region: 'eu' },
    { id: '620', n: ['Португалия', 'Portugal', 'Португалія'], c: ['Лиссабон', 'Lisbon', 'Лісабон'], lat: 38.72, lon: -9.14, tz: 'Europe/Lisbon', region: 'eu' },
    { id: '196', n: ['Кипр', 'Cyprus', 'Кіпр'], c: ['Лимасол', 'Limassol', 'Лімасол'], lat: 34.71, lon: 33.02, tz: 'Asia/Nicosia', region: 'eu' },
    { id: '233', n: ['Эстония', 'Estonia', 'Естонія'], c: ['Таллин', 'Tallinn', 'Таллінн'], lat: 59.44, lon: 24.75, tz: 'Europe/Tallinn', region: 'eu' },
    { id: '203', n: ['Чехия', 'Czechia', 'Чехія'], c: ['Прага', 'Prague', 'Прага'], lat: 50.08, lon: 14.44, tz: 'Europe/Prague', region: 'eu' },
    { id: '498', n: ['Молдова', 'Moldova', 'Молдова'], c: ['Кишинёв', 'Chisinau', 'Кишинів'], lat: 47.01, lon: 28.86, tz: 'Europe/Chisinau', region: 'eu' },
    { id: '268', n: ['Грузия', 'Georgia', 'Грузія'], c: ['Тбилиси', 'Tbilisi', 'Тбілісі'], lat: 41.72, lon: 44.79, tz: 'Asia/Tbilisi', region: 'asia' },
    { id: '051', n: ['Армения', 'Armenia', 'Вірменія'], c: ['Ереван', 'Yerevan', 'Єреван'], lat: 40.18, lon: 44.51, tz: 'Asia/Yerevan', region: 'asia' },
    { id: '398', n: ['Казахстан', 'Kazakhstan', 'Казахстан'], c: ['Алматы', 'Almaty', 'Алмати'], lat: 43.24, lon: 76.89, tz: 'Asia/Almaty', region: 'asia' },
    { id: '860', n: ['Узбекистан', 'Uzbekistan', 'Узбекистан'], c: ['Ташкент', 'Tashkent', 'Ташкент'], lat: 41.3, lon: 69.24, tz: 'Asia/Tashkent', region: 'asia' },
    { id: '792', n: ['Турция', 'Türkiye', 'Туреччина'], c: ['Стамбул', 'Istanbul', 'Стамбул'], lat: 41.01, lon: 28.98, tz: 'Europe/Istanbul', region: 'asia' },
    { id: '784', n: ['ОАЭ', 'UAE', 'ОАЕ'], c: ['Дубай', 'Dubai', 'Дубай'], lat: 25.2, lon: 55.27, tz: 'Asia/Dubai', region: 'asia' },
    { id: '356', n: ['Индия', 'India', 'Індія'], c: ['Мумбаи', 'Mumbai', 'Мумбаї'], lat: 19.08, lon: 72.88, tz: 'Asia/Kolkata', region: 'asia' },
    { id: '050', n: ['Бангладеш', 'Bangladesh', 'Бангладеш'], c: ['Дакка', 'Dhaka', 'Дакка'], lat: 23.81, lon: 90.41, tz: 'Asia/Dhaka', region: 'asia' },
    { id: '566', n: ['Нигерия', 'Nigeria', 'Нігерія'], c: ['Лагос', 'Lagos', 'Лагос'], lat: 6.52, lon: 3.38, tz: 'Africa/Lagos', region: 'af' },
    { id: '404', n: ['Кения', 'Kenya', 'Кенія'], c: ['Найроби', 'Nairobi', 'Найробі'], lat: -1.29, lon: 36.82, tz: 'Africa/Nairobi', region: 'af' },
    { id: '288', n: ['Гана', 'Ghana', 'Гана'], c: ['Аккра', 'Accra', 'Аккра'], lat: 5.6, lon: -0.19, tz: 'Africa/Accra', region: 'af' },
    { id: '800', n: ['Уганда', 'Uganda', 'Уганда'], c: ['Кампала', 'Kampala', 'Кампала'], lat: 0.35, lon: 32.58, tz: 'Africa/Kampala', region: 'af' },
    { id: '834', n: ['Танзания', 'Tanzania', 'Танзанія'], c: ['Дар-эс-Салам', 'Dar es Salaam', 'Дар-ес-Салам'], lat: -6.79, lon: 39.21, tz: 'Africa/Dar_es_Salaam', region: 'af' },
    { id: '076', n: ['Бразилия', 'Brazil', 'Бразилія'], c: ['Сан-Паулу', 'São Paulo', 'Сан-Паулу'], lat: -23.55, lon: -46.63, tz: 'America/Sao_Paulo', region: 'am' },
    { id: '484', n: ['Мексика', 'Mexico', 'Мексика'], c: ['Мехико', 'Mexico City', 'Мехіко'], lat: 19.43, lon: -99.13, tz: 'America/Mexico_City', region: 'am' },
    { id: '170', n: ['Колумбия', 'Colombia', 'Колумбія'], c: ['Богота', 'Bogotá', 'Богота'], lat: 4.71, lon: -74.07, tz: 'America/Bogota', region: 'am' },
    { id: '604', n: ['Перу', 'Peru', 'Перу'], c: ['Лима', 'Lima', 'Ліма'], lat: -12.05, lon: -77.04, tz: 'America/Lima', region: 'am' },
    { id: '152', n: ['Чили', 'Chile', 'Чилі'], c: ['Сантьяго', 'Santiago', 'Сантьяго'], lat: -33.45, lon: -70.67, tz: 'America/Santiago', region: 'am' },
    { id: '032', n: ['Аргентина', 'Argentina', 'Аргентина'], c: ['Буэнос-Айрес', 'Buenos Aires', 'Буенос-Айрес'], lat: -34.6, lon: -58.38, tz: 'America/Argentina/Buenos_Aires', region: 'am' },
    { id: '840', n: ['США', 'USA', 'США'], c: ['Нью-Йорк', 'New York', 'Нью-Йорк'], lat: 40.71, lon: -74.01, tz: 'America/New_York', region: 'am' },
    { id: '124', n: ['Канада', 'Canada', 'Канада'], c: ['Торонто', 'Toronto', 'Торонто'], lat: 43.65, lon: -79.38, tz: 'America/Toronto', region: 'am' }
  ].map((p) => ({ id: p.id, name: p.n[LI], city: p.c[LI], lat: p.lat, lon: p.lon, tz: p.tz, region: p.region, hq: !!p.hq }))
  const REGION_LIST = REGIONS.map((r) => ({
    ...r,
    name: T.geo.regions[r.id as keyof typeof T.geo.regions],
    count: r.id === 'all' ? PARTNERS.length : PARTNERS.filter((p) => p.region === r.id).length
  }))
  const HQ = PARTNERS.filter((p) => p.hq)[0]
  // число часовых поясов (по текущим смещениям от UTC) — считается при сборке
  const seen = new Set<string>()
  PARTNERS.forEach((p) => {
    try {
      const part = new Intl.DateTimeFormat('en-US', { timeZone: p.tz, timeZoneName: 'shortOffset' }).formatToParts(new Date()).filter((x) => x.type === 'timeZoneName')[0]
      seen.add(part ? part.value : p.tz)
    } catch {
      seen.add(p.tz)
    }
  })
  const TZ_COUNT = seen.size

  // ---------- клиенты ----------
  // raw — растровый по сути логотип: в белый силуэт не перекрашиваем, только обесцвечиваем
  const CLIENTS = [
    { id: 'parimatch', name: 'Parimatch' },
    { id: 'melbet', name: 'Melbet' },
    { id: 'playrix', name: 'Playrix' },
    { id: 'leon', name: 'Leon' },
    { id: 'olltv', name: 'OLL.TV' },
    { id: 'trueplay', name: 'TruePlay' },
    { id: 'dinero', name: 'Dinero' },
    { id: 'tennisi', name: 'Tennisi.kz' },
    { id: 'gamerall', name: 'Gamerall', raw: true }
  ]

  // индустрии (слайдер); filter — какой таб кейсов открыть по кнопке
  const INDUSTRIES = (
    [
      { clients: ['Parimatch', 'Melbet', 'Leon', 'TruePlay'], filter: 'promo' },
      { clients: ['Playrix', 'Gamerall'], filter: 'games' },
      { clients: ['OLL.TV'], filter: 'web' },
      { clients: ['LetsExchange', 'Dinero'], filter: 'video' },
      { clients: ['Fleur de Lis'], filter: 'promo' },
      { clients: [], cta: true }
    ] as { clients: string[]; filter?: string; cta?: boolean }[]
  ).map((x, i) => ({ ...x, ...T.clients.items[i] }))

  // ---------- о нас ----------
  const QUOTE = { text: T.about.quote, who: 'Head of Digital Marketing', company: 'Melbet' }
  const AWARDS = [
    { img: IMG + 'awards/clutch.svg', name: 'Clutch', title: 'Top Advertising & Marketing Agencies' },
    { img: IMG + 'awards/designrush.png', name: 'DesignRush', title: 'Best Website Design' },
    { img: IMG + 'awards/manifest.svg', name: 'The Manifest', title: 'Most Reviewed' }
  ]
  const STATS = (
    [
      ['countries', PARTNERS.length],
      ['services', SERVICES.length],
      ['tz', TZ_COUNT],
      ['awards', AWARDS.length]
    ] as [FormKey, number][]
  ).map((s, i) => ({ v: s[1], k: T.about.stats[i].replace('{' + s[0] + '}', pl(s[1], s[0])) }))

  // ---------- бриф ----------
  const BRIEF = { services: T.contact.services, budgets: T.contact.budgets }

  // строки и данные для движка анимаций (клиентский JS)
  const JS = {
    ...T.js,
    briefFail: T.js.briefFail.replace('{email}', CONTACTS.email),
    lang,
    intl: LANGS[lang].intl,
    view: T.work.view,
    play: 'Play',
    loves: ['LOVE', 'PASSION', 'DESIRE'],
    log: ['loading fonts', 'extruding letter A', 'calibrating light', 'assembling grid', 'ready to click'],
    geo: PARTNERS,
    regions: REGION_LIST,
    // подписи секций для шторки перехода: [номер, название]
    sections: {
      '#home': ['', 'CLICKABLE'],
      '#services': ['02', T.nav.items[0]],
      '#work': ['03', T.nav.items[1]],
      '#process': ['05', T.nav.items[2]],
      '#geo': ['06', T.nav.items[3]],
      '#clients': ['07', T.clients.label],
      '#about': ['08', T.nav.items[4]],
      '#contact': ['09', T.nav.items[5]]
    } as Record<string, [string, string]>,
    cases: CASES.map((c) => ({ num: c.num, client: c.client, kind: c.kind, text: c.text, img: c.img, video: c.full || c.video || '' }))
  }

  const LD = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SITE + '#organization',
    name: 'CLICKABLE',
    url: SITE,
    logo: SITE + 'img/icon-512.png',
    email: CONTACTS.email,
    telephone: CONTACTS.phoneHref,
    slogan: T.hero.tag,
    description: META.description,
    inLanguage: lang
  }

  return {
    lang,
    T,
    pl,
    META,
    NAV,
    SERVICES,
    FILTERS,
    CASES,
    STEPS,
    REGIONS: REGION_LIST,
    PARTNERS,
    HQ,
    TZ_COUNT,
    CLIENTS,
    INDUSTRIES,
    QUOTE,
    AWARDS,
    STATS,
    FAQ: T.about.faq,
    BRIEF,
    JS,
    LD
  }
})

export type PageData = ReturnType<typeof getPage>
export type EngineStrings = PageData['JS']
