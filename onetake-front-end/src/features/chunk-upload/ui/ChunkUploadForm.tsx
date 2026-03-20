import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, ErrorMessage, Badge } from '@/shared/ui';
import { routes } from '@/shared/config';
import type { TrimRange } from '@/features/recording-studio';
import { useChunkUpload } from '@/features/chunk-upload/useChunkUpload';
import { UploadProgress } from './UploadProgress';

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
  const navigate = useNavigate();
  const [contentText, setContentText] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [visibility, setVisibility] = useState<number>(0);

  const { status, progress, error, post, upload, reset, cancelUpload } = useChunkUpload();
  const isFileTooLarge = file.size > MAX_FILE_SIZE_BYTES;
  const isBusy = status === 'uploading' || status === 'finalizing';

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
          <Badge variant="soft" tone="success">Ready</Badge>
          <p className="font-medium text-text-primary">Post created</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="solid" tone="accent" onClick={() => navigate(routes.postDetails(post.id))}>
            View post
          </Button>
          <Button variant="outline" tone="neutral" onClick={() => navigate(routes.record)}>
            Record another
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="soft" tone="danger">Issue</Badge>
          <p className="font-medium text-text-primary">Upload failed</p>
        </div>
        {error && <ErrorMessage message={error} />}
        <div className="flex flex-wrap gap-2">
          <Button variant="solid" tone="accent" onClick={() => reset()}>
            Retry
          </Button>
          {onBack && (
            <Button variant="outline" tone="neutral" onClick={onBack}>
              Back to recording
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="space-y-4">
        <p className="font-medium text-text-primary">Upload cancelled</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="solid" tone="accent" onClick={() => reset()}>
            Start upload
          </Button>
          {onBack && (
            <Button variant="outline" tone="neutral" onClick={onBack}>
              Back to recording
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Description"
        value={contentText}
        onChange={(e) => setContentText(e.target.value)}
        placeholder="Content description"
        variant="filled"
        disabled={isBusy}
      />
      <Input
        label="Tags (comma-separated)"
        value={tagsStr}
        onChange={(e) => setTagsStr(e.target.value)}
        placeholder="tag1, tag2"
        variant="filled"
        disabled={isBusy}
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-secondary">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(Number(e.target.value))}
          className={selectClass}
          disabled={isBusy}
        >
          <option value={0}>Public</option>
          <option value={1}>Unlisted</option>
        </select>
      </div>

      <UploadProgress status={status} progress={progress} />

      <p className="text-sm text-text-secondary">
        File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
      </p>
      {isFileTooLarge && (
        <p className="text-sm text-danger">File too large (max {MAX_FILE_SIZE_GB} GB).</p>
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
            Back
          </Button>
        )}
        {isBusy && (
          <Button type="button" variant="outline" tone="neutral" onClick={cancelUpload}>
            Cancel upload
          </Button>
        )}
        <Button type="submit" variant="solid" tone="accent" disabled={isBusy || isFileTooLarge}>
          {isBusy ? 'Uploading...' : 'Start upload'}
        </Button>
      </div>
    </form>
  );
};
