import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, ErrorMessage, Badge } from '@/shared/ui';
import { routes } from '@/shared/config';
import type { TrimRange } from '@/features/recording-studio';
import { useChunkUpload } from '@/features/chunk-upload/useChunkUpload';
import { UploadProgress } from './UploadProgress';
import { createVideoThumbnail } from '@/shared/lib/video-thumbnail';
import { useI18n } from '@/app/providers/i18n';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_FILE_SIZE_GB = 2;

const selectClass =
  'w-full rounded-xl border border-border-soft bg-surface-elevated px-3 py-2 text-text-primary focus:outline-none focus-visible:[box-shadow:var(--input-ring)]';

export interface ChunkUploadFormProps {
  file: File;
  trimRange?: TrimRange;
  onBack?: () => void;
}

export const ChunkUploadForm = ({ file, trimRange, onBack }: ChunkUploadFormProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [contentText, setContentText] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [visibility, setVisibility] = useState<number>(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const { status, progress, error, post, upload, reset, cancelUpload } = useChunkUpload();
  const isFileTooLarge = file.size > MAX_FILE_SIZE_BYTES;
  const isBusy = status === 'uploading' || status === 'finalizing';
  const isVideoFile = file.type.startsWith('video/');
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const displayThumbnailUrl = isVideoFile ? thumbnailUrl : null;

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    let active = true;

    if (!isVideoFile) {
      return () => {
        active = false;
      };
    }

    createVideoThumbnail(file).then((thumbnail) => {
      if (active) {
        setThumbnailUrl(thumbnail);
      }
    });

    return () => {
      active = false;
    };
  }, [file, isVideoFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const result = await upload(file, {
      contentText,
      tags,
      visibility,
      ...(trimRange != null && trimRange.endMs > trimRange.startMs
        ? { trimStartMs: trimRange.startMs, trimEndMs: trimRange.endMs }
        : {}),
    });
    if (result) navigate(routes.postDetails(result.id));
  };

  if (post) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="soft" tone="success">
            {t('upload.ready')}
          </Badge>
          <p className="font-medium text-text-primary">{t('upload.postCreated')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="solid"
            tone="accent"
            onClick={() => navigate(routes.postDetails(post.id))}
          >
            {t('upload.viewPost')}
          </Button>
          <Button variant="outline" tone="neutral" onClick={() => navigate(routes.record)}>
            {t('upload.recordAnother')}
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="soft" tone="danger">
            {t('upload.issue')}
          </Badge>
          <p className="font-medium text-text-primary">{t('upload.uploadFailed')}</p>
        </div>
        {error && <ErrorMessage message={error} />}
        <div className="flex flex-wrap gap-2">
          <Button variant="solid" tone="accent" onClick={() => reset()}>
            {t('common.retry')}
          </Button>
          {onBack && (
            <Button variant="outline" tone="neutral" onClick={onBack}>
              {t('upload.backToRecording')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="space-y-4">
        <p className="font-medium text-text-primary">{t('upload.uploadCancelled')}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="solid" tone="accent" onClick={() => reset()}>
            {t('upload.startUpload')}
          </Button>
          {onBack && (
            <Button variant="outline" tone="neutral" onClick={onBack}>
              {t('upload.backToRecording')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-muted shadow-xs">
        {displayThumbnailUrl ? (
          <img
            src={displayThumbnailUrl}
            alt={t('upload.thumbnailAlt')}
            className="aspect-video w-full object-cover"
          />
        ) : isVideoFile ? (
          <video src={previewUrl} muted playsInline className="aspect-video w-full object-cover" />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-surface-elevated px-4 text-center text-sm text-text-secondary">
            {t('upload.audioReady')}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-border-soft px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">{file.name}</p>
            <p className="text-xs text-text-secondary">
              {displayThumbnailUrl ? t('upload.previewFirstFrame') : t('upload.preparingPreview')}
            </p>
          </div>
          <Badge variant="soft" tone={displayThumbnailUrl ? 'success' : 'neutral'}>
            {displayThumbnailUrl ? t('upload.thumbnailReady') : t('common.preview')}
          </Badge>
        </div>
      </div>

      <Input
        label={t('upload.description')}
        value={contentText}
        onChange={(e) => setContentText(e.target.value)}
        placeholder={t('upload.descriptionPlaceholder')}
        variant="filled"
        disabled={isBusy}
      />
      <Input
        label={t('upload.tags')}
        value={tagsStr}
        onChange={(e) => setTagsStr(e.target.value)}
        placeholder={t('upload.tagsPlaceholder')}
        variant="filled"
        disabled={isBusy}
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-secondary">
          {t('upload.visibility')}
        </label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(Number(e.target.value))}
          className={selectClass}
          disabled={isBusy}
        >
          <option value={0}>{t('common.public')}</option>
          <option value={1}>{t('common.unlisted')}</option>
        </select>
      </div>

      <UploadProgress status={status} progress={progress} />

      <p className="text-sm text-text-secondary">
        {t('upload.size')}: {(file.size / 1024).toFixed(1)} KB
      </p>
      {isFileTooLarge && (
        <p className="text-sm text-danger">{t('upload.fileTooLarge', { max: MAX_FILE_SIZE_GB })}</p>
      )}
      {error && <ErrorMessage message={error} />}

      <div className="flex flex-wrap gap-2">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            tone="neutral"
            onClick={() => {
              reset();
              onBack();
            }}
          >
            {t('common.back')}
          </Button>
        )}
        {isBusy && (
          <Button type="button" variant="outline" tone="neutral" onClick={cancelUpload}>
            {t('upload.cancelUpload')}
          </Button>
        )}
        <Button type="submit" variant="solid" tone="accent" disabled={isBusy || isFileTooLarge}>
          {isBusy ? t('upload.uploading') : t('upload.startUpload')}
        </Button>
      </div>
    </form>
  );
};
