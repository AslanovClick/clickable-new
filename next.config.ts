import type { NextConfig } from 'next'

const LONG = 'public, max-age=31536000, immutable'
const WEEK = 'public, max-age=604800, stale-while-revalidate=86400'

const nextConfig: NextConfig = {
  // адреса языковых версий — со слешем на конце, как на статической версии сайта: /en/, /uk/
  trailingSlash: true,
  // движок анимаций (src/engine) сам ставит классы на <html>, а повторный монтаж Strict Mode в dev их сбрасывает
  reactStrictMode: false,
  // файлы из public/ Vercel по умолчанию отдаёт без кэша — шрифты и медиа кэшируем
  async headers() {
    return [
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: LONG }] },
      { source: '/img/:path*', headers: [{ key: 'Cache-Control', value: WEEK }] },
      { source: '/video/:path*', headers: [{ key: 'Cache-Control', value: WEEK }] }
    ]
  }
}

export default nextConfig
