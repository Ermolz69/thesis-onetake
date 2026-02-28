import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, ErrorMessage } from '@/shared/ui';
import { routes } from '@/shared/config';
import type { TrimRange } from '@/features/recording-studio';
import { useChunkUpload } from '@/features/chunk-upload/useChunkUpload';
import { UploadProgress } from './UploadProgress';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const MAX_FILE_SIZE_GB = 2;

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
        <p className="text-fg-primary font-medium">Post created</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate(routes.postDetails(post.id))}>
            View post
          </Button>
          <Button variant="outline" onClick={() => navigate(routes.record)}>
            Record another
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <p className="text-red-500 font-medium">Upload failed</p>
        {error && <ErrorMessage message={error} />}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => reset()}>
            Retry
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
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
        <p className="text-fg-primary font-medium">Upload cancelled</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => reset()}>
            Start upload
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to recording
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-fg-primary mb-1">Description</label>
        <Input
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          placeholder="Content description"
          disabled={status === 'uploading' || status === 'finalizing'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-fg-primary mb-1">
          Tags (comma-separated)
        </label>
        <Input
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="tag1, tag2"
          disabled={status === 'uploading' || status === 'finalizing'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-fg-primary mb-1">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(Number(e.target.value))}
          className="w-full px-3 py-2 rounded border border-border bg-bg-primary text-fg-primary"
          disabled={status === 'uploading' || status === 'finalizing'}
        >
          <option value={0}>Public</option>
          <option value={1}>Unlisted</option>
        </select>
      </div>
      <UploadProgress status={status} progress={progress} />
      <p className="text-sm text-fg-secondary">
        File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
      </p>
      {isFileTooLarge && (
        <p className="text-sm text-red-600">File too large (max {MAX_FILE_SIZE_GB} GB).</p>
      )}
      {error && <ErrorMessage message={error} />}
      <div className="flex gap-2">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onBack();
            }}
          >
            Back
          </Button>
        )}
        {(status === 'uploading' || status === 'finalizing') && (
          <Button type="button" variant="outline" onClick={cancelUpload}>
            Cancel upload
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={status === 'uploading' || status === 'finalizing' || isFileTooLarge}
        >
          {status === 'uploading' || status === 'finalizing' ? 'Uploading…' : 'Start upload'}
        </Button>
      </div>
    </form>
  );
};
