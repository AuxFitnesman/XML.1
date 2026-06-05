import { useState } from 'react';

export default function Toolbar({ 
  onSaveXML, 
  onLoadXML, 
  onExportPNG, 
  onExportJPEG, 
  onExportSVG, 
  onExportPDF,
  onOpenTemplates,
  onOpenAI,
  user,
  onLogin,
  onLogout,
  onOpenProjects,
  onSaveToCloud,
  isAuthenticated,
  projectName,
  onProjectNameChange,
  pageSize,
  setPageSize, 
  orientation, 
  setOrientation, 
  onZoom,
  zoom,
  onToggleTheme,
  theme,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState(pageSize.width);
  const [customHeight, setCustomHeight] = useState(pageSize.height);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLoadXML(reader.result);
    reader.readAsText(file);
  };

  const handleSizeChange = (e) => {
    if (e.target.value === 'custom') {
      setIsCustomSize(true);
    } else {
      setIsCustomSize(false);
      const [w, h] = e.target.value.split('x').map(Number);
      setPageSize({ width: w, height: h });
    }
  };

  const applyCustomSize = () => {
    if (customWidth > 0 && customHeight > 0) {
      setPageSize({ width: Number(customWidth), height: Number(customHeight) });
    }
  };

  return (
    <div className="toolbar">
      <h3>Листовки</h3>
      
      <button onClick={onOpenTemplates}>Шаблоны</button>
      <button onClick={onOpenAI} className="toolbar-ai-btn" title="ИИ-генерация">ИИ</button>
      
      <button onClick={() => onZoom(1)}>+</button>
      <button onClick={() => onZoom(-1)}>-</button>
      
      <button onClick={onToggleTheme} title="Сменить тему" style={{ fontSize: '16px', padding: '6px 10px' }}>
        {theme === 'light' ? 'Темная' : 'Светлая'}
      </button>
      
      <button onClick={onUndo} disabled={!canUndo} style={{ opacity: canUndo ? 1 : 0.3 }}>↩️</button>
      <button onClick={onRedo} disabled={!canRedo} style={{ opacity: canRedo ? 1 : 0.3 }}>↪️</button>

      {/* Выбор размера с кастомным */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select 
          value={isCustomSize ? 'custom' : `${pageSize.width}x${pageSize.height}`}
          onChange={handleSizeChange}
          style={{ width: 'auto' }}
        >
          <option value="794x1123">A4</option>
          <option value="559x794">A5</option>
          <option value="816x1056">Letter</option>
          <option value="custom">Свой размер...</option>
        </select>

        {isCustomSize && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input 
              type="number" 
              value={customWidth} 
              onChange={(e) => setCustomWidth(e.target.value)}
              placeholder="Ширина"
              style={{ width: '70px' }}
            />
            <span>×</span>
            <input 
              type="number" 
              value={customHeight} 
              onChange={(e) => setCustomHeight(e.target.value)}
              placeholder="Высота"
              style={{ width: '70px' }}
            />
            <button onClick={applyCustomSize} style={{ padding: '4px 8px', fontSize: '12px' }}>OK</button>
          </div>
        )}
      </div>

      <button onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}>
        {orientation === 'portrait' ? 'Книжная' : 'Альбомная'}
      </button>

      <div style={{ flex: 1 }} />

      {/* Авторизация и проекты */}
      {isAuthenticated ? (
        <>
          <input
            type="text"
            className="toolbar-project-name"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            title="Название проекта"
            style={{ width: '150px', padding: '4px 8px' }}
          />
          <button type="button" onClick={onOpenProjects} title="Мои проекты">
            Проекты
          </button>
          <button type="button" onClick={onSaveToCloud} title="Сохранить на сервер">
            Сохранить
          </button>
          <span className="toolbar-user" title={user?.email}>
            {user?.name || user?.email}
          </span>
          <button type="button" onClick={onLogout}>
            Выйти
          </button>
        </>
      ) : (
        <button type="button" onClick={onLogin}>
          Войти
        </button>
      )}

      <input type="file" accept=".xml" style={{ display: 'none' }} id="xml-file" onChange={handleFile} />
      <button onClick={() => document.getElementById('xml-file').click()}>Открыть</button>
      <button onClick={onSaveXML}>XML</button>
      <button onClick={onExportPNG}>PNG</button>
      <button onClick={onExportJPEG}>JPEG</button>
      <button onClick={onExportPDF}>PDF</button>
      <button onClick={onExportSVG}>SVG</button>
    </div>
  );
}