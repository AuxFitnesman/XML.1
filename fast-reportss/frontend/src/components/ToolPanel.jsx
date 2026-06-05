export default function ToolPanel({
  canvas,
  fabric,
  onBgChange,
  showGrid,
  onGridToggle,
  onImageUpload,
  onCopy,
  onPasteObject,
  hasCopiedObject
}) {
  const addText = () => {
    if (!canvas) {
      console.warn('Холст ещё не инициализирован');
      return;
    }
    const text = new fabric.IText('Ваш текст', {
      left: 100,
      top: 100,
      fontSize: 32,
      fill: '#0f172a',
      fontFamily: 'Arial'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <div className="left-panel">
      <h4>Инструменты</h4>
      <button onClick={addText}>Добавить текст</button>

      <input 
        type="file" 
        id="img-upload" 
        accept="image/*" 
        style={{ display: 'none' }}
        onChange={onImageUpload}
      />
      <button onClick={() => document.getElementById('img-upload').click()}>
        Загрузить картинку
      </button>

      <p style={{fontSize: '11px', color: '#888', marginTop: '8px', marginBottom: '12px'}}>
        Ctrl+V для вставки
      </p>

      <button onClick={onCopy} disabled={!canvas || !canvas.getActiveObject()}>
        Копировать
      </button>
      <button onClick={onPasteObject} disabled={!hasCopiedObject}>
        Вставить
      </button>

      <label style={{marginTop: '15px'}}>Фон:</label>
      
      <div className={`color-picker-wrap ${isDarkTheme ? 'dark' : 'light'}`}>
        <input 
          type="color" 
          defaultValue="#ffffff"
          onChange={(e) => onBgChange(e.target.value)}
          className="bg-color-input"
        />
      </div>

      <label style={{marginTop: '10px'}}>
        <input 
          type="checkbox" 
          checked={showGrid}
          onChange={onGridToggle}
          style={{marginRight: '6px'}}
        />
        Сетка
      </label>
    </div>
  );
}