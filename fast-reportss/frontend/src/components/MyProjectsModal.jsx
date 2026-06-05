import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function MyProjectsModal({
  onClose,
  onOpenProject,
  onNewProject,
  currentProjectId,
}) {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(currentProjectId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await api.listProjects(token);
      setProjects(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Удалить проект?')) return;
    try {
      await api.deleteProject(token, id);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const showHistory = async (id) => {
    try {
      const h = await api.getProjectHistory(token, id);
      setHistory(h);
      setSelectedId(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal projects-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Мои проекты</h2>
        <p className="ai-modal-hint">Листовки, сохранённые в вашем личном кабинете на сервере.</p>

        <div className="projects-toolbar">
          <button type="button" className="ai-btn-primary" onClick={onNewProject}>
            + Новый проект
          </button>
          <button type="button" className="ai-btn-secondary" onClick={load} disabled={loading}>
            Обновить
          </button>
        </div>

        {error && <p className="ai-error">{error}</p>}
        {loading && <p className="ai-modal-hint">Загрузка…</p>}

        {!loading && projects.length === 0 && (
          <p className="ai-modal-hint">Пока нет сохранённых проектов. Создайте новый или сохраните текущий макет.</p>
        )}

        <ul className="projects-list">
          {projects.map((p) => (
            <li
              key={p.id}
              className={selectedId === p.id ? 'project-item selected' : 'project-item'}
              onClick={() => showHistory(p.id)}
            >
              <div className="project-item-main">
                <strong>{p.name}</strong>
                <span className="project-date">{p.updated_at}</span>
              </div>
              <div className="project-item-actions">
                <button
                  type="button"
                  className="ai-btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProject(p.id);
                  }}
                >
                  Открыть
                </button>
                <button
                  type="button"
                  className="ai-btn-secondary"
                  onClick={(e) => handleDelete(p.id, e)}
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>

        {history.length > 0 && (
          <div className="project-history">
            <h4>История сохранений</h4>
            <ul>
              {history.slice(0, 8).map((h) => (
                <li key={h.id}>{h.saved_at}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="ai-modal-actions">
          <button type="button" className="ai-btn-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
