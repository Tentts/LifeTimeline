import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportPdf, exportPng, exportTl, type ExportFormat } from '../export/exporters';
import type { Timeline } from '../model/schema';
import { Modal } from './Modal';

const FORMATS: ExportFormat[] = ['tl', 'pdf', 'png'];

export function ExportDialog({ timeline, onClose }: { timeline: Timeline; onClose: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    setFailed(false);
    try {
      if (format === 'tl') exportTl(timeline);
      else if (format === 'png') await exportPng(timeline);
      else await exportPdf(timeline);
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      title={t('export.title')}
      onClose={onClose}
      footer={
        <button type="button" className="secondary" onClick={onClose}>
          {t('common.close')}
        </button>
      }
    >
      <p className="hint">{t('export.localOnly')}</p>
      <ul className="export-options">
        {FORMATS.map((format) => (
          <li key={format}>
            <button type="button" disabled={busy !== null} onClick={() => void run(format)}>
              {busy === format ? t('export.working') : t(`export.formats.${format}.label`)}
            </button>
            <span className="muted">{t(`export.formats.${format}.description`)}</span>
          </li>
        ))}
      </ul>
      {failed && (
        <p className="field-error" role="alert">
          {t('export.failed')}
        </p>
      )}
      <p className="notice">{t('export.keepSafe')}</p>
    </Modal>
  );
}
