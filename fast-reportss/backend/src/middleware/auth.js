import db from '../db/database.js';
import { sanitizeUser } from '../services/authService.js';

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7);
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) {
    req.user = null;
    return next();
  }
  if (session.expires_at < new Date().toISOString().replace('T', ' ').slice(0, 19)) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    req.user = null;
    return next();
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  req.user = sanitizeUser(user);
  req.authToken = token;
  next();
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется вход в систему' });
    }
    next();
  });
}

export function assertProjectAccess(project, user) {
  if (!project) return false;
  if (project.user_id == null) return true;
  return Boolean(user && project.user_id === user.id);
}

export function assertTemplateAccess(template, user) {
  if (!template) return false;
  if (template.is_preset) return true;
  if (template.user_id == null) return true;
  return user && template.user_id === user.id;
}
