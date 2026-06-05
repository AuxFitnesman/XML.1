import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const UPLOADS_DIR = path.resolve('data/uploads');

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp|svg\+xml)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Допустимы только изображения'));
    }
  },
});

router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, path: req.file.path, filename: req.file.filename });
});

router.post('/image-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL обязателен' });

    const response = await fetch(url);
    if (!response.ok) throw new Error('Не удалось загрузить изображение');

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = path.extname(new URL(url).pathname) || '.png';
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    await import('fs/promises').then((fs) => fs.writeFile(filePath, buffer));

    res.json({ url: `/uploads/${fileName}`, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
