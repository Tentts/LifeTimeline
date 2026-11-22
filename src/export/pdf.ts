import type { TFunction } from 'i18next';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import {
  formatDateLabel,
  formatEventWhen,
  formatPeriodRange,
} from '../components/useEventDateLabel';
import { formatValence, valenceKey } from '../components/valence';
import { GRAPH_HEIGHT, GRAPH_WIDTH } from '../graph/layout';
import { sortEvents } from '../model/factory';
import { chapterColor, sortPeriods } from '../model/periods';
import { REFLECTION_QUESTIONS, type Timeline } from '../model/schema';
import { renderGraphSvg } from './graphSvg';

const PAGE = { width: 297, height: 210, margin: 14 }; // A4 landscape, mm
// Light-theme colours (see theme.css): blue headings, pink accents.
const COLORS = { text: '#1e2233', muted: '#5b6075', primary: '#2f5fc4', rule: '#e8e5f0' };

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

  // Following pages: chapters, then events
  const events = sortEvents(timeline.events);
  const periods = sortPeriods(timeline.periods);
  const reflections = [
    ...REFLECTION_QUESTIONS.map((id) => ({
      question: t(`reflection.questions.${id}`),
      answer: timeline.reflectionAnswers?.[id]?.trim(),
    })),
    { question: t('reflection.notes'), answer: timeline.reflection?.trim() },
  ].filter((item): item is { question: string; answer: string } => Boolean(item.answer));
  if (events.length > 0 || periods.length > 0 || reflections.length > 0) {
    doc.addPage();
    let y = PAGE.margin + 4;
    const pageBottom = PAGE.height - PAGE.margin - 6;
    const newPage = () => {
      footer(doc, t);
      doc.addPage();
      y = PAGE.margin + 4;
    };

    if (periods.length > 0) {
      doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(COLORS.primary);
      doc.text(t('chapters.heading'), PAGE.margin, y);
      y += 8;
      periods.forEach((period, index) => {
        doc.setFont('helvetica', 'bold').setFontSize(11);
        const rows = doc.splitTextToSize(period.name, contentWidth - 6) as string[];
        if (y + rows.length * 5 + 5 > pageBottom) newPage();
        doc.setFillColor(chapterColor(period, index));
        doc.rect(PAGE.margin, y - 3, 3, 3, 'F');
        doc.setTextColor(COLORS.text);
        for (const row of rows) {
          doc.text(row, PAGE.margin + 6, y);
          y += 5;
        }
        doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(COLORS.muted);
        doc.text(formatPeriodRange(t, locale, period), PAGE.margin + 6, y);
        y += 7;
      });
      y += 3;
    }

    if (events.length > 0) {
      if (y + 20 > pageBottom) newPage();
      doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(COLORS.primary);
      doc.text(t('pdf.eventsHeading'), PAGE.margin, y);
      y += 8;
    }

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

      if (y + blockHeight > pageBottom) newPage();
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

    if (reflections.length > 0) {
      if (y + 25 > pageBottom) newPage();
      y += 3;
      doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(COLORS.primary);
      doc.text(t('reflection.heading'), PAGE.margin, y);
      y += 8;
      const writeRows = (text: string, style: 'bold' | 'normal') => {
        doc.setFont('helvetica', style).setFontSize(10).setTextColor(COLORS.text);
        for (const row of doc.splitTextToSize(text, contentWidth) as string[]) {
          if (y + 5 > pageBottom) {
            newPage();
            doc.setFont('helvetica', style).setFontSize(10).setTextColor(COLORS.text);
          }
          doc.text(row, PAGE.margin, y);
          y += 5;
        }
      };
      for (const { question, answer } of reflections) {
        if (y + 12 > pageBottom) newPage();
        writeRows(question, 'bold');
        writeRows(answer, 'normal');
        y += 3;
      }
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
