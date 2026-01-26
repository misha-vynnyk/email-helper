# Automation Server

Локальний сервер для автоматизації завантаження файлів через браузер Brave.

## Встановлення

```bash
npm install
```

## Запуск сервера

```bash
npm run server
# або
npm start
```

Сервер запуститься на `http://127.0.0.1:3839`

## Використання з веб-додатком

1. Запустіть сервер автоматизації:
   ```bash
   cd automation
   npm run server
   ```

2. Відкрийте веб-додаток (локально або на GitHub Pages)

3. При завантаженні зображень через HTML Converter, якщо бекенд недоступний, автоматично використовується сервер автоматизації

## API Endpoints

### GET /health
Перевірка доступності сервера

**Response:**
```json
{
  "status": "ok",
  "port": 3839
}
```

### POST /upload
Завантаження файлу через автоматизацію

**Request:**
```json
{
  "fileData": "data:image/png;base64,iVBORw0KG...",
  "fileName": "image.png",
  "category": "finance",
  "folderName": "abcd123",
  "skipConfirmation": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "url": "https://storage.5th-elementagency.com/...",
  "output": "..."
}
```

## Налаштування

Порт сервера можна змінити через змінну оточення:
```bash
AUTOMATION_PORT=3840 npm run server
```

## Вимоги

- Node.js >= 18
- Brave Browser встановлений
- Playwright встановлений (`npm install`)

## Примітки

- Сервер автоматично очищає тимчасові файли старші за 1 годину
- Файли зберігаються в `temp/` директорії
- Для роботи потрібен запущений Brave Browser з remote debugging (автоматично налаштовується)
