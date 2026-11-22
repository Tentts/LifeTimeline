import type { TFunction } from 'i18next';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { formatDateLabel, formatEventWhen } from '../components/useEventDateLabel';
import { formatValence, valenceKey } from '../components/valence';
import { GRAPH_HEIGHT, GRAPH_WIDTH } from '../graph/layout';
import { sortEvents } from '../model/factory';
import type { Timeline } from '../model/schema';
import { renderGraphSvg } from './graphSvg';

const PAGE = { width: 297, height: 210, margin: 14 }; // A4 landscape, mm
const COLORS = { text: '#2b2b2b', muted: '#6b6b6b', primary: '#2f5d62', rule: '#e6e1d8' };

/** Builds the PDF in the browser: page 1 is the lifeline graph, then the chronological event list. */
export async function buildPdf(timeline: Timeline, t: TFunction, locale: string): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setProperties({ title: timeline.title, creator: t('app.title') });
  const contentWidth = PAGE.width - PAGE.margin * 2;

  // Page 1: header and graph
  header(doc, timeline, t, locale);
  const graphHeight = (contentWidth * GRAPH_HEIGHT) / GRAPH_WIDTH;
  await drawSvg(doc, renderGraphSvg(timeline), PAGE.margin, 34, contentWidth, graphHeight);
  footer(doc, t);

  // Following pages: events
  const events = sortEvents(timeline.events);
  if (events.length > 0) {
    doc.addPage();
    let y = PAGE.margin + 4;
    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(COLORS.primary);
    doc.text(t('pdf.eventsHeading'), PAGE.margin, y);
    y += 8;

    for (const event of events) {
      const lines: {
        text: string;
        style: 'bold' | 'normal' | 'italic';
        size: number;
        color: string;
      }[] = [];
      const when = formatEventWhen(t, locale, timeline.person.birthDate, event);
      const badges = [
        `${formatValence(event.valence)} (${t(valenceKey(event.valence))})`,
        event.symbol ? t(`symbols.${event.symbol}`) : null,
        event.isTurningPoint ? t('eventForm.turningPointBadge') : null,
      ].filter(Boolean);
      lines.push({
        text: `${when} · ${badges.join(' · ')}`,
        style: 'normal',
        size: 9,
        color: COLORS.muted,
      });
      lines.push({ text: event.title, style: 'bold', size: 11, color: COLORS.text });
      if (event.description)
        lines.push({ text: event.description, style: 'normal', size: 10, color: COLORS.text });
      if (event.reflection)
        lines.push({
          text: `${t('eventForm.reflection')}: ${event.reflection}`,
          style: 'italic',
          size: 10,
          color: COLORS.text,
        });
      const meta = [...event.tags.map((tag) => `#${tag}`), ...event.people].join(' · ');
      if (meta) lines.push({ text: meta, style: 'normal', size: 9, color: COLORS.muted });

      const wrapped = lines.map((line) => {
        doc.setFont('helvetica', line.style).setFontSize(line.size);
        return { ...line, rows: doc.splitTextToSize(line.text, contentWidth) as string[] };
      });
      const blockHeight = wrapped.reduce((h, l) => h + l.rows.length * l.size * 0.45, 0) + 5;

      if (y + blockHeight > PAGE.height - PAGE.margin - 6) {
        footer(doc, t);
        doc.addPage();
        y = PAGE.margin + 4;
      }
      for (const line of wrapped) {
        doc.setFont('helvetica', line.style).setFontSize(line.size).setTextColor(line.color);
        for (const row of line.rows) {
          y += line.size * 0.45;
          doc.text(row, PAGE.margin, y);
        }
      }
      y += 3;
      doc.setDrawColor(COLORS.rule).line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
      y += 3;
    }
    footer(doc, t);
  }

  return doc.output('blob');
}

function header(doc: jsPDF, timeline: Timeline, t: TFunction, locale: string) {
  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(COLORS.primary);
  doc.text(timeline.title, PAGE.margin, PAGE.margin + 4);
  const details = [
    timeline.person.name,
    t('pdf.born', { date: formatDateLabel(t, locale, timeline.person.birthDate) }),
    t('pdf.exported', {
      date: new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date()),
    }),
  ].filter(Boolean);
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(COLORS.muted);
  doc.text(details.join(' · '), PAGE.margin, PAGE.margin + 11);
}

function footer(doc: jsPDF, t: TFunction) {
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(COLORS.muted);
  doc.text(t('pdf.footer'), PAGE.margin, PAGE.height - 7);
  doc.text(String(doc.getNumberOfPages()), PAGE.width - PAGE.margin, PAGE.height - 7, {
    align: 'right',
  });
}

async function drawSvg(
  doc: jsPDF,
  markup: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
  // svg2pdf measures text through the DOM, so attach it off-screen while drawing.
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.appendChild(document.importNode(svg, true));
  document.body.appendChild(host);
  try {
    await svg2pdf(host.firstElementChild as Element, doc, { x, y, width, height });
  } finally {
    host.remove();
  }
}
