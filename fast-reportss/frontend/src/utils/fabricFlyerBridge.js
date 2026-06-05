/**
 * Конвертация между Fabric.js и форматом flyer API (backend xmlService)
 */

function pageSizeId(width, height) {
  if (width === 794 && height === 1123) return 'A4';
  if (width === 559 && height === 794) return 'A5';
  if (width === 816 && height === 1056) return 'Letter';
  if (width === 1123 && height === 1587) return 'A3';
  return 'custom';
}

export function canvasToFlyer(canvas, { pageSize, orientation, name = 'Листовка' }) {
  const objects = canvas.getObjects();
  const elements = objects
    .map((obj, index) => {
      const w = Math.round((obj.width || 0) * (obj.scaleX || 1));
      const h = Math.round((obj.height || 0) * (obj.scaleY || 1));
      const base = {
        id: obj.name || `el-${index}`,
        x: Math.round(obj.left || 0),
        y: Math.round(obj.top || 0),
        width: w || 100,
        height: h || 50,
        zIndex: index,
        locked: false,
      };

      if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
        return {
          ...base,
          type: 'text',
          content: obj.text || '',
          fontFamily: obj.fontFamily || 'Arial',
          fontSize: obj.fontSize || 24,
          color: obj.fill || '#000000',
          align: obj.textAlign || 'left',
          bold: obj.fontWeight === 'bold',
          italic: obj.fontStyle === 'italic',
        };
      }

      if (obj.type === 'rect') {
        return {
          ...base,
          type: 'rect',
          fill: obj.fill || '#cccccc',
          stroke: obj.stroke || 'transparent',
          strokeWidth: obj.strokeWidth || 0,
          opacity: obj.opacity ?? 1,
        };
      }

      if (obj.type === 'image') {
        return {
          ...base,
          type: 'image',
          src: obj.src || '',
        };
      }

      return null;
    })
    .filter(Boolean);

  const bg =
    typeof canvas.backgroundColor === 'string'
      ? canvas.backgroundColor
      : '#ffffff';

  return {
    name,
    page: {
      size: pageSizeId(pageSize.width, pageSize.height),
      orientation: orientation || 'portrait',
      width: pageSize.width,
      height: pageSize.height,
      background: bg,
    },
    elements,
  };
}

export function flyerToFabricJson(flyer) {
  const objects = (flyer.elements || []).map((el) => {
    if (el.type === 'text') {
      return {
        type: 'i-text',
        left: el.x,
        top: el.y,
        width: el.width,
        text: el.content || '',
        fontSize: el.fontSize || 24,
        fill: el.color || '#000000',
        fontFamily: el.fontFamily || 'Arial',
        fontWeight: el.bold ? 'bold' : 'normal',
        fontStyle: el.italic ? 'italic' : 'normal',
        textAlign: el.align || 'left',
        name: el.id,
      };
    }
    if (el.type === 'rect') {
      return {
        type: 'rect',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        fill: el.fill || '#cccccc',
        stroke: el.stroke || 'transparent',
        strokeWidth: el.strokeWidth || 0,
        opacity: el.opacity ?? 1,
        name: el.id,
      };
    }
    if (el.type === 'image' && el.src) {
      return {
        type: 'image',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        src: el.src,
        name: el.id,
      };
    }
    return null;
  }).filter(Boolean);

  return {
    version: '5.3.0',
    background: flyer.page?.background || '#ffffff',
    width: flyer.page?.width || 794,
    height: flyer.page?.height || 1123,
    objects,
  };
}

export function getPageSizeFromFlyer(flyer) {
  return {
    width: flyer.page?.width || 794,
    height: flyer.page?.height || 1123,
  };
}

export function getOrientationFromFlyer(flyer) {
  return flyer.page?.orientation || 'portrait';
}
