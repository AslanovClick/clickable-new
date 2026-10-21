'use client'

// Скрипт, который браузер выполняет при разборе HTML — до первой отрисовки и до гидрации.
// На клиенте React получает type="text/plain" и не ругается на <script> в дереве (см. доки Next: preventing flash)
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
