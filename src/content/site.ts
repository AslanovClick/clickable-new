// Боевой домен: canonical, hreflang, Open Graph, JSON-LD, robots.txt и sitemap.xml
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://clickable.agency').replace(/\/?$/, '/')
export const YEAR = 2026
export const IMG = '/img/'
// видео можно вынести на CDN (Vercel Blob, R2…) — тогда здесь его адрес, со слешем на конце
export const VID = process.env.NEXT_PUBLIC_MEDIA_URL || '/video/'

export const CONTACTS = {
  email: 'office@clickable.agency',
  hr: 'hr@clickable.agency',
  phone: '+38 063 999 37 77',
  phoneHref: '+380639993777',
  messengers: 'Telegram · WhatsApp · Viber'
}

// ссылки соцсетей — ПОДСТАВИТЬ реальные
export const SOCIALS = [
  { id: 'instagram', name: 'Instagram', href: '#' },
  { id: 'behance', name: 'Behance', href: '#' },
  { id: 'dribbble', name: 'Dribbble', href: '#' },
  { id: 'linkedin', name: 'LinkedIn', href: '#' },
  { id: 'facebook', name: 'Facebook', href: '#' }
] as const
