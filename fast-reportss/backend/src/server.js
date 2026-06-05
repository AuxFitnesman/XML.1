import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import projectsRouter from './routes/projects.js';
import templatesRouter from './routes/templates.js';
import uploadsRouter from './routes/uploads.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import { seedPresets } from './seedPresets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();
const app = express();
const PORT = process.env.PORT || 3001;

const dirs = ['data/projects', 'data/exports', 'data/uploads', 'data/templates', 'data/history'];
dirs.forEach((d) => fs.mkdirSync(path.join(__dirname, '..', d), { recursive: true }));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'fast-reports' });
});

app.get('/api/page-sizes', (req, res) => {
  res.json({
    sizes: [
      { id: 'A4', label: 'A4 (210×297 мм)', width: 794, height: 1123 },
      { id: 'A5', label: 'A5 (148×210 мм)', width: 559, height: 794 },
      { id: 'A3', label: 'A3 (297×420 мм)', width: 1123, height: 1587 },
      { id: 'Letter', label: 'Letter (8.5×11")', width: 816, height: 1056 },
      { id: 'custom', label: 'Пользовательский размер' },
    ],
    orientations: ['portrait', 'landscape'],
  });
});

seedPresets().then(() => {
  app.listen(PORT, () => {
    console.log(`Fast Reports API: http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Seed error:', err);
  app.listen(PORT, () => console.log(`Fast Reports API: http://localhost:${PORT}`));
});
