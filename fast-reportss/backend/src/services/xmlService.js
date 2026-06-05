import { parseStringPromise, Builder } from 'xml2js';
import fs from 'fs/promises';
import path from 'path';

const PAGE_SIZES = {
  A4: { width: 794, height: 1123 },
  A5: { width: 559, height: 794 },
  Letter: { width: 816, height: 1056 },
  A3: { width: 1123, height: 1587 },
};

export function getPageDimensions(pageSize, orientation, customWidth, customHeight) {
  let dims;
  if (pageSize === 'custom' && customWidth && customHeight) {
    dims = { width: Number(customWidth), height: Number(customHeight) };
  } else {
    dims = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  }
  if (orientation === 'landscape') {
    return { width: dims.height, height: dims.width };
  }
  return dims;
}

export function createEmptyFlyer(name = 'Новая листовка', pageSize = 'A4', orientation = 'portrait') {
  const dims = getPageDimensions(pageSize, orientation);
  return {
    flyer: {
      $: { version: '1.0', name },
      page: [{
        $: { size: pageSize, orientation, width: String(dims.width), height: String(dims.height) },
        background: [{ $: { color: '#ffffff' } }],
        elements: [{ element: [] }],
      }],
    },
  };
}

export async function readXmlFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseStringPromise(content, { explicitArray: true, mergeAttrs: false });
}

export async function writeXmlFile(filePath, data) {
  const builder = new Builder({ headless: false, renderOpts: { pretty: true, indent: '  ' } });
  const xml = builder.buildObject(data);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, xml, 'utf-8');
  return xml;
}

export function validateFlyerXml(data) {
  if (!data?.flyer?.page?.[0]) {
    throw new Error('Некорректный XML: отсутствует элемент flyer/page');
  }
  const page = data.flyer.page[0];
  if (!page.$?.width || !page.$?.height) {
    throw new Error('Некорректный XML: не указаны размеры страницы');
  }
  return true;
}

export function flyerToJson(data) {
  const page = data.flyer.page[0];
  const bg = page.background?.[0]?.$ || { color: '#ffffff' };
  const elements = (page.elements?.[0]?.element || []).map((el, index) => ({
    id: el.$?.id || `el-${index}`,
    type: el.$?.type || 'text',
    x: Number(el.$?.x || 0),
    y: Number(el.$?.y || 0),
    width: Number(el.$?.width || 200),
    height: Number(el.$?.height || 50),
    zIndex: Number(el.$?.zIndex || index),
    locked: el.$?.locked === 'true',
    ...parseElementProps(el),
  }));

  return {
    name: data.flyer.$?.name || 'Листовка',
    page: {
      size: page.$?.size || 'A4',
      orientation: page.$?.orientation || 'portrait',
      width: Number(page.$?.width),
      height: Number(page.$?.height),
      background: bg.color || '#ffffff',
    },
    elements: elements.sort((a, b) => a.zIndex - b.zIndex),
  };
}

function parseElementProps(el) {
  const attrs = el.$ || {};
  if (attrs.type === 'text') {
    const textNode = el.text?.[0] || {};
    const style = el.style?.[0]?.$ || {};
    return {
      content: typeof textNode === 'string' ? textNode : textNode._ || 'Текст',
      fontFamily: style.fontFamily || 'Arial',
      fontSize: Number(style.fontSize || 24),
      color: style.color || '#000000',
      align: style.align || 'left',
      bold: style.bold === 'true',
      italic: style.italic === 'true',
    };
  }
  if (attrs.type === 'image') {
    const src = el.source?.[0];
    return {
      src: typeof src === 'string' ? src : src?._ || src?.$?.url || '',
    };
  }
  if (attrs.type === 'rect') {
    const style = el.style?.[0]?.$ || {};
    return {
      fill: style.fill || '#cccccc',
      stroke: style.stroke || 'transparent',
      strokeWidth: Number(style.strokeWidth || 0),
      opacity: Number(style.opacity || 1),
    };
  }
  return {};
}

export function jsonToFlyer(json) {
  const elements = (json.elements || []).map((el) => {
    const base = {
      $: {
        id: el.id,
        type: el.type,
        x: String(el.x),
        y: String(el.y),
        width: String(el.width),
        height: String(el.height),
        zIndex: String(el.zIndex ?? 0),
        locked: el.locked ? 'true' : 'false',
      },
    };

    if (el.type === 'text') {
      base.text = [{ _: el.content || 'Текст' }];
      base.style = [{
        $: {
          fontFamily: el.fontFamily || 'Arial',
          fontSize: String(el.fontSize || 24),
          color: el.color || '#000000',
          align: el.align || 'left',
          bold: el.bold ? 'true' : 'false',
          italic: el.italic ? 'true' : 'false',
        },
      }];
    } else if (el.type === 'image') {
      base.source = [{ _: el.src || '' }];
    } else if (el.type === 'rect') {
      base.style = [{
        $: {
          fill: el.fill || '#cccccc',
          stroke: el.stroke || 'transparent',
          strokeWidth: String(el.strokeWidth || 0),
          opacity: String(el.opacity ?? 1),
        },
      }];
    }
    return base;
  });

  const dims = getPageDimensions(
    json.page.size,
    json.page.orientation,
    json.page.width,
    json.page.height
  );

  return {
    flyer: {
      $: { version: '1.0', name: json.name || 'Листовка' },
      page: [{
        $: {
          size: json.page.size || 'A4',
          orientation: json.page.orientation || 'portrait',
          width: String(json.page.width || dims.width),
          height: String(json.page.height || dims.height),
        },
        background: [{ $: { color: json.page.background || '#ffffff' } }],
        elements: [{ element: elements }],
      }],
    },
  };
}

export { PAGE_SIZES };
