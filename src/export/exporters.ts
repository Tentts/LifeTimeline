/**
 * Export formats: PNG, PDF and .tl. Everything is generated locally in the browser and
 * downloaded directly; nothing is uploaded. The heavy libraries are loaded only on demand.
 */
import i18n from '../i18n';
import { baseFileName, serializeTimeline, TL_EXTENSION } from '../format/tl';
import { GRAPH_HEIGHT, GRAPH_WIDTH } from '../graph/layout';
import type { Timeline } from '../model/schema';
import { downloadBlob } from './download';

export type ExportFormat = 'png' | 'pdf' | 'tl';

export function exportTl(timeline: Timeline): void {
  const blob = new Blob([serializeTimeline(timeline)], { type: 'application/json' });
  downloadBlob(blob, `${baseFileName(timeline.title)}${TL_EXTENSION}`);
}

export async function exportPng(timeline: Timeline, scale = 2): Promise<void> {
  const { renderGraphSvg } = await import('./graphSvg');
  const svg = renderGraphSvg(timeline);
  const blob = await svgToPng(svg, GRAPH_WIDTH, GRAPH_HEIGHT, scale);
  downloadBlob(blob, `${baseFileName(timeline.title)}.png`);
}

export async function exportPdf(timeline: Timeline): Promise<void> {
  const { buildPdf } = await import('./pdf');
  const blob = await buildPdf(timeline, i18n.t, i18n.resolvedLanguage ?? 'en');
  downloadBlob(blob, `${baseFileName(timeline.title)}.pdf`);
}

async function svgToPng(svg: string, width: number, height: number, scale: number): Promise<Blob> {
  const image = new Image();
  image.width = width;
  image.height = height;
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG failed'))), 'image/png'),
  );
}
