import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(process.env.USERPROFILE || '', 'Desktop', 'Документация-fast-reportss.docx');

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 80 } });
}
function p(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Consolas', size: 20 })],
    spacing: { after: 80 },
  });
}
function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

const children = [
  new Paragraph({
    children: [new TextRun({ text: 'БЫСТРЫЕ ОТЧЁТЫ (fast-reportss)', bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Техническая документация', size: 26 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }),

  h1('1. Назначение системы'),
  p(
    'Веб-сервис для создания, редактирования, хранения и экспорта листовок (flyer) на основе XML-шаблонов. Пользователь работает в визуальном редакторе в браузере; сервер хранит проекты в XML, ведёт учётные записи, историю сохранений и выполняет серверный экспорт. Опционально доступна генерация макетов через OpenAI API.'
  ),

  h1('2. Используемые технологии'),
  h2('2.1. Frontend (порт 5173)'),
  bullet('React 19 — пользовательский интерфейс'),
  bullet('Vite 8 — сборка и dev-сервер'),
  bullet('Fabric.js 5 — холст: текст, прямоугольники, изображения, перетаскивание и изменение размера'),
  bullet('localStorage — токен сессии (ключ fast_reports_token), тема оформления'),
  bullet('Прокси Vite: /api и /uploads → http://localhost:3001'),

  h2('2.2. Backend (порт 3001)'),
  bullet('Node.js (ES modules), Express 4'),
  bullet('xml2js — парсинг и сборка XML'),
  bullet('JSON-файл как БД: backend/data/db.json'),
  bullet('crypto (scrypt) — хеширование паролей'),
  bullet('multer — загрузка изображений'),
  bullet('uuid — имена файлов проектов и шаблонов'),
  bullet('@resvg/resvg-js + jimp — PNG/JPEG из SVG'),
  bullet('pdfkit — экспорт PDF'),
  bullet('OpenAI API (опционально) — маршруты /api/ai/*'),

  h2('2.3. Хранение файлов'),
  bullet('backend/data/projects/ — XML проектов пользователей'),
  bullet('backend/data/history/ — снимки при каждом сохранении'),
  bullet('backend/data/templates/ — пользовательские XML-шаблоны'),
  bullet('backend/data/uploads/ — загруженные изображения'),
  bullet('backend/data/exports/ — файлы серверного экспорта'),
  bullet('presets/ — встроенные шаблоны (в репозитории)'),
  bullet('backend/data/db.json — users, sessions, projects, templates, save_history'),

  h1('3. Архитектура приложения'),
  h2('3.1. Клиент-серверная схема'),
  p('React + Fabric.js (localhost:5173) обменивается данными с Express (localhost:3001) через REST API. Авторизованные запросы передают заголовок Authorization: Bearer <token>.'),
  p('Серверные модули: routes/auth, projects, templates, uploads, ai; services/xmlService, exportService; db/database.js.'),
  p('Данные на диске: data/projects, data/exports, data/uploads, db.json.'),

  h2('3.2. Структура каталогов'),
  code('fast-reportss/'),
  code('├── README.md, package.json, docs/, presets/'),
  code('├── backend/src/ — server.js, db/, middleware/, routes/, services/'),
  code('└── frontend/src/ — App.jsx, api/, context/, components/, utils/'),

  h2('3.3. Ключевые модули клиента'),
  bullet('App.jsx — состояние холста, zoom, undo/redo, облачное сохранение'),
  bullet('fabricFlyerBridge.js — canvasToFlyer / flyerToFabricJson'),
  bullet('xmlMapper.js — локальный XML ↔ Fabric (скачивание XML)'),
  bullet('AuthContext.jsx — login, register, token в localStorage'),

  h2('3.4. Ключевые модули сервера'),
  bullet('xmlService.js — flyerToJson, jsonToFlyer, validateFlyerXml, PAGE_SIZES'),
  bullet('projects.js — CRUD, сохранение, история, серверный export'),
  bullet('exportService.js — XML → JSON → SVG → PNG/JPEG/PDF'),

  h2('3.5. Потоки данных'),
  bullet('A) Регистрация/вход: POST /api/auth/register|login → db.json → token в localStorage'),
  bullet('B) Открытие проекта: GET /api/projects/:id → XML → flyerToJson → Fabric'),
  bullet('C) Сохранение в облако: Fabric → canvasToFlyer → PUT /api/projects/:id → XML + history'),
  bullet('D) Локальный XML: Fabric → jsonToXML → скачивание flyer.xml'),
  bullet('E) Экспорт: в браузере (toDataURL) или POST /api/projects/:id/export'),

  h1('4. Структура XML-шаблона'),
  h2('4.1. Корневой документ'),
  code('<?xml version="1.0" encoding="UTF-8"?>'),
  code('<flyer version="1.0" name="Название листовки">'),
  code('  <page size="A4" orientation="portrait" width="794" height="1123">'),
  code('    <background color="#ffffff"/>'),
  code('    <elements>...</elements>'),
  code('  </page>'),
  code('</flyer>'),

  h2('4.2. Страница (page)'),
  bullet('size: A4 | A5 | A3 | Letter | custom'),
  bullet('orientation: portrait | landscape'),
  bullet('width, height: пиксели при 96 DPI (A4 portrait: 794×1123)'),
  p('Стандартные размеры: A4 — 794×1123; A5 — 559×794; A3 — 1123×1587; Letter — 816×1056.'),

  h2('4.3. Элемент text'),
  code('<element id="t1" type="text" x="50" y="100" width="400" height="60" zIndex="0">'),
  code('  <text>Содержимое</text>'),
  code('  <style fontFamily="Arial" fontSize="24" color="#000000" align="center" bold="true"/>'),
  code('</element>'),

  h2('4.4. Элемент rect'),
  code('<element id="r1" type="rect" x="0" y="0" width="200" height="100">'),
  code('  <style fill="#3b82f6" stroke="#000000" strokeWidth="2" opacity="1"/>'),
  code('</element>'),

  h2('4.5. Элемент image'),
  code('<element id="i1" type="image" x="100" y="200" width="300" height="200">'),
  code('  <source>/uploads/имя-файла.png</source>'),
  code('</element>'),
  p('Путь /uploads/... раздаётся Express как статика из backend/data/uploads/.'),

  h2('4.6. Общие атрибуты element'),
  p('id, type (text|rect|image), x, y, width, height, zIndex, locked (true/false).'),

  h2('4.7. JSON-представление (обмен с API)'),
  code('{ "name": "...", "page": { size, orientation, width, height, background }, "elements": [...] }'),

  h2('4.8. Расположение XML-файлов'),
  bullet('Проекты: backend/data/projects/{uuid}.xml'),
  bullet('История: backend/data/history/{projectId}-{timestamp}.xml'),
  bullet('Шаблоны пользователя: backend/data/templates/{uuid}.xml'),
  bullet('Пресеты: presets/preset-{категория}-{имя}.xml'),

  h1('5. REST API'),
  p('Базовый URL: http://localhost:3001/api'),
  p('Авторизация: Authorization: Bearer <token>'),

  h2('5.1. Аутентификация'),
  bullet('POST /auth/register — Body: { email, password, name }; пароль ≥ 6 символов'),
  bullet('POST /auth/login — Body: { email, password }'),
  bullet('POST /auth/logout — требуется токен'),
  bullet('GET /auth/me — текущий пользователь'),
  p('Сессии: token в db.json, срок 7 дней.'),

  h2('5.2. Проекты'),
  bullet('GET /projects — список проектов user_id (без токена — [])'),
  bullet('GET /projects/:id — { project, flyer }'),
  bullet('POST /projects — создание (name, pageSize, orientation, templateId или flyer)'),
  bullet('PUT /projects/:id — сохранение flyer, история, updated_at'),
  bullet('DELETE /projects/:id — только владелец'),
  bullet('POST /projects/:id/export — Body: { format: png|jpeg|pdf|svg }'),
  bullet('GET /projects/:id/history — массив save_history'),

  h2('5.3. Шаблоны'),
  bullet('GET /templates?category=... — список (preset + свои)'),
  bullet('GET /templates/categories'),
  bullet('GET /templates/:id'),
  bullet('POST /templates — сохранить макет (name, category, description, flyer)'),
  bullet('DELETE /templates/:id — только свой шаблон'),

  h2('5.4. Загрузки'),
  bullet('POST /uploads/image — multipart, поле image'),
  bullet('POST /uploads/image-url — { url: "https://..." }'),

  h2('5.5. Справочники и ИИ'),
  bullet('GET /health — проверка сервера'),
  bullet('GET /page-sizes — размеры страниц'),
  bullet('GET /ai/status — configured, model'),
  bullet('POST /ai/generate — topic, flyerType, pageWidth, pageHeight, mode (all|content|design)'),

  h1('6. Логика сохранения макетов'),
  h2('6.1. Локально (без входа)'),
  p('Кнопка сохранения XML: handleSaveXML → canvas.toJSON → jsonToXML → скачивание flyer.xml. Сервер не используется.'),

  h2('6.2. В облако (с учётной записью)'),
  p('handleSaveToCloud → canvasToFlyer → PUT /api/projects/:id (или POST при новом проекте).'),
  p('Сервер: jsonToFlyer → validateFlyerXml → запись project.xml_path; копия в history/; INSERT save_history; UPDATE updated_at.'),

  h2('6.3. Создание проекта (POST)'),
  bullet('Пустой макет: createEmptyFlyer(name, pageSize, orientation)'),
  bullet('Из шаблона: чтение template.xml_path по templateId'),
  bullet('Из flyer: jsonToFlyer(flyer)'),
  bullet('Файл: data/projects/{uuid}.xml; запись в projects с user_id'),

  h2('6.4. Метаданные db.json'),
  bullet('users: id, email, password_hash, name, created_at'),
  bullet('sessions: token, user_id, expires_at'),
  bullet('projects: id, name, xml_path, user_id, created_at, updated_at'),
  bullet('templates: id, name, category, description, xml_path, is_preset, user_id'),
  bullet('save_history: id, project_id, xml_path, saved_at'),

  h1('7. Логика экспорта макетов'),
  h2('7.1. Клиентский экспорт'),
  bullet('PNG / JPEG / SVG: handleExport → canvas.toDataURL → скачивание'),
  bullet('PDF: handleExportPDF → JPEG с холста → window.print()'),
  p('Экспортируется текущее состояние Fabric на экране; сервер не обязателен.'),

  h2('7.2. Серверный экспорт'),
  p('POST /projects/:id/export: readXmlFile → exportFlyer → flyerToJson →'),
  bullet('svg — renderSvgString'),
  bullet('png — SVG → @resvg/resvg-js'),
  bullet('jpeg — PNG → jimp'),
  bullet('pdf — pdfkit (фон, rect, text, image с /uploads/)'),
  p('Файл отдаётся через res.download; копия в backend/data/exports/.'),

  h2('7.3. Рекомендация'),
  p('Перед серверным экспортом сохраните проект в облако (PUT), чтобы XML на диске совпадал с холстом.'),

  h1('8. Запуск и конфигурация'),
  code('cd backend && npm install && npm start   → :3001'),
  code('cd frontend && npm install && npm run dev → :5173'),
  p('Скопируйте backend/.env.example → backend/.env (OPENAI_API_KEY — опционально).'),
  p('Из корня: npm run install:all'),

  h1('9. Безопасность и Git'),
  p('Не публиковать: node_modules/, backend/.env, backend/data/db.json, пользовательские data/projects, uploads, exports.'),
  p('В репозитории: исходники, package-lock.json, presets/, .env.example, docs/.'),
];

const doc = new Document({
  sections: [{ properties: {}, children }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log('Создан файл:', outPath);
