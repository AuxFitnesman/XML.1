import { useState, useEffect } from 'react';

export default function PropertiesPanel({ canvas, fonts }) {
  const [activeObj, setActiveObj] = useState(null);
  const [props, setProps] = useState({
    fontFamily: 'Arial',
    fontSize: 16,
    fill: '#000000',
    opacity: 1,
    fontWeight: 'normal',
    fontStyle: 'normal'
  });

  useEffect(() => {
    if (!canvas) return;

    const updateActive = () => {
      const obj = canvas.getActiveObject();
      setActiveObj(obj);
      
      if (obj) {
        setProps({
          fontFamily: obj.fontFamily || 'Arial',
          fontSize: obj.fontSize || 16,
          fill: obj.fill || '#000000',
          opacity: obj.opacity || 1,
          fontWeight: obj.fontWeight || 'normal',
          fontStyle: obj.fontStyle || 'normal'
        });
      }
    };

    canvas.on('selection:created', updateActive);
    canvas.on('selection:updated', updateActive);
    canvas.on('selection:cleared', () => {
      setActiveObj(null);
    });

    updateActive();

    return () => {
      canvas.off('selection:created', updateActive);
      canvas.off('selection:updated', updateActive);
      canvas.off('selection:cleared');
    };
  }, [canvas]);

  const update = (prop, value) => {
    if (activeObj) {
      activeObj.set(prop, value);
      canvas.renderAll();

      setProps(prev => ({ ...prev, [prop]: value }));
    }
  };

  if (!activeObj) {
    return (
      <div className="right-panel">
        <h4>Свойства</h4>
        <p style={{color: '#888', fontSize: '13px'}}>Выберите объект</p>
      </div>
    );
  }

  return (
    <div className="right-panel">
      <h4>Свойства</h4>
      
      {activeObj.type === 'i-text' && (
        <>
          <label>Шрифт:</label>
          <select 
            value={props.fontFamily}
            onChange={(e) => update('fontFamily', e.target.value)}
          >
            {fonts.map(f => (
              <option key={f.name} value={f.family}>{f.name}</option>
            ))}
          </select>

          <label>Размер:</label>
          <input 
            type="number" 
            value={props.fontSize}
            onChange={(e) => update('fontSize', parseInt(e.target.value) || 16)}
          />

          <label>Цвет:</label>
          <input 
            type="color"
            value={props.fill}
            onChange={(e) => update('fill', e.target.value)}
            style={{ height: '40px', padding: '2px' }}
          />
        </>
      )}

      <label style={{marginTop: '10px'}}>Прозрачность:</label>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01"
        value={props.opacity}
        onChange={(e) => update('opacity', parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '4px'}}>
        {Math.round(props.opacity * 100)}%
      </div>

      <div style={{marginTop: '15px', display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
        <button 
          onClick={() => { activeObj.bringToFront(); canvas.renderAll(); }}
          title="На передний план"
        >
         Вперёд
        </button>
        <button 
          onClick={() => { activeObj.sendToBack(); canvas.renderAll(); }}
          title="На задний план"
        >
         Назад
        </button>
        <button 
          onClick={() => { canvas.remove(activeObj); setActiveObj(null); }} 
          style={{color: 'red', flex: 1}}
        >
         Удалить
        </button>
      </div>
    </div>
  );
}