# Архитектура приложения «Быстрые отчёты»

## Обзор

Система построена по клиент-серверной схеме с REST API. Клиент (React) отвечает за визуальный редактор; сервер (Express) — за хранение XML, валидацию, экспорт и работу с БД.

```
┌─────────────────┐     REST API      ┌──────────────────────────────┐
│  React + Konva  │ ◄──────────────► │  Express.js                   │
│  (редактор)     │                   │  ├── routes/projects          │
└─────────────────┘                   │  ├── routes/templates         │
                                    │  ├── routes/uploads           │
                                    │  ├── services/xmlService      │
                                    │  ├── services/exportService   │
                                    │  └── db (SQLite)              │
                                    └──────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            data/projects/            data/exports/              data/uploads/
            (XML проекты)             (PNG/PDF/SVG)              (изображения)
```

## Модули

### Клиент (frontend/src)

| Модуль | Назначение |
|--------|------------|
| `App.jsx` | Маршрутизация экранов, состояние проекта, undo/redo |
| `api.js` | HTTP-клиент REST API |
| `components/FlyerCanvas.jsx` | Холст Konva: drag, resize, текст, изображения |
| `components/Toolbar.jsx` | Панель инструментов |
| `components/PropertiesPanel.jsx` | Свойства страницы и элементов |
| `components/LayersPanel.jsx` | Управление слоями (z-index) |

### Сервер (backend/src)

| Модуль | Назначение |
|--------|------------|
| `routes/projects.js` | CRUD проектов, сохранение XML, экспорт |
| `routes/templates.js` | Каталог шаблонов |
| `routes/uploads.js` | Загрузка изображений (файл / URL) |
| `services/xmlService.js` | Парсинг, валидация, сериализация XML |
| `services/exportService.js` | PNG, JPEG, PDF, SVG |
| `db/database.js` | SQLite: projects, templates, save_history |
| `seedPresets.js` | Предустановленные шаблоны |

## Поток данных

1. Пользователь создаёт проект → сервер генерирует XML → сохраняет в `data/projects/`.
2. Редактор загружает JSON-представление листовки через `flyerToJson`.
3. Сохранение: клиент отправляет JSON → `jsonToFlyer` → запись XML + запись в `save_history`.
4. Экспорт: сервер читает XML → рендер SVG → конвертация в целевой формат → `data/exports/`.

## Расширяемость

- Новые размеры страниц: `PAGE_SIZES` в `xmlService.js` + endpoint `/api/page-sizes`.
- Новые типы элементов: расширить `parseElementProps` / `jsonToFlyer` / `exportService`.
- Новые форматы экспорта: добавить case в `exportFlyer`.
- PostgreSQL: заменить `better-sqlite3` на `pg` без изменения API.
