import path from 'path';
import { fileURLToPath } from 'url';
import db from './db/database.js';
import { writeXmlFile, jsonToFlyer } from './services/xmlService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_DIR = path.join(__dirname, '../../presets');

const presets = [
  {
    name: 'Рекламная акция',
    category: 'реклама',
    description: 'Яркая листовка для акций и скидок',
    flyer: {
      name: 'Рекламная акция',
      page: { size: 'A4', orientation: 'portrait', width: 794, height: 1123, background: '#1a1a2e' },
      elements: [
        { id: 't1', type: 'rect', x: 0, y: 0, width: 794, height: 200, zIndex: 0, fill: '#e94560' },
        { id: 't2', type: 'text', x: 50, y: 60, width: 694, height: 80, zIndex: 1, content: 'СКИДКА 50%', fontFamily: 'Arial', fontSize: 56, color: '#ffffff', align: 'center', bold: true },
        { id: 't3', type: 'text', x: 50, y: 280, width: 694, height: 60, zIndex: 2, content: 'Только до конца месяца!', fontFamily: 'Arial', fontSize: 32, color: '#ffffff', align: 'center' },
        { id: 't4', type: 'text', x: 80, y: 400, width: 634, height: 200, zIndex: 3, content: 'Подробности уточняйте у продавцов.\nАдрес: ул. Примерная, 1', fontFamily: 'Arial', fontSize: 22, color: '#eaeaea', align: 'left' },
      ],
    },
  },
  {
    name: 'Приглашение',
    category: 'приглашения',
    description: 'Элегантное приглашение на мероприятие',
    flyer: {
      name: 'Приглашение',
      page: { size: 'A5', orientation: 'portrait', width: 559, height: 794, background: '#fdf6ec' },
      elements: [
        { id: 'i1', type: 'rect', x: 30, y: 30, width: 499, height: 734, zIndex: 0, fill: 'transparent', stroke: '#c9a227', strokeWidth: 3 },
        { id: 'i2', type: 'text', x: 40, y: 120, width: 479, height: 60, zIndex: 1, content: 'Вы приглашены', fontFamily: 'Georgia', fontSize: 36, color: '#5c4033', align: 'center', italic: true },
        { id: 'i3', type: 'text', x: 40, y: 220, width: 479, height: 100, zIndex: 2, content: 'Торжественный вечер\n15 июня 2026', fontFamily: 'Georgia', fontSize: 28, color: '#333333', align: 'center' },
        { id: 'i4', type: 'text', x: 40, y: 500, width: 479, height: 80, zIndex: 3, content: 'Начало в 19:00\nРесторан «Золотой зал»', fontFamily: 'Arial', fontSize: 18, color: '#666666', align: 'center' },
      ],
    },
  },
  {
    name: 'Объявление',
    category: 'объявления',
    description: 'Информационное объявление',
    flyer: {
      name: 'Объявление',
      page: { size: 'A4', orientation: 'portrait', width: 794, height: 1123, background: '#ffffff' },
      elements: [
        { id: 'o1', type: 'rect', x: 40, y: 40, width: 714, height: 120, zIndex: 0, fill: '#2563eb' },
        { id: 'o2', type: 'text', x: 60, y: 75, width: 674, height: 60, zIndex: 1, content: 'ОБЪЯВЛЕНИЕ', fontFamily: 'Arial', fontSize: 42, color: '#ffffff', align: 'center', bold: true },
        { id: 'o3', type: 'text', x: 60, y: 200, width: 674, height: 400, zIndex: 2, content: 'Уважаемые жители!\n\nСообщаем о проведении работ по благоустройству двора с 1 по 10 июня. Просим учитывать временные ограничения парковки.\n\nАдминистрация.', fontFamily: 'Arial', fontSize: 20, color: '#1f2937', align: 'left' },
      ],
    },
  },
  {
    name: 'Информационный бюллетень',
    category: 'информация',
    description: 'Новости и информационные материалы',
    flyer: {
      name: 'Информационный бюллетень',
      page: { size: 'A4', orientation: 'landscape', width: 1123, height: 794, background: '#f0f9ff' },
      elements: [
        { id: 'n1', type: 'text', x: 50, y: 40, width: 500, height: 50, zIndex: 0, content: 'НОВОСТИ НЕДЕЛИ', fontFamily: 'Arial', fontSize: 36, color: '#0369a1', align: 'left', bold: true },
        { id: 'n2', type: 'rect', x: 50, y: 110, width: 500, height: 4, zIndex: 1, fill: '#0369a1' },
        { id: 'n3', type: 'text', x: 50, y: 140, width: 500, height: 300, zIndex: 2, content: '• Открытие нового филиала\n• Обновление ассортимента\n• Программа лояльности для клиентов', fontFamily: 'Arial', fontSize: 22, color: '#334155', align: 'left' },
        { id: 'n4', type: 'rect', x: 600, y: 40, width: 473, height: 714, zIndex: 3, fill: '#bae6fd', stroke: '#0284c7', strokeWidth: 2 },
        { id: 'n5', type: 'text', x: 620, y: 350, width: 433, height: 60, zIndex: 4, content: 'Место для фото', fontFamily: 'Arial', fontSize: 24, color: '#64748b', align: 'center' },
      ],
    },
  },
  {
    name: 'Мероприятие',
    category: 'мероприятия',
    description: 'Афиша мероприятия или концерта',
    flyer: {
      name: 'Мероприятие',
      page: { size: 'A4', orientation: 'portrait', width: 794, height: 1123, background: '#0f172a' },
      elements: [
        { id: 'e1', type: 'text', x: 40, y: 80, width: 714, height: 100, zIndex: 0, content: 'LIVE CONCERT', fontFamily: 'Arial', fontSize: 64, color: '#f472b6', align: 'center', bold: true },
        { id: 'e2', type: 'text', x: 40, y: 220, width: 714, height: 50, zIndex: 1, content: '20 июня • Главная площадь', fontFamily: 'Arial', fontSize: 28, color: '#e2e8f0', align: 'center' },
        { id: 'e3', type: 'rect', x: 147, y: 350, width: 500, height: 400, zIndex: 2, fill: '#1e293b', stroke: '#f472b6', strokeWidth: 4 },
        { id: 'e4', type: 'text', x: 40, y: 850, width: 714, height: 80, zIndex: 3, content: 'Вход свободный • Начало в 18:00', fontFamily: 'Arial', fontSize: 24, color: '#94a3b8', align: 'center' },
      ],
    },
  },
];

export async function seedPresets() {
  const count = db.prepare('SELECT COUNT(*) as c FROM templates WHERE is_preset = 1').get();
  if (count.c > 0) return;

  for (const preset of presets) {
    const xmlData = jsonToFlyer(preset.flyer);
    const fileName = `preset-${preset.category}-${preset.name.replace(/\s+/g, '-')}.xml`;
    const xmlPath = path.join(PRESETS_DIR, fileName);
    await writeXmlFile(xmlPath, xmlData);

    db.prepare(
      'INSERT INTO templates (name, category, description, xml_path, is_preset) VALUES (?, ?, ?, ?, 1)'
    ).run(preset.name, preset.category, preset.description, xmlPath);
  }
  console.log(`Загружено ${presets.length} предустановленных шаблонов`);
}
