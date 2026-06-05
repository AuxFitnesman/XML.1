import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '../../data/db.json');

const defaultData = {
  users: [],
  sessions: [],
  projects: [],
  templates: [],
  save_history: [],
  _counters: { users: 0, sessions: 0, projects: 0, templates: 0, save_history: 0 },
};

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  if (!data.sessions) data.sessions = [];
  if (!data._counters) data._counters = {};
  if (data._counters.sessions == null) data._counters.sessions = 0;
  return data;
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function nextId(data, table) {
  data._counters[table] = (data._counters[table] || 0) + 1;
  return data._counters[table];
}

const handlers = {
  'SELECT * FROM users WHERE email = ?': (data, [email]) =>
    data.users.find((u) => u.email === String(email).toLowerCase()),

  'SELECT * FROM users WHERE id = ?': (data, [id]) =>
    data.users.find((u) => u.id === Number(id)),

  'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)': (data, [email, password_hash, name]) => {
    const normalized = String(email).toLowerCase().trim();
    if (data.users.some((u) => u.email === normalized)) {
      throw new Error('EMAIL_EXISTS');
    }
    const row = {
      id: nextId(data, 'users'),
      email: normalized,
      password_hash,
      name: name || normalized.split('@')[0],
      created_at: now(),
    };
    data.users.push(row);
    return { lastInsertRowid: row.id };
  },

  'SELECT * FROM sessions WHERE token = ?': (data, [token]) =>
    data.sessions.find((s) => s.token === token),

  'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)': (data, [token, user_id, expires_at]) => {
    data.sessions = data.sessions.filter((s) => s.user_id !== Number(user_id));
    const row = {
      id: nextId(data, 'sessions'),
      token,
      user_id: Number(user_id),
      expires_at,
      created_at: now(),
    };
    data.sessions.push(row);
    return { lastInsertRowid: row.id };
  },

  'DELETE FROM sessions WHERE token = ?': (data, [token]) => {
    data.sessions = data.sessions.filter((s) => s.token !== token);
  },

  'SELECT * FROM projects ORDER BY updated_at DESC': (data) =>
    [...data.projects].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')),

  'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC': (data, [user_id]) =>
    data.projects
      .filter((p) => p.user_id === Number(user_id))
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')),

  'SELECT * FROM projects WHERE id = ?': (data, [id]) =>
    data.projects.find((p) => p.id === Number(id)),

  'INSERT INTO projects (name, xml_path, user_id) VALUES (?, ?, ?)': (data, [name, xml_path, user_id]) => {
    const row = {
      id: nextId(data, 'projects'),
      name,
      xml_path,
      user_id: user_id ?? null,
      thumbnail: null,
      created_at: now(),
      updated_at: now(),
    };
    data.projects.push(row);
    return { lastInsertRowid: row.id };
  },

  "UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?": (data, [name, id]) => {
    const row = data.projects.find((p) => p.id === Number(id));
    if (row) {
      row.name = name;
      row.updated_at = now();
    }
  },

  "UPDATE projects SET updated_at = datetime('now') WHERE id = ?": (data, [id]) => {
    const row = data.projects.find((p) => p.id === Number(id));
    if (row) row.updated_at = now();
  },

  'DELETE FROM projects WHERE id = ?': (data, [id]) => {
    data.projects = data.projects.filter((p) => p.id !== Number(id));
    data.save_history = data.save_history.filter((h) => h.project_id !== Number(id));
  },

  'INSERT INTO save_history (project_id, xml_path) VALUES (?, ?)': (data, [project_id, xml_path]) => {
    const row = {
      id: nextId(data, 'save_history'),
      project_id: Number(project_id),
      xml_path,
      saved_at: now(),
    };
    data.save_history.push(row);
    return { lastInsertRowid: row.id };
  },

  'SELECT * FROM save_history WHERE project_id = ? ORDER BY saved_at DESC': (data, [id]) =>
    data.save_history
      .filter((h) => h.project_id === Number(id))
      .sort((a, b) => (b.saved_at || '').localeCompare(a.saved_at || '')),

  'SELECT * FROM templates ORDER BY is_preset DESC, name ASC': (data) =>
    [...data.templates].sort((a, b) => (b.is_preset - a.is_preset) || a.name.localeCompare(b.name)),

  'SELECT * FROM templates WHERE category = ? ORDER BY is_preset DESC, name ASC': (data, [cat]) =>
    data.templates
      .filter((t) => t.category === cat)
      .sort((a, b) => (b.is_preset - a.is_preset) || a.name.localeCompare(b.name)),

  'SELECT DISTINCT category FROM templates ORDER BY category': (data) =>
    [...new Set(data.templates.map((t) => t.category))].sort().map((category) => ({ category })),

  'SELECT * FROM templates WHERE id = ?': (data, [id]) =>
    data.templates.find((t) => t.id === Number(id)),

  'INSERT INTO templates (name, category, description, xml_path, is_preset, user_id) VALUES (?, ?, ?, ?, 0, ?)': (
    data,
    [name, category, description, xml_path, user_id]
  ) => {
    const row = {
      id: nextId(data, 'templates'),
      name,
      category,
      description,
      xml_path,
      is_preset: 0,
      user_id: user_id ?? null,
      created_at: now(),
    };
    data.templates.push(row);
    return { lastInsertRowid: row.id };
  },

  'INSERT INTO templates (name, category, description, xml_path, is_preset) VALUES (?, ?, ?, ?, 1)': (
    data,
    [name, category, description, xml_path]
  ) => {
    const row = {
      id: nextId(data, 'templates'),
      name,
      category,
      description,
      xml_path,
      is_preset: 1,
      user_id: null,
      created_at: now(),
    };
    data.templates.push(row);
    return { lastInsertRowid: row.id };
  },

  'DELETE FROM templates WHERE id = ?': (data, [id]) => {
    data.templates = data.templates.filter((t) => t.id !== Number(id));
  },

  'SELECT COUNT(*) as c FROM templates WHERE is_preset = 1': (data) => ({
    c: data.templates.filter((t) => t.is_preset === 1).length,
  }),
};

