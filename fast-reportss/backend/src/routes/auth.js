import { Router } from 'express';
import db from '../db/database.js';
import {
  hashPassword,
  verifyPassword,
  createToken,
  sessionExpiresAt,
  sanitizeUser,
} from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Укажите email и пароль' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль не менее 6 символов' });
    }

    const password_hash = hashPassword(password);
    let result;
    try {
      result = db
        .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
        .run(email, password_hash, name || '');
    } catch (e) {
      if (e.message === 'EMAIL_EXISTS') {
        return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      }
      throw e;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = createToken();
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
      token,
      user.id,
      sessionExpiresAt()
    );

    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Укажите email и пароль' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = createToken();
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
      token,
      user.id,
      sessionExpiresAt()
    );

    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  try {
    if (req.authToken) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(req.authToken);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
