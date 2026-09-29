# email-helper-ai (Cloudflare Worker)

**Єдина точка входу** для фічі "AI аналіз зображень" (alt-text/назва файлу/CTA) — і для zero-config спільного режиму, і для режиму "власний Cloudflare-токен". Викликається з фронтенду завжди, в обох режимах, у web/GitHub Pages і в Electron — див. `src/htmlConverter/utils/ocr/cloudflareClient.ts` в основному репо.

## Два режими, один endpoint

- **Без токена в тілі запиту** — Worker використовує власний нативний `env.AI.run()` binding (жодного API-токена в коді немає, автентифікація всередині платформи Cloudflare). Захищено CORS-allowlist (`https://misha-vynnyk.github.io` + локальні dev-адреси) і rate-limit по IP (20 запитів/60с, KV-лічильник) — бо URL Worker'а публічний (він в JS-бандлі), а денний безкоштовний ліміт спільний на всіх викликачів.
- **З `accountId`/`apiToken` у тілі запиту** — Worker сам (server-to-server, без CORS-обмежень браузера) б'є в `api.cloudflare.com` токеном виклику. Rate-limit не застосовується — це вже власна квота користувача.

**Чому взагалі через Worker, а не напряму з браузера в Cloudflare?** `api.cloudflare.com` не віддає CORS-заголовків — живою перевіркою (`curl -X OPTIONS`) підтверджено `405` без жодного `Access-Control-Allow-Origin`. Браузер заблокує прямий виклик ще до відправки, незалежно від токена. Тому навіть "власний токен" мусить іти через якийсь сервер — Worker це і є, той самий, що вже потрібен для zero-config режиму.

**Важливо розуміти**: коли хтось інший (колега) вводить СВІЙ токен у Налаштуваннях вашого деплою — цей токен транзитом проходить через ваш Worker (вашу інфраструктуру, яку контролюєте ви). Код його ніде не логує й не зберігає (тримається лише в пам'яті на час одного запиту), але технічно це не "напряму з їхнього браузера в Cloudflare", а "з їхнього браузера у ваш Worker → в Cloudflare".

## Деплой (робите ви особисто — у мене немає доступу до вашого Cloudflare-акаунту)

1. Встановіть залежності:
   ```bash
   cd cloudflare-worker
   npm install
   ```

2. Залогіньтесь у Cloudflare (відкриє браузер):
   ```bash
   npx wrangler login
   ```

3. Створіть KV-namespace для rate-limit лічильника:
   ```bash
   npx wrangler kv namespace create RATE_LIMIT_KV
   ```
   Команда поверне щось на кшталт:
   ```
   { binding = "RATE_LIMIT_KV", id = "abcd1234..." }
   ```
   Скопіюйте цей `id` у `wrangler.toml`, замінивши `REPLACE_WITH_KV_NAMESPACE_ID`.

4. Задеплойте:
   ```bash
   npx wrangler deploy
   ```
   Вивід покаже фінальний URL, щось типу `https://email-helper-ai.<ваш-subdomain>.workers.dev`.

5. Скопіюйте цей URL у фронтенд — константа `PUBLIC_WORKER_URL` в `src/htmlConverter/utils/ocr/cloudflareClient.ts` (в основному репо, не тут).

## Перший тест після деплою

```bash
curl -X POST https://email-helper-ai.<ваш-subdomain>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"prompt":"Reply with exactly this JSON and nothing else: {\"filename\":\"test\",\"alt_text\":\"test\",\"cta\":\"\"}","image":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="}'
```

Очікувана відповідь: `{"filename":"test","alt_text":"test","cta":""}` (без `warning`).

Той самий запит із власним токеном (додайте `"accountId":"...","apiToken":"..."` в тіло) піде вже через `runViaOwnToken()` — без rate-limit, вашою власною квотою Cloudflare.

**Rate-limit неоднозначність** (задокументована в `wrangler.toml`): нативний `[[ratelimits]]` binding — GA, але доки не підтверджено, чи входить у безкоштовний план. Цей Worker використовує KV-лічильник замість нього саме тому, що KV read/write ліміти безкоштовного плану чітко задокументовані. Якщо колись підтвердите, що `[[ratelimits]]` теж безкоштовний на вашому акаунті — можна перейти на нього (чистіший примітив, менше коду), розкоментувавши блок у `wrangler.toml`.
