import { useState, useEffect } from 'react';

export default function LayersPanel({ canvas }) {
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const updateLayers = () => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const layersData = objects.map((obj, index) => ({
      id: obj.id || `layer-${index}`,
      name: obj.name || getLayerName(obj.type, index),
      type: obj.type,
      visible: obj.visible !== false,
      locked: obj.locked === true,
      index: index
    })).reverse();
    
    setLayers(layersData);
    
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      setSelectedId(activeObj.id);
    } else {
      setSelectedId(null);
    }
  };

  const getLayerName = (type, index) => {
    const names = {
      'i-text': 'Текст',
      'text': 'Текст',
      'image': 'Картинка',
      'rect': 'Прямоугольник',
      'circle': 'Круг',
      'triangle': 'Треугольник'
    };
    return `${names[type] || 'Объект'} ${index + 1}`;
  };

  useEffect(() => {
    if (!canvas) return;

    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    canvas.on('selection:created', updateLayers);
    canvas.on('selection:updated', updateLayers);
    canvas.on('selection:cleared', updateLayers);

    updateLayers();

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
      canvas.off('selection:created', updateLayers);
      canvas.off('selection:updated', updateLayers);
      canvas.off('selection:cleared', updateLayers);
    };
  }, [canvas]);

  const selectLayer = (layer) => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const obj = objects[layer.index];
    
    if (obj && !obj.locked) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
      setSelectedId(layer.id);
    }
  };

  const toggleVisibility = (layer, e) => {
    e.stopPropagation();
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[layer.index];
    
    if (obj) {
      obj.visible = !obj.visible;
      canvas.renderAll();
      updateLayers();
    }
  };

  const toggleLock = (layer, e) => {
    e.stopPropagation();
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[layer.index];
    
    if (obj) {
      obj.locked = !obj.locked;
      obj.selectable = !obj.locked;
      obj.evented = !obj.locked;
      
      if (obj.locked) {
        canvas.discardActiveObject();
      }
      
      canvas.renderAll();
      updateLayers();
    }
  };

  const renameLayer = (layer, newName, e) => {
    e.stopPropagation();
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[layer.index];
    
    if (obj) {
      obj.name = newName;
      updateLayers();
    }
  };

  const moveUp = (layer, e) => {
    e.stopPropagation();
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[layer.index];
    
    if (obj && layer.index < objects.length - 1) {
      canvas.bringForward(obj);
      canvas.renderAll();
      updateLayers();
    }
  };

  const moveDown = (layer, e) => {
    e.stopPropagation();
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[layer.index];
    
    if (obj && layer.index > 0) {
      canvas.sendBackwards(obj);
      canvas.renderAll();
      updateLayers();
    }
  };

  const deleteLayer = (layer, e) => {
    e.stopPropagation();
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[layer.index];
    
    if (obj) {
      canvas.remove(obj);
      canvas.renderAll();
      updateLayers();
    }
  };

  if (!canvas || layers.length === 0) {
    return (
      <div className="layers-panel">
        <h4>Слои</h4>
        <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
          Нет объектов
        </p>
      </div>
    );
  }

  return (
    <div className="layers-panel">
      <h4>Слои</h4>
      
      <div className="layers-list">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${selectedId === layer.id ? 'selected' : ''} ${!layer.visible ? 'hidden' : ''}`}
            onClick={() => selectLayer(layer)}
            style={{
              padding: '8px 12px',
              border: selectedId === layer.id ? '2px solid #4f46e5' : '1px solid #e2e8f0',
              borderRadius: '6px',
              marginBottom: '6px',
              cursor: layer.locked ? 'not-allowed' : 'pointer',
              background: selectedId === layer.id ? '#eef2ff' : 'white',
              opacity: layer.visible ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '14px' }}>
              {layer.type === 'i-text' || layer.type === 'text' ? '🔤' :
               layer.type === 'image' ? '🖼️' :
               layer.type === 'rect' ? '⬜' :
               layer.type === 'circle' ? '⭕' : '📦'}
            </span>

            <input
              type="text"
              value={layer.name}
              onChange={(e) => renameLayer(layer, e.target.value, e)}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                padding: '2px 4px',
                borderRadius: '4px',
                cursor: layer.locked ? 'not-allowed' : 'text',
                outline: 'none'
              }}
              disabled={layer.locked}
            />
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
               onClick={(e) => toggleVisibility(layer, e)}
               style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: 1,
                filter: layer.visible ? 'none' : 'grayscale(100%)'
              }}
              title={layer.visible ? 'Скрыть' : 'Показать'}
            >
             👁️
            </button>

              <button
                onClick={(e) => toggleLock(layer, e)}
                style={{
                  padding: '4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  opacity: layer.locked ? 1 : 0.3
                }}
                title={layer.locked ? 'Разблокировать' : 'Заблокировать'}
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                onClick={(e) => moveUp(layer, e)}
                disabled={layer.index === layers.length - 1}
                style={{
                  padding: '2px 6px',
                  background: layer.index === layers.length - 1 ? '#f1f5f9' : 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  cursor: layer.index === layers.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '10px',
                  opacity: layer.index === layers.length - 1 ? 0.5 : 1
                }}
                title="Вверх"
              >
                ↑
              </button>
              <button
                onClick={(e) => moveDown(layer, e)}
                disabled={layer.index === 0}
                style={{
                  padding: '2px 6px',
                  background: layer.index === 0 ? '#f1f5f9' : 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  cursor: layer.index === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '10px',
                  opacity: layer.index === 0 ? 0.5 : 1
                }}
                title="Вниз"
              >
                ↓
              </button>
            </div>
            
            <button
              onClick={(e) => deleteLayer(layer, e)}
              style={{
                padding: '4px 8px',
                background: '#fee2e2',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#dc2626'
              }}
              title="Удалить слой"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}