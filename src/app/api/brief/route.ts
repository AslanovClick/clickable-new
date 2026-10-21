// Приём брифа из формы контактов. Доставка — в Telegram и/или на вебхук (CRM, Make, Zapier, n8n…):
//   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID — сообщение от бота в чат;
//   BRIEF_WEBHOOK_URL — POST с JSON брифа.
// Без настроек в dev бриф пишется в консоль, в production форма честно сообщает об ошибке (и даёт почту).

type Brief = {
  name: string
  contact: string
  message: string
  services: string[]
  budget: string
  months: string
  lang: string
}

function str(v: unknown, max: number) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function json(body: object, status = 200) {
  return Response.json(body, { status })
}

function telegramText(b: Brief) {
  return [
    'Новый бриф с сайта (' + b.lang + ')',
    '',
    'Имя: ' + b.name,
    'Контакт: ' + b.contact,
    'Услуги: ' + (b.services.length ? b.services.join(', ') : '—'),
    'Бюджет: ' + (b.budget || '—'),
    'Сроки: ' + (b.months || '—'),
    '',
    b.message || '—'
  ].join('\n')
}

async function deliver(b: Brief) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  const hook = process.env.BRIEF_WEBHOOK_URL
  const jobs: Promise<Response>[] = []
  if (token && chat) {
    jobs.push(
      fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: telegramText(b) })
      })
    )
  }
  if (hook) {
    jobs.push(
      fetch(hook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...b, receivedAt: new Date().toISOString() })
      })
    )
  }
  if (!jobs.length) return null
  const results = await Promise.allSettled(jobs)
  // бриф доставлен, если дошёл хотя бы до одного канала
  return results.some((r) => r.status === 'fulfilled' && r.value.ok)
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, error: 'bad-request' }, 400)
  }

  // ловушка для ботов: поле скрыто от людей — делаем вид, что всё хорошо
  if (str(body.website, 200)) return json({ ok: true })

  const brief: Brief = {
    name: str(body.name, 200),
    contact: str(body.contact, 200),
    message: str(body.message, 5000),
    services: Array.isArray(body.services) ? body.services.filter((s): s is string => typeof s === 'string').slice(0, 20).map((s) => s.slice(0, 100)) : [],
    budget: str(body.budget, 50),
    months: str(body.months, 20),
    lang: str(body.lang, 5)
  }
  if (!brief.name || !brief.contact) return json({ ok: false, error: 'required' }, 422)

  const delivered = await deliver(brief)
  if (delivered === null) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[brief] каналы доставки не настроены, бриф:', brief)
      return json({ ok: true })
    }
    console.error('[brief] не настроены TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID или BRIEF_WEBHOOK_URL — бриф не доставлен')
    return json({ ok: false, error: 'not-configured' }, 503)
  }
  if (!delivered) {
    console.error('[brief] ни один канал доставки не принял бриф')
    return json({ ok: false, error: 'delivery' }, 502)
  }
  return json({ ok: true })
}
