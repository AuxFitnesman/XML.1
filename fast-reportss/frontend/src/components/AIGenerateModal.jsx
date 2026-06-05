import { useState, useEffect } from 'react';
import { getAiStatus, generateFlyerAI } from '../api/client';

const FLYER_TYPES = [
  { id: 'реклама', label: 'Реклама' },
  { id: 'приглашение', label: 'Приглашение' },
  { id: 'объявление', label: 'Объявление' },
  { id: 'информация', label: 'Информация' },
  { id: 'мероприятие', label: 'Мероприятие' },
  { id: 'акция', label: 'Акция' },
];

const MODES = [
  { id: 'all', label: 'Текст и оформление' },
  { id: 'content', label: 'Только текст' },
  { id: 'design', label: 'Только оформление' },
];

export default function AIGenerateModal({ onClose, onApply, pageSize }) {
  const [topic, setTopic] = useState('');
  const [flyerType, setFlyerType] = useState('реклама');
  const [mode, setMode] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    getAiStatus()
      .then(setAiStatus)
      .catch(() => setAiStatus({ configured: false, provider: 'mock' }));
  }, []);

  const handleGenerate = async () => {
    setError('');
    if (!topic.trim() && mode !== 'design') {
      setError('Введите тему листовки');
      return;
    }

    setLoading(true);
    try {
      const result = await generateFlyerAI({
        topic: topic.trim(),
        flyerType,
        pageWidth: pageSize.width,
        pageHeight: pageSize.height,
        mode,
      });
      onApply(result.design, result);
      onClose();
    } catch (e) {
      setError(e.message || 'Ошибка генерации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <h2>ИИ-генерация листовки</h2>
        <p className="ai-modal-hint">
          Автоматическое формирование заголовков, текстов, слоганов и предложений по цветам и композиции.
        </p>

        {aiStatus && (
          <p className={`ai-status ${aiStatus.configured ? 'ai-status--ok' : 'ai-status--mock'}`}>
            {aiStatus.configured
              ? `Подключено: OpenAI (${aiStatus.model})`
              : 'Демо-режим: задайте OPENAI_API_KEY в backend/.env для полноценной генерации'}
          </p>
        )}

        <label className="ai-field">
          <span>Тема / описание</span>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Например: скидка 30% в кофейне до конца месяца"
            rows={3}
            disabled={loading}
          />
        </label>

        <label className="ai-field">
          <span>Тип листовки</span>
          <select value={flyerType} onChange={(e) => setFlyerType(e.target.value)} disabled={loading}>
            {FLYER_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ai-field">
          <span>Режим</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={loading}>
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="ai-error">{error}</p>}

        <div className="ai-modal-actions">
          <button type="button" className="ai-btn-secondary" onClick={onClose} disabled={loading}>
            Отмена
          </button>
          <button type="button" className="ai-btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Генерация…' : 'Сгенерировать'}
          </button>
        </div>
      </div>
    </div>
  );
}
