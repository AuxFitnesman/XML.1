import { Router } from 'express';
import { generateFlyerDesign, isAiConfigured } from '../services/aiService.js';

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    configured: isAiConfigured(),
    provider: isAiConfigured() ? 'openai' : 'mock',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  });
});

router.post('/generate', async (req, res) => {
  try {
    const { topic, flyerType, pageWidth, pageHeight, mode } = req.body || {};

    const result = await generateFlyerDesign({
      topic,
      flyerType,
      pageWidth: Number(pageWidth) || 794,
      pageHeight: Number(pageHeight) || 1123,
      mode: mode || 'all',
    });

    res.json(result);
  } catch (err) {
    console.error('AI generate error:', err);
    res.status(400).json({ error: err.message || 'Ошибка генерации' });
  }
});

export default router;
