import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { flyerToJson } from './xmlService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../data/uploads');

function resolveImagePath(src) {
  if (!src) return null;
  if (src.startsWith('/uploads/')) {
    const local = path.join(UPLOADS_DIR, path.basename(src));
    return fs.existsSync(local) ? local : null;
  }
  if (fs.existsSync(src)) return src;
  return null;
}

export async function exportFlyer(xmlData, format, outputPath) {
  const json = flyerToJson(xmlData);

  switch (format.toLowerCase()) {
    case 'png':
      return exportRasterViaSvg(json, outputPath, 'image/png');
    case 'jpeg':
    case 'jpg':
      return exportRasterViaSvg(json, outputPath, 'image/jpeg');
    case 'svg':
      return exportSvg(json, outputPath);
    case 'pdf':
      return exportPdf(json, outputPath);
    default:
      throw new Error(`Неподдерживаемый формат: ${format}`);
  }
}

async function renderSvgString(json) {
  const { width, height, background } = json.page;
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  svg += `  <rect width="100%" height="100%" fill="${background}"/>\n`;

  for (const el of json.elements) {
    if (el.type === 'text') {
      const anchor = el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start';
      const x = el.align === 'center' ? el.x + el.width / 2 : el.align === 'right' ? el.x + el.width : el.x;
      const weight = el.bold ? 'bold' : 'normal';
      const style = el.italic ? 'italic' : 'normal';
      const lines = (el.content || '').split('\n');
      lines.forEach((line, i) => {
        const dy = el.y + el.fontSize + i * (el.fontSize * 1.2);
        svg += `  <text x="${x}" y="${dy}" font-family="${el.fontFamily}" font-size="${el.fontSize}" fill="${el.color}" text-anchor="${anchor}" font-weight="${weight}" font-style="${style}">${escapeXml(line)}</text>\n`;
      });
    } else if (el.type === 'rect') {
      svg += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" opacity="${el.opacity ?? 1}"/>\n`;
    } else if (el.type === 'image' && el.src) {
      const localPath = resolveImagePath(el.src);
      if (localPath) {
        const buf = await fs.promises.readFile(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        const b64 = buf.toString('base64');
        svg += `  <image href="data:${mime};base64,${b64}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid meet"/>\n`;
      }
    }
  }
  svg += `</svg>`;
  return svg;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function exportSvg(json, outputPath) {
  const svg = await renderSvgString(json);
  await fs.promises.writeFile(outputPath, svg, 'utf-8');
  return outputPath;
}

/** PNG/JPEG через встроенный модуль node (без sharp) */
async function exportRasterViaSvg(json, outputPath, mime) {
  let Resvg;
  try {
    const mod = await import('@resvg/resvg-js');
    Resvg = mod.Resvg;
  } catch {
    const svgPath = outputPath.replace(/\.(png|jpe?g)$/i, '.svg');
    await exportSvg(json, svgPath);
    throw new Error(
      'Для PNG/JPEG установите зависимости: npm install. Или экспортируйте в SVG/PDF.'
    );
  }

  const svg = await renderSvgString(json);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: json.page.width } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  if (mime === 'image/png') {
    await fs.promises.writeFile(outputPath, pngBuffer);
    return outputPath;
  }

  const { Jimp } = await import('jimp');
  const image = await Jimp.read(pngBuffer);
  const jpegBuf = await image.getBuffer('image/jpeg', { quality: 90 });
  await fs.promises.writeFile(outputPath, jpegBuf);
  return outputPath;
}

async function exportPdf(json, outputPath) {
  const { width, height } = json.page;
  const ptWidth = width * 0.75;
  const ptHeight = height * 0.75;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [ptWidth, ptHeight], margin: 0 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.rect(0, 0, ptWidth, ptHeight).fill(json.page.background || '#ffffff');

    const scale = 0.75;
    for (const el of json.elements) {
      if (el.type === 'rect') {
        doc.rect(el.x * scale, el.y * scale, el.width * scale, el.height * scale)
          .fill(el.fill || '#cccccc');
      } else if (el.type === 'text') {
        const font = el.bold ? 'Helvetica-Bold' : 'Helvetica';
        doc.font(font).fontSize(el.fontSize * scale).fillColor(el.color || '#000000');
        const lines = (el.content || '').split('\n');
        lines.forEach((line, i) => {
          doc.text(line, el.x * scale, (el.y + i * el.fontSize * 1.2) * scale, {
            width: el.width * scale,
            align: el.align || 'left',
          });
        });
      } else if (el.type === 'image' && el.src) {
        const imagePath = resolveImagePath(el.src);
        if (!imagePath) continue;
        try {
          doc.image(imagePath, el.x * scale, el.y * scale, {
            width: el.width * scale,
            height: el.height * scale,
          });
        } catch {
          /* skip */
        }
      }
    }

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}
