const FLYER_TYPES = {
  реклама: 'рекламная листовка',
  приглашение: 'приглашение на мероприятие',
  объявление: 'объявление',
  информация: 'информационный бюллетень',
  мероприятие: 'афиша мероприятия',
  акция: 'рекламная акция',
};

const SYSTEM_PROMPT = `Ты дизайнер листовок. Отвечай ТОЛЬКО валидным JSON без markdown.
Схема ответа:
{
  "background": "#hex цвет фона страницы",
  "palette": ["#hex", "#hex", "#hex"],
  "layoutHints": "кратко на русском",
  "accentBar": { "left": number, "top": number, "width": number, "height": number, "fill": "#hex" } или null,
  "elements": [
    {
      "role": "title|subtitle|body|slogan|cta",
      "type": "text",
      "text": "строка",
      "left": number,
      "top": number,
      "fontSize": number,
      "fill": "#hex",
      "fontWeight": "normal|bold",
      "fontStyle": "normal|italic",
      "fontFamily": "Arial|Montserrat|Roboto",
      "width": number (опционально, max ширина текста)
    }
  ]
}
Координаты в пикселях от левого верхнего угла. Учитывай width и height страницы.
Текст на русском. Заголовок крупный сверху, CTA внизу. Не выходи за границы страницы.`;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function mockGenerate({ topic, flyerType, pageWidth, pageHeight, mode }) {
  const w = pageWidth || 794;
  const h = pageHeight || 1123;
  const typeLabel = FLYER_TYPES[flyerType] || flyerType || 'листовка';
  const subject = (topic || 'Ваше предложение').trim();

  const palettes = {
    реклама: { bg: '#0f172a', accent: '#f59e0b', primary: '#ffffff', secondary: '#94a3b8' },
    приглашение: { bg: '#1e1b4b', accent: '#c084fc', primary: '#faf5ff', secondary: '#ddd6fe' },
    объявление: { bg: '#fef3c7', accent: '#b45309', primary: '#78350f', secondary: '#92400e' },
    информация: { bg: '#ecfdf5', accent: '#059669', primary: '#064e3b', secondary: '#047857' },
    мероприятие: { bg: '#18181b', accent: '#ef4444', primary: '#fafafa', secondary: '#a1a1aa' },
    акция: { bg: '#450a0a', accent: '#fbbf24', primary: '#fff7ed', secondary: '#fdba74' },
  };
  const p = palettes[flyerType] || palettes.реклама;

  const title =
    mode === 'design'
      ? 'Заголовок'
      : subject.length > 40
        ? subject.slice(0, 37) + '…'
        : subject;
  const subtitle =
    mode === 'design' ? 'Подзаголовок' : `Специальное предложение — ${typeLabel}`;
  const body =
    mode === 'design'
      ? 'Основной текст листовки. Замените на свой.'
      : `Узнайте подробности: ${subject}. Выгодные условия, ограниченное время.`;
  const slogan = mode === 'design' ? 'Слоган бренда' : 'Качество, которому доверяют';
  const cta = mode === 'design' ? 'Подробнее →' : 'Звоните / пишите сегодня!';

  return {
    background: p.bg,
    palette: [p.bg, p.accent, p.primary],
    layoutHints: 'Демо-режим без API-ключа: задайте OPENAI_API_KEY в backend/.env',
    accentBar: {
      left: 0,
      top: 0,
      width: w,
      height: clamp(Math.round(h * 0.14), 80, 180),
      fill: p.accent,
    },
    elements: [
      {
        role: 'title',
        type: 'text',
        text: title,
        left: 48,
        top: clamp(Math.round(h * 0.06), 40, 120),
        fontSize: clamp(Math.round(w / 18), 28, 56),
        fill: p.primary,
        fontWeight: 'bold',
        fontStyle: 'normal',
        fontFamily: 'Montserrat',
        width: w - 96,
      },
      {
        role: 'subtitle',
        type: 'text',
        text: subtitle,
        left: 48,
        top: clamp(Math.round(h * 0.22), 160, 280),
        fontSize: clamp(Math.round(w / 32), 18, 28),
        fill: p.secondary,
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontFamily: 'Roboto',
        width: w - 96,
      },
      {
        role: 'body',
        type: 'text',
        text: body,
        left: 48,
        top: clamp(Math.round(h * 0.32), 240, 400),
        fontSize: 20,
        fill: p.primary,
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontFamily: 'Arial',
        width: w - 96,
      },
      {
        role: 'slogan',
        type: 'text',
        text: slogan,
        left: 48,
        top: clamp(Math.round(h * 0.55), 400, 650),
        fontSize: 22,
        fill: p.accent,
        fontWeight: 'bold',
        fontStyle: 'italic',
        fontFamily: 'Montserrat',
        width: w - 96,
      },
      {
        role: 'cta',
        type: 'text',
        text: cta,
        left: 48,
        top: clamp(Math.round(h * 0.78), 700, h - 120),
        fontSize: 24,
        fill: p.primary,
        fontWeight: 'bold',
        fontStyle: 'normal',
        fontFamily: 'Roboto',
        width: w - 96,
      },
    ],
  };
}

