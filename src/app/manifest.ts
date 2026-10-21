import type { MetadataRoute } from 'next'
import { getPage } from '@/content/page'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CLICKABLE',
    short_name: 'CLICKABLE',
    description: getPage('ru').META.description,
    start_url: '/',
    display: 'browser',
    background_color: '#070707',
    theme_color: '#070707',
    icons: [
      { src: '/img/icon-192.png', type: 'image/png', sizes: '192x192' },
      { src: '/img/icon-512.png', type: 'image/png', sizes: '512x512' }
    ]
  }
}
