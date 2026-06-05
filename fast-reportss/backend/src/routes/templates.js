import { Router } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { optionalAuth, requireAuth, assertTemplateAccess } from '../middleware/auth.js';
import { readXmlFile, writeXmlFile, validateFlyerXml, flyerToJson, jsonToFlyer } from '../services/xmlService.js';

const router = Router();
const TEMPLATES_DIR = path.resolve('data/templates');

router.use(optionalAuth);

router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let templates = category
      ? db.prepare('SELECT * FROM templates WHERE category = ? ORDER BY is_preset DESC, name ASC').all(category)
      : db.prepare('SELECT * FROM templates ORDER BY is_preset DESC, name ASC').all();

    if (req.user) {
      templates = templates.filter((t) => t.is_preset === 1 || t.user_id === req.user.id);
    } else {
      templates = templates.filter((t) => t.is_preset === 1);
    }

    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', (req, res) => {
  try {
    let templates = db.prepare('SELECT * FROM templates ORDER BY is_preset DESC, name ASC').all();
    if (req.user) {
      templates = templates.filter((t) => t.is_preset === 1 || t.user_id === req.user.id);
    } else {
      templates = templates.filter((t) => t.is_preset === 1);
    }
    const categories = [...new Set(templates.map((t) => t.category))].sort();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Шаблон не найден' });
    if (!assertTemplateAccess(template, req.user)) {
      return res.status(403).json({ error: 'Нет доступа к этому шаблону' });
    }

    const xmlData = await readXmlFile(template.xml_path);
    validateFlyerXml(xmlData);
    res.json({ template, flyer: flyerToJson(xmlData) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, category, description, flyer } = req.body;
    if (!name || !category || !flyer) {
      return res.status(400).json({ error: 'Требуются name, category и flyer' });
    }

    const xmlData = jsonToFlyer(flyer);
    validateFlyerXml(xmlData);

    const fileName = `${uuidv4()}.xml`;
    const xmlPath = path.join(TEMPLATES_DIR, fileName);
    await writeXmlFile(xmlPath, xmlData);

    const result = db.prepare(
      'INSERT INTO templates (name, category, description, xml_path, is_preset, user_id) VALUES (?, ?, ?, ?, 0, ?)'
    ).run(name, category, description || '', xmlPath, req.user.id);

    res.status(201).json({ id: result.lastInsertRowid, name, category, xml_path: xmlPath, user_id: req.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Шаблон не найден' });
    if (template.is_preset) {
      return res.status(403).json({ error: 'Нельзя удалить предустановленный шаблон' });
    }
    if (template.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому шаблону' });
    }
    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
