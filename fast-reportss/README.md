# Быстрые отчёты — Сервис листовок на XML-шаблонах

Веб-сервис для создания, редактирования, хранения и экспорта листовок на основе XML-шаблонов.

## Запуск

### Backend (порт 3001)

```bash
cd backend
npm install
npm start
```

### Frontend (порт 5173)

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173

> Для ИИ-генерации нужен запущенный **backend** (кнопка «ИИ» в панели инструментов). Frontend проксирует `/api` на порт 3001.

### ИИ-генерация (OpenAI)

1. Скопируйте `backend/.env.example` → `backend/.env`
2. Укажите `OPENAI_API_KEY` ([получить ключ](https://platform.openai.com/api-keys))
3. Перезапустите backend

Без ключа работает **демо-режим** с готовым макетом по теме. Модель по умолчанию: `gpt-4o-mini` (`OPENAI_MODEL` в `.env`).

### Управление пользователями

- **Регистрация / вход** — кнопка «Войти» в редакторе (`POST /api/auth/register`, `/api/auth/login`).
- **Личный кабинет** — проекты на сервере: «Проекты», «Сохранить» (только для авторизованных).
- **История** — каждое сохранение проекта добавляется в `save_history`.
- Пароли хранятся в виде хеша (scrypt); сессии — токен в `db.json` (срок 7 дней).

## Где хранятся файлы

| Назначение | Папка |
|------------|--------|
| XML-проекты пользователя | `backend/data/projects/` |
| Экспорт (PNG, JPEG, PDF, SVG) | `backend/data/exports/` |
| Загруженные изображения | `backend/data/uploads/` |
| Пользовательские XML-шаблоны | `backend/data/templates/` |
| История сохранений | `backend/data/history/` |
| Предустановленные шаблоны (XML) | `presets/` |
| Метаданные (проекты, шаблоны) | `backend/data/db.json` |

## Технологии

- **Frontend:** React, Vite, Fabric.js
- **Backend:** Node.js, Express, JSON-хранилище
- **ИИ:** OpenAI API (опционально)
- **XML:** xml2js
- **Экспорт:** sharp (PNG/JPEG), pdfkit (PDF), нативный SVG

## Документация

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — архитектура
- [docs/API.md](docs/API.md) — REST API
- [docs/XML_SCHEMA.md](docs/XML_SCHEMA.md) — структура XML
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — руководство пользователя
