import { Router } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { optionalAuth, requireAuth, assertProjectAccess } from '../middleware/auth.js';
import {
  readXmlFile,
  writeXmlFile,
  validateFlyerXml,
  flyerToJson,
  jsonToFlyer,
  createEmptyFlyer,
} from '../services/xmlService.js';
import { exportFlyer } from '../services/exportService.js';

const router = Router();
const PROJECTS_DIR = path.resolve('data/projects');
const EXPORTS_DIR = path.resolve('data/exports');
const HISTORY_DIR = path.resolve('data/history');

router.use(optionalAuth);

router.get('/', (req, res) => {
  try {
    if (!req.user) {
      return res.json([]);
    }
    const projects = db
      .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC')
      .all(req.user.id);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    if (!assertProjectAccess(project, req.user)) {
      return res.status(403).json({ error: 'Нет доступа к этому проекту' });
    }

    const xmlData = await readXmlFile(project.xml_path);
    validateFlyerXml(xmlData);
    const json = flyerToJson(xmlData);
    res.json({ project, flyer: json });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, pageSize = 'A4', orientation = 'portrait', templateId, flyer } = req.body;
    let xmlData;

    if (flyer) {
      xmlData = jsonToFlyer(flyer);
    } else if (templateId) {
      const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
      if (!template) return res.status(404).json({ error: 'Шаблон не найден' });
      xmlData = await readXmlFile(template.xml_path);
      if (name) xmlData.flyer.$.name = name;
    } else {
      xmlData = createEmptyFlyer(name || 'Новая листовка', pageSize, orientation);
    }

    const fileName = `${uuidv4()}.xml`;
    const xmlPath = path.join(PROJECTS_DIR, fileName);
    await writeXmlFile(xmlPath, xmlData);

    const result = db.prepare(
      'INSERT INTO projects (name, xml_path, user_id) VALUES (?, ?, ?)'
    ).run(name || xmlData.flyer.$.name, xmlPath, req.user.id);

    res.status(201).json({
      id: result.lastInsertRowid,
      name: name || xmlData.flyer.$.name,
      xml_path: xmlPath,
      user_id: req.user.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    if (!assertProjectAccess(project, req.user)) {
      return res.status(403).json({ error: 'Нет доступа к этому проекту' });
    }

    const xmlData = jsonToFlyer(req.body);
    validateFlyerXml(xmlData);
    await writeXmlFile(project.xml_path, xmlData);

    const historyFile = path.join(HISTORY_DIR, `${req.params.id}-${Date.now()}.xml`);
    await writeXmlFile(historyFile, xmlData);
    db.prepare('INSERT INTO save_history (project_id, xml_path) VALUES (?, ?)').run(
      req.params.id,
      historyFile
    );

    if (req.body.name) {
      db.prepare('UPDATE projects SET name = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
        req.body.name,
        req.params.id
      );
    } else {
      db.prepare('UPDATE projects SET updated_at = datetime(\'now\') WHERE id = ?').run(req.params.id);
    }

    res.json({ success: true, flyer: flyerToJson(xmlData) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    if (project.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому проекту' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/export', requireAuth, async (req, res) => {
  try {
    const { format = 'png' } = req.body;
    const allowed = ['png', 'jpeg', 'jpg', 'pdf', 'svg'];
    if (!allowed.includes(format.toLowerCase())) {
      return res.status(400).json({ error: 'Неподдерживаемый формат' });
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    if (project.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому проекту' });
    }

    const xmlData = await readXmlFile(project.xml_path);
    const ext = format === 'jpg' ? 'jpeg' : format;
    const outFile = path.join(EXPORTS_DIR, `${project.id}-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`);
    await exportFlyer(xmlData, ext, outFile);

    res.download(outFile, `flyer-${project.id}.${ext === 'jpeg' ? 'jpg' : ext}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/history', requireAuth, (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    if (project.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому проекту' });
    }

    const history = db
      .prepare('SELECT * FROM save_history WHERE project_id = ? ORDER BY saved_at DESC')
      .all(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
