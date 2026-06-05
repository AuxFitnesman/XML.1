/**
 * Применяет результат ИИ-генерации к холсту Fabric.js
 */
export function applyAiDesign(canvas, fabric, design) {
  if (!canvas || !fabric || !design) return;

  canvas.clear();
  const bg = design.background || '#ffffff';
  canvas.setBackgroundColor(bg, () => {});

  if (design.accentBar) {
    const bar = design.accentBar;
    const rect = new fabric.Rect({
      left: bar.left ?? 0,
      top: bar.top ?? 0,
      width: bar.width ?? canvas.width,
      height: bar.height ?? 100,
      fill: bar.fill || '#4f46e5',
      selectable: true,
      evented: true,
      name: 'ai-accent-bar',
    });
    canvas.add(rect);
    canvas.sendToBack(rect);
  }

  for (const el of design.elements || []) {
    if (el.type !== 'text' || !el.text) continue;

    const text = new fabric.IText(el.text, {
      left: el.left ?? 48,
      top: el.top ?? 48,
      fontSize: el.fontSize ?? 20,
      fill: el.fill ?? '#000000',
      fontWeight: el.fontWeight || 'normal',
      fontStyle: el.fontStyle || 'normal',
      fontFamily: el.fontFamily || 'Arial',
      width: el.width,
      editable: true,
      name: `ai-${el.role || 'text'}`,
    });
    canvas.add(text);
  }

  canvas.renderAll();
}
