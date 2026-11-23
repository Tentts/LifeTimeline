import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LifelineGraph } from '../graph/LifelineGraph';
import { EXPORT_PALETTE } from '../graph/palette';
import type { Timeline } from '../model/schema';

/** Standalone SVG markup of the lifeline with fixed colours, for PNG and PDF export. */
export function renderGraphSvg(
  timeline: Timeline,
  now?: Date,
  fitTo?: { width: number; height: number },
): string {
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <LifelineGraph
        timeline={timeline}
        palette={EXPORT_PALETTE}
        fixedSize
        now={now}
        idPrefix="export"
        fitTo={fitTo}
      />
    </I18nextProvider>,
  );
}
