# REST API

Базовый URL: `http://localhost:3001/api`

Авторизованные запросы: заголовок `Authorization: Bearer <token>`.

## Аутентификация

### POST /auth/register
Регистрация.

**Тело:** `{ "email": "...", "password": "...", "name": "..." }`

**Ответ:** `{ "user": { "id", "email", "name" }, "token": "..." }`

### POST /auth/login
Вход.

**Тело:** `{ "email", "password" }`

### POST /auth/logout
Выход (требуется токен).

### GET /auth/me
Текущий пользователь (требуется токен).

## Проекты

> Список и сохранение проектов доступны только авторизованным пользователям. Каждый проект привязан к `user_id`.


### GET /projects
Список всех проектов.

### GET /projects/:id
Загрузка проекта с JSON-представлением листовки.

**Ответ:**
```json
{
  "project": { "id": 1, "name": "...", "xml_path": "...", "updated_at": "..." },
  "flyer": { "name": "...", "page": {...}, "elements": [...] }
}
```

### POST /projects
Создание проекта.

**Тело:**
```json
{
  "name": "Новая листовка",
  "pageSize": "A4",
  "orientation": "portrait",
  "templateId": 1
}
```

### PUT /projects/:id
Сохранение листовки (внутренний JSON → XML).

**Тело:** объект `flyer` (name, page, elements).

### DELETE /projects/:id
Удаление проекта.

### POST /projects/:id/export
Экспорт в файл.

**Тело:** `{ "format": "png" | "jpeg" | "pdf" | "svg" }`

**Ответ:** файл для скачивания.

### GET /projects/:id/history
История сохранений проекта.

## Шаблоны

### GET /templates
Список шаблонов. Query: `?category=реклама`

### GET /templates/categories
Список категорий.

### GET /templates/:id
Шаблон с содержимым.

### POST /templates
Сохранить текущий макет как шаблон.

**Тело:**
```json
{
  "name": "Мой шаблон",
  "category": "реклама",
  "description": "...",
  "flyer": { ... }
}
```

### DELETE /templates/:id
Удаление пользовательского шаблона (не preset).

## Загрузки

### POST /uploads/image
`multipart/form-data`, поле `image`.

### POST /uploads/image-url
**Тело:** `{ "url": "https://..." }`

## Справочники

### GET /page-sizes
Стандартные размеры и ориентации.

### GET /health
Проверка работоспособности.

## ИИ-генерация

### GET /ai/status
Статус подключения к OpenAI.

**Ответ:**
```json
{
  "configured": true,
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

### POST /ai/generate
Генерация текста и оформления листовки.

**Тело:**
```json
{
  "topic": "скидка 30% в кофейне",
  "flyerType": "реклама",
  "pageWidth": 794,
  "pageHeight": 1123,
  "mode": "all"
}
```

`flyerType`: `реклама` | `приглашение` | `объявление` | `информация` | `мероприятие` | `акция`

`mode`: `all` (текст + оформление) | `content` | `design`

**Ответ:**
```json
{
  "design": {
    "background": "#0f172a",
    "palette": ["#0f172a", "#f59e0b", "#ffffff"],
    "layoutHints": "...",
    "accentBar": { "left": 0, "top": 0, "width": 794, "height": 120, "fill": "#f59e0b" },
    "elements": [
      {
        "role": "title",
        "type": "text",
        "text": "Заголовок",
        "left": 48,
        "top": 80,
        "fontSize": 42,
        "fill": "#ffffff",
        "fontWeight": "bold",
        "fontFamily": "Montserrat"
      }
    ]
  },
  "source": "openai"
}
```

Без `OPENAI_API_KEY` возвращается демо-макет (`source`: `mock`).