function validateDesign(design, pageWidth, pageHeight) {
  if (!design || typeof design !== 'object') {
    throw new Error('Некорректный ответ ИИ');
  }
  const w = pageWidth || 794;
  const h = pageHeight || 1123;

  const out = {
    background: typeof design.background === 'string' ? design.background : '#ffffff',
    palette: Array.isArray(design.palette) ? design.palette : [],
    layoutHints: design.layoutHints || '',
    accentBar: design.accentBar || null,
    elements: [],
  };

  const elements = Array.isArray(design.elements) ? design.elements : [];
  for (const el of elements) {
    if (!el || el.type !== 'text' || !el.text) continue;
    out.elements.push({
      role: el.role || 'body',
      type: 'text',
      text: String(el.text).slice(0, 2000),
      left: clamp(Number(el.left) || 48, 0, w - 40),
      top: clamp(Number(el.top) || 48, 0, h - 40),
      fontSize: clamp(Number(el.fontSize) || 18, 10, 96),
      fill: el.fill || '#000000',
      fontWeight: el.fontWeight === 'bold' ? 'bold' : 'normal',
      fontStyle: el.fontStyle === 'italic' ? 'italic' : 'normal',
      fontFamily: el.fontFamily || 'Arial',
      width: el.width ? clamp(Number(el.width), 100, w - 48) : w - 96,
    });
  }

  if (out.accentBar) {
    out.accentBar = {
      left: clamp(Number(out.accentBar.left) || 0, 0, w),
      top: clamp(Number(out.accentBar.top) || 0, 0, h),
      width: clamp(Number(out.accentBar.width) || w, 1, w),
      height: clamp(Number(out.accentBar.height) || 100, 1, h),
      fill: out.accentBar.fill || '#4f46e5',
    };
  }

  return out;
}

async function callOpenAI({ topic, flyerType, pageWidth, pageHeight, mode }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const typeLabel = FLYER_TYPES[flyerType] || flyerType || 'листовка';
  const w = pageWidth || 794;
  const h = pageHeight || 1123;

  let task = 'Сгенерируй полный макет: тексты и оформление (цвета, позиции).';
  if (mode === 'content') task = 'Сгенерируй только тексты; цвета используй нейтральные, позиции стандартные.';
  if (mode === 'design') task = 'Сохрани смысл темы, но сфокусируйся на цветах, композиции и типографике.';

  const userPrompt = `${task}
Тема: ${topic || 'общая листовка'}
Тип: ${typeLabel}
Размер страницы: ${w}×${h} px
Режим: ${mode}`;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.75,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenAI API: ${res.status} ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Пустой ответ от OpenAI');

  const parsed = JSON.parse(content);
  return validateDesign(parsed, w, h);
}

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function generateFlyerDesign(params) {
  const { topic, flyerType = 'реклама', pageWidth, pageHeight, mode = 'all' } = params;

  if (!topic?.trim() && mode !== 'design') {
    throw new Error('Укажите тему листовки');
  }

  try {
    const fromAi = await callOpenAI({ topic, flyerType, pageWidth, pageHeight, mode });
    if (fromAi) {
      return { design: fromAi, source: 'openai' };
    }
  } catch (err) {
    if (process.env.AI_MOCK_FALLBACK === 'false') throw err;
    console.warn('AI fallback to mock:', err.message);
  }

  const design = mockGenerate({ topic, flyerType, pageWidth, pageHeight, mode });
  return {
    design: validateDesign(design, pageWidth, pageHeight),
    source: isAiConfigured() ? 'mock' : 'mock',
  };
}
