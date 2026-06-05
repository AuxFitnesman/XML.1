import crypto from 'crypto';

const SALT_LEN = 16;
const KEY_LEN = 64;
const TOKEN_BYTES = 32;
const SESSION_DAYS = 7;

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.scryptSync(password, salt, KEY_LEN);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const hash = Buffer.from(hashHex, 'hex');
  const candidate = crypto.scryptSync(password, salt, KEY_LEN);
  return crypto.timingSafeEqual(hash, candidate);
}

export function createToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function sessionExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
  };
}
