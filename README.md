# CLICKABLE — сайт агентства

Next.js 16 (App Router) + TypeScript + SCSS. Одна страница на трёх языках: `/` — ru, `/en/`, `/uk/`.
Все страницы собираются статически; на сервере работает только приём брифа (`/api/brief/`).

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # продакшн-сборка
npm start          # запуск собранного
npm run lint
npm run typecheck
```

Node.js 20.9+.

## Устройство

```
src/
  app/                  маршруты
    (ru)/               корень сайта — русская версия
    [lang]/             en и uk (generateStaticParams)
    api/brief/route.ts  приём брифа → Telegram и/или вебхук
    sitemap.ts, robots.ts, manifest.ts
  content/              тексты и данные
    dictionaries/       ru.ts, en.ts, uk.ts — все строки сайта, структура одинаковая
    page.ts             данные страницы: услуги, кейсы, страны, клиенты, JSON-LD, строки для движка
    site.ts             домен, контакты, соцсети, пути к медиа
    metadata.ts         title, description, canonical, hreflang, Open Graph
  components/           разметка (серверные компоненты) — секции в sections/
    Engine.tsx          единственный клиентский компонент: запускает движок
  engine/               движок анимаций: GSAP + ScrollTrigger, Lenis, three.js
  styles/               SCSS (main.scss — точка входа)
public/                 шрифты, картинки, видео, data/world.json (контуры стран для глобуса)
```

Разметку рендерит React на сервере, поведение и анимации — движок в `src/engine/`: он находит элементы
по `data-*` атрибутам и работает с DOM напрямую (3D-сцены, пины, скролл). Поэтому при правке разметки
секции сохраняйте классы и `data-*` атрибуты — на них завязаны и стили, и движок.

Тексты правятся в `src/content/dictionaries/*.ts`, списки (кейсы, страны, клиенты) — в `src/content/page.ts`.

## Деплой на Vercel

1. Залить репозиторий на GitHub/GitLab/Bitbucket.
2. На vercel.com: **Add New → Project**, импортировать репозиторий. Фреймворк (Next.js) и команды сборки
   определятся сами, настраивать ничего не нужно.
3. В **Settings → Environment Variables** задать переменные (см. `.env.example`):
   - `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` и/или `BRIEF_WEBHOOK_URL` — куда доставлять бриф.
     Без них форма в продакшне показывает ошибку и предлагает написать на почту — заявки не теряются молча;
   - `NEXT_PUBLIC_SITE_URL` — боевой домен, если он не `https://clickable.agency`;
   - `NEXT_PUBLIC_MEDIA_URL` — если видео вынесены на CDN (см. ниже).
4. **Settings → Domains** — подключить домен.

Каждый push в основную ветку — продакшн-деплой, в остальные — превью-деплой со своей ссылкой.

### На что обратить внимание

- **Тариф.** Hobby на Vercel — только для некоммерческих проектов; для сайта агентства нужен Pro.
- **Видео.** В `public/video` ~97 МБ (шоурил — 47 МБ). Отдавать их с Vercel можно, но это расход трафика
  тарифа. Лучше вынести видео в Vercel Blob, Cloudflare R2 или на видеохостинг и указать адрес папки
  в `NEXT_PUBLIC_MEDIA_URL` (со слешем на конце) — код менять не нужно.
- **Соцсети.** Ссылки в `src/content/site.ts` пока заглушки (`#`).
- **Список стран** на глобусе — в `src/content/page.ts` (помечен «ЗАМЕНИТЬ»).

## Бриф: Telegram

1. Создать бота у [@BotFather](https://t.me/BotFather) → токен в `TELEGRAM_BOT_TOKEN`.
2. Добавить бота в чат (или написать ему), узнать id чата (например, через `https://api.telegram.org/bot<токен>/getUpdates`)
   → `TELEGRAM_CHAT_ID`.

В dev-режиме без настроек бриф просто пишется в консоль сервера.