const WRITE_OPS = new Set([
  'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
  'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
  'DELETE FROM sessions WHERE token = ?',
  'INSERT INTO projects (name, xml_path, user_id) VALUES (?, ?, ?)',
  "UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?",
  "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
  'DELETE FROM projects WHERE id = ?',
  'INSERT INTO save_history (project_id, xml_path) VALUES (?, ?)',
  'INSERT INTO templates (name, category, description, xml_path, is_preset, user_id) VALUES (?, ?, ?, ?, 0, ?)',
  'INSERT INTO templates (name, category, description, xml_path, is_preset) VALUES (?, ?, ?, ?, 1)',
  'DELETE FROM templates WHERE id = ?',
]);

const db = {
  prepare(sql) {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    const isWrite = WRITE_OPS.has(normalized);

    return {
      all(...params) {
        const data = load();
        const fn = handlers[normalized];
        if (!fn) throw new Error(`Unsupported query: ${sql}`);
        const result = fn(data, params);
        if (isWrite) save(data);
        return Array.isArray(result) ? result : [result].filter(Boolean);
      },
      get(...params) {
        const data = load();
        const fn = handlers[normalized];
        if (!fn) throw new Error(`Unsupported query: ${sql}`);
        const result = fn(data, params);
        if (isWrite) save(data);
        return Array.isArray(result) ? result[0] : result;
      },
      run(...params) {
        const data = load();
        const fn = handlers[normalized];
        if (!fn) throw new Error(`Unsupported query: ${sql}`);
        const result = fn(data, params);
        save(data);
        return result || { changes: 1 };
      },
    };
  },
};

export default db;
