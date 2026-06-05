export function jsonToXML(canvasJSON) {
  let xml = `<flyer width="${canvasJSON.width}" height="${canvasJSON.height}" bg="${canvasJSON.background || '#ffffff'}">\n`;
  (canvasJSON.objects || []).forEach(obj => {
    xml += `  <element type="${obj.type}" left="${Math.round(obj.left)}" top="${Math.round(obj.top)}" width="${Math.round(obj.width || 0)}" height="${Math.round(obj.height || 0)}" fill="${obj.fill || ''}" opacity="${obj.opacity || 1}"`;
    if (obj.type === 'i-text') {
      xml += ` font-size="${obj.fontSize || 16}" font-weight="${obj.fontWeight || 'normal'}">\n    ${obj.text}\n  </element>\n`;
    } else if (obj.type === 'image') {
      xml += ` src="${obj.src || ''}" />\n`;
    } else {
      xml += ` />\n`;
    }
  });
  xml += `</flyer>`;
  return xml;
}

export function xmlToJSON(xmlString) {
  // базовый парсер
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  const root = doc.querySelector('flyer');
  if (!root) throw new Error('Неверный XML шаблон');

  const json = { width: +root.getAttribute('width') || 794, height: +root.getAttribute('height') || 1123, background: root.getAttribute('bg') || '#ffffff', objects: [] };
  const elements = doc.querySelectorAll('element');
  elements.forEach(el => {
    const type = el.getAttribute('type');
    const obj = {
      type, left: +el.getAttribute('left'), top: +el.getAttribute('top'), width: +el.getAttribute('width') || 100, height: +el.getAttribute('height') || 100,
      fill: el.getAttribute('fill') || '#000', opacity: +el.getAttribute('opacity') || 1, angle: 0, scaleX: 1, scaleY: 1
    };
    if (type === 'i-text') {
      obj.text = el.textContent.trim();
      obj.fontSize = +el.getAttribute('font-size') || 16;
      obj.fontWeight = el.getAttribute('font-weight') || 'normal';
    } else if (type === 'image') {
      obj.src = el.getAttribute('src');
    }
    json.objects.push(obj);
  });
  return json;
}