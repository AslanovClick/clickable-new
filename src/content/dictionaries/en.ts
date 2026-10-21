import type { Dictionary } from './ru'

export const en: Dictionary = {
  meta: {
    title: 'CLICKABLE — creative agency: branding, video, 3D, web and games',
    description: 'Solving problems with creativity. Branding and identity, promo materials, web development, video and 3D animation, game development, traffic monetization and lead generation.',
    imageAlt: 'CLICKABLE — the signature letter A in 3D on a black background'
  },
  skip: 'Skip to content',
  // word forms for numbers: 1 / many
  forms: {
    countries: ['country', 'countries'],
    continents: ['continent', 'continents'],
    tz: ['time zone', 'time zones'],
    services: ['discipline', 'disciplines'],
    awards: ['award', 'awards']
  },
  lang: 'Language',
  logoHome: 'CLICKABLE — home',
  nav: {
    aria: 'Main navigation',
    ariaMobile: 'Mobile navigation',
    menu: 'Menu',
    items: ['Services', 'Work', 'Process', 'Geography', 'About', 'Contact'],
    cta: 'Discuss a project'
  },
  hero: {
    h1: 'CLICKABLE — creative agency. Solving problems with creativity',
    tag: 'Solving problems with creativity',
    list: ['Branding', 'Video', '3D', 'Web', 'Games'],
    manLabel: 'Manifesto',
    man: 'We brought together creative workaholics so you always have someone to rely on. Branding, video, 3D, web and games — everything that makes people click.',
    manAcc: ['workaholics', 'click.'],
    manMeta: [['Creative', 'from scratch'], ['Team', 'in-house'], ['Format', 'end-to-end']]
  },
  services: {
    label: 'Services',
    t1: 'Full cycle —',
    t2: 'from idea to click',
    text: 'Seven disciplines under one roof: we assemble a team around your task and run the project from brief to result.',
    includes: 'What’s included',
    discuss: 'Discuss your task',
    items: [
      { title: 'Branding & identity', short: 'Naming · Logo · Brand book', text: 'We build brands people recognize at first glance: from the name and logo to the visual identity, brand book and print.', items: ['Naming', 'Logo', 'Visual identity', 'Brand book', 'Print'] },
      { title: 'Promo materials', short: 'Banners · Key visual · Playable', text: 'Creative ad materials that meet any platform’s requirements — from static banners and key visuals to playable ads.', items: ['Banners', 'Key visual', 'Playable ads', 'Social media', 'Outdoor'] },
      { title: 'Web development', short: 'UX/UI · Front-end · CMS', text: 'Modern websites of any complexity: promo landing pages, corporate portals and interfaces people actually want to click.', items: ['UX/UI design', 'Landing pages', 'Corporate websites', 'Front-end', 'Back-end & CMS'] },
      { title: 'Video & 3D animation', short: '3D · Motion · Explainers', text: '2D and 3D videos, animation and graphics, cartoons and video infographics — we explain the complex and make it beautiful.', items: ['3D videos', 'Motion design', 'Explainers', 'Video infographics', 'CGI'] },
      { title: 'Game development', short: 'Game design · 2D art · UI', text: 'Concept development: mechanics, story, setting, documentation. 2D graphics, interfaces and animation for mobile and browser games.', items: ['Game design', 'Concept art', '2D graphics', 'Game UI', 'Animation'] },
      { title: 'Ads & traffic monetization', short: 'Ad placement · RTB · Analytics', text: 'We help publishers and content creators earn more: strategic ad placement, real-time bidding and monetization tools.', items: ['Ad placement', 'Real-time bidding', 'Analytics', 'Revenue growth'] },
      { title: 'Lead generation', short: 'Performance · Targeting · Funnels', text: 'We deliver quality leads that convert: performance strategies, targeted digital outreach and funnels built around your product.', items: ['Performance marketing', 'Targeting', 'Funnels', 'Landing pages for traffic'] }
    ]
  },
  work: {
    label: 'Selected work',
    t1: 'Work that',
    t2: 'sticks',
    text: 'Promo, video, 3D, interfaces and games for brands in iGaming, GameDev, media and e-commerce. Click a card to take a closer look.',
    filterAria: 'Filter cases',
    filters: ['All', 'Promo', 'Video & 3D', 'Web & UI', 'Games', 'Branding'],
    view: 'View',
    open: 'Open case',
    note: 'Want the same — but about you?',
    discuss: 'Discuss a project',
    cases: [
      { kind: 'Promo · 3D', text: 'A 3D promo for the brand: the logo in a space scene, dynamic camera and lighting. A video for social media and ad platforms.' },
      { kind: 'Promo · UI/UX · Front-end', text: 'Promo materials and interfaces: from the campaign key visual to promo page front-end.' },
      { kind: 'Promo video · Illustration', text: 'A short promo video with illustration and kinetic typography for a flower brand.' },
      { kind: 'UI/UX · Front-end', text: 'UI/UX and front-end for an online cinema: promo pages, animations and interface elements.' },
      { kind: 'Ad video · Game', text: 'An ad video for a mobile game: gameplay, effects and editing for ad network formats.' },
      { kind: '3D identity · Branding', text: 'A 3D visual for the Branding discipline in the agency’s own identity.' },
      { kind: 'Video explainer · UI', text: 'A video explainer for a crypto exchange: showing the product through its interface — simple and clear.' },
      { kind: 'Key visual · Campaign', text: 'Key visual for a sports promo campaign: monochrome, the signature red and dynamic framing.' },
      { kind: '2D animation', text: 'A 2D animated explainer: characters, script and editing tailored to the client’s task.' },
      { kind: '3D promo · Web', text: 'A 3D visual for the Web development discipline in the agency’s own identity.' }
    ]
  },
  reel: {
    t1: 'See it',
    t2: 'in motion',
    play: 'Watch showreel · 0:31',
    ticker: ['Branding', 'Video', '3D', 'Web', 'Games', 'Promo', 'Motion', 'UI/UX']
  },
  process: {
    label: 'Process',
    t1: 'From shards',
    t2: 'to form',
    text: 'Five steps in which scattered ideas come together into a product that works. Hover over a step — the shards snap into place.',
    steps: [
      { title: 'Brief & immersion', text: 'We study your business, audience and competitors, and frame the task so the result can be measured.', specs: [['Timing', '2–5 days'], ['Output', 'Brief & KPIs']] },
      { title: 'Strategy & idea', text: 'We look for the idea that sets you apart from the market and shape it into a clear concept with references.', specs: [['Timing', '1–2 weeks'], ['Output', 'Concept']] },
      { title: 'Design', text: 'We turn the concept into a visual system: style, layouts, prototypes, storyboards and animations.', specs: [['Timing', '2–4 weeks'], ['Output', 'Layouts']] },
      { title: 'Production', text: 'We develop, animate, render and test — sharing interim results at every stage.', specs: [['Timing', '2–8 weeks'], ['Output', 'Finished product']] },
      { title: 'Launch & growth', text: 'We launch, measure the results and fine-tune whatever brings clicks, leads and sales.', specs: [['Timing', 'Ongoing'], ['Output', 'Metric growth']] }
    ]
  },
  geo: {
    label: 'Geography',
    t1: 'We work',
    t2: 'worldwide',
    text: 'The team is in Kyiv, our clients are on four continents. We adapt to your time zone and speak your language.',
    regionAria: 'Region',
    listAria: 'Countries',
    hint: 'Drag to rotate',
    regions: { all: 'All', eu: 'Europe', asia: 'Asia', af: 'Africa', am: 'Americas' }
  },
  clients: {
    label: 'Clients',
    t1: 'Brands that',
    t2: 'trust us',
    text: 'Brands we’ve launched campaigns, videos, websites and games with. Hover over a logo to reveal its colors.',
    listAria: 'Our clients',
    industries: 'Industries',
    prev: 'Previous slide',
    next: 'Next slide',
    slide: 'slide',
    of: 'of',
    clientsAria: 'Clients',
    discuss: 'Discuss your task',
    viewCases: 'View cases',
    items: [
      { title: 'iGaming & betting', text: 'Promo campaigns, banners, slots and playable ads for brands operating in dozens of countries.' },
      { title: 'GameDev', text: 'Trailers, game art, interfaces and animation for mobile and browser games.' },
      { title: 'Media & streaming', text: 'Interfaces, promo pages and animations for online TV and media platforms.' },
      { title: 'FinTech & crypto', text: 'Explainers, interfaces and landing pages that make a complex product feel simple.' },
      { title: 'E-commerce & retail', text: 'Videos, banners and websites that sell — and visuals people want to save.' },
      { title: 'Your industry', text: 'A niche that’s new to us? Great. The most interesting tasks start with “can we even do that?”' }
    ]
  },
  about: {
    t1: 'Not just',
    t2: 'a click.',
    t3: 'A reaction.',
    lead: 'We create digital experiences that resonate: strategy, design and motion working together — in form and in feeling. For brands that want people to react.',
    more: 'Get to know us',
    photoAlt: 'The CLICKABLE team celebrating at the office',
    caption: 'The CLICKABLE team — creative in-house workaholics',
    stats: ['{countries} on our client map', 'end-to-end {services}', '{tz}', 'industry {awards}'],
    quote: 'Our teams in Africa, Latin America and Eastern Europe all work with Clickable. Web, advertising, creative from scratch, complex videos with 3D objects, print — they handle any task in a recognizable, unique style. True rockets of the advertising world!',
    awardsAria: 'Awards',
    faq1: 'Common',
    faq2: 'questions',
    faq: [
      { q: 'How much does a project cost?', a: 'It depends on the task: a banner campaign and a complex 3D video are different universes. We give an exact estimate after the brief, usually within 1–2 business days.' },
      { q: 'How long does it take?', a: 'A banner set takes a few days, a website or branding — from 3–4 weeks, a 3D video — from 4–6 weeks. We fix the timeline in the plan before we start.' },
      { q: 'Do you work with international clients?', a: 'Yes, they make up a big part of our projects. We speak Ukrainian, Russian and English and adapt to your time zone.' },
      { q: 'Can I order just one service?', a: 'Of course. Come to us for a logo or a single video — or hand over the whole cycle, from strategy to launch and analytics.' },
      { q: 'What do you need to get started?', a: 'Fill in the brief below or drop us a line — we’ll set up a short call, ask our questions and come back with a plan.' }
    ]
  },
  contact: {
    label: 'Contact',
    t1: 'Ready to become',
    t2: 'clickable?',
    need: 'What do you need?',
    budget: 'Budget',
    time: 'Timeline',
    name: 'Name',
    contact: 'Email or Telegram',
    message: 'Tell us about the task',
    submit: 'Send brief',
    coop: 'Partnerships',
    career: 'Careers',
    listAria: 'Contacts',
    services: ['Branding', 'Promo', 'Web', 'Video & 3D', 'Games', 'Monetization', 'Lead generation'],
    budgets: ['up to $5k', '$5–15k', '$15–50k', '$50k+']
  },
  footer: { social: 'Social media', top: 'Back to top' },
  lightbox: { prev: 'Previous case', next: 'Next case', close: 'Close' },
  js: {
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    drag: 'Drag',
    localTime: 'Local time',
    hq: 'Headquarters',
    partner: 'Clients here',
    briefEmpty: 'pick services',
    briefMonths: 'mo',
    briefErr: 'Please fill in your name and contact so we can get back to you',
    briefSending: 'Sending',
    briefOk: 'Brief received. We’ll get back to you within one business day',
    briefFail: 'We couldn’t send the brief. Please email us at {email}',
    caseOf: 'of'
  }
}
