import type { ChunkUploadProgress, ChunkUploadStatus } from '@/features/chunk-upload/types';
import { useI18n } from '@/app/providers/i18n';

export interface UploadProgressProps {
  status: ChunkUploadStatus;
  progress: ChunkUploadProgress;
}

export const UploadProgress = ({ status, progress }: UploadProgressProps) => {
  const { t } = useI18n();
  if (status === 'idle') return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-text-secondary">
        <span>
          {status === 'uploading' &&
            t('upload.uploadingParts', {
              uploaded: progress.uploadedParts,
              total: progress.totalParts,
            })}
          {status === 'finalizing' && t('upload.finalizing')}
          {status === 'done' && t('common.done')}
          {status === 'error' && t('common.error')}
        </span>
        {(status === 'uploading' || status === 'finalizing') && <span>{progress.percent}%</span>}
      </div>
      {(status === 'uploading' || status === 'finalizing') && (
        <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-muted">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}
    </div>
  );
};
