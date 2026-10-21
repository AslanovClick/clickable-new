'use client'

import { useEffect } from 'react'
import type { EngineStrings } from '@/content/page'
import { boot } from '@/engine/boot'

// Запускает движок анимаций один раз за загрузку страницы. Движок живёт, пока открыта страница:
// смена языка — переход на другую статическую страницу, клиентской навигации нет
export function Engine({ strings }: { strings: EngineStrings }) {
  useEffect(() => {
    boot(strings)
  }, [strings])
  return null
}
