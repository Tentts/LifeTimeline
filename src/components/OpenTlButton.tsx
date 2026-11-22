import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readTimelineFile, TL_EXTENSION, type TlErrorCode } from '../format/tl';
import type { Timeline } from '../model/schema';
import { useTimelines } from '../state/TimelinesContext';
import { Modal } from './Modal';

/** "Open .tl file" button. The file is read locally and never uploaded. */
export function OpenTlButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { importTimeline, resolveImport } = useTimelines();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<TlErrorCode | null>(null);
  const [conflict, setConflict] = useState<Timeline | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = await readTimelineFile(file);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const clash = await importTimeline(result.timeline);
    if (clash) setConflict(clash.incoming);
  };

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()}>
        {t('import.open')}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={TL_EXTENSION}
        hidden
        data-testid="open-tl-input"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = ''; // allow re-opening the same file
        }}
      />

      {error && (
        <Modal
          title={t('import.errorTitle')}
          onClose={() => setError(null)}
          footer={
            <button type="button" onClick={() => setError(null)}>
              {t('common.ok')}
            </button>
          }
        >
          <p>{t(`import.errors.${error}`)}</p>
        </Modal>
      )}

      {conflict && (
        <Modal
          title={t('import.conflictTitle')}
          onClose={() => setConflict(null)}
          footer={
            <>
              <button type="button" className="secondary" onClick={() => setConflict(null)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  void resolveImport(conflict, 'keepBoth');
                  setConflict(null);
                }}
              >
                {t('import.keepBoth')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void resolveImport(conflict, 'replace');
                  setConflict(null);
                }}
              >
                {t('import.replace')}
              </button>
            </>
          }
        >
          <p>{t('import.conflictBody', { title: conflict.title })}</p>
        </Modal>
      )}
    </>
  );
}
