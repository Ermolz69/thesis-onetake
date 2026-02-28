import type { ChunkUploadProgress, ChunkUploadStatus } from '@/features/chunk-upload/types';

export interface UploadProgressProps {
  status: ChunkUploadStatus;
  progress: ChunkUploadProgress;
}

export const UploadProgress = ({ status, progress }: UploadProgressProps) => {
  if (status === 'idle') return null;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-fg-secondary">
        <span>
          {status === 'uploading' &&
            `Uploading parts ${progress.uploadedParts}/${progress.totalParts}`}
          {status === 'finalizing' && 'Finalizing…'}
          {status === 'done' && 'Done'}
          {status === 'error' && 'Error'}
        </span>
        {(status === 'uploading' || status === 'finalizing') && <span>{progress.percent}%</span>}
      </div>
      {(status === 'uploading' || status === 'finalizing') && (
        <div className="h-2 w-full rounded bg-bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}
    </div>
  );
};
