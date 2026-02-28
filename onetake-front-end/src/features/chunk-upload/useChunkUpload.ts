import { useState, useCallback, useRef } from 'react';
import { uploadApi } from '@/entities/upload';
import { trackEvent } from '@/features/analytics-track';
import { HttpError } from '@/shared/api';
import type { ChunkUploadProgress, ChunkUploadStatus } from './types';
import type { Post } from '@/entities/post';

/** Max upload chunk size in bytes (5 MB). Keep in sync with backend. */
const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_RETRIES = 3;
const BACKOFF_MS = [300, 900, 1800];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface UseChunkUploadOptions {
  chunkSize?: number;
  onProgress?: (progress: ChunkUploadProgress) => void;
}

export interface UseChunkUploadReturn {
  uploadId: string | null;
  status: ChunkUploadStatus;
  progress: ChunkUploadProgress;
  error: string | null;
  post: Post | null;
  upload: (
    file: File,
    meta?: {
      contentText?: string;
      tags?: string[];
      visibility?: number;
      trimStartMs?: number;
      trimEndMs?: number;
    }
  ) => Promise<Post | null>;
  reset: () => void;
  cancelUpload: () => void;
}

export function useChunkUpload(options: UseChunkUploadOptions = {}): UseChunkUploadReturn {
  const chunkSize = options.chunkSize ?? CHUNK_SIZE;
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [status, setStatus] = useState<ChunkUploadStatus>('idle');
  const [progress, setProgress] = useState<ChunkUploadProgress>({
    uploadedParts: 0,
    totalParts: 0,
    percent: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('cancelled');
      setError(null);
    }
  }, []);

  const reportProgress = useCallback(
    (uploadedParts: number, totalParts: number) => {
      const percent = totalParts > 0 ? Math.round((uploadedParts / totalParts) * 100) : 0;
      const p: ChunkUploadProgress = { uploadedParts, totalParts, percent };
      setProgress(p);
      options.onProgress?.(p);
    },
    [options]
  );

  const upload = useCallback(
    async (
      file: File,
      meta?: {
        contentText?: string;
        tags?: string[];
        visibility?: number;
        trimStartMs?: number;
        trimEndMs?: number;
      }
    ): Promise<Post | null> => {
      setError(null);
      setStatus('uploading');
      const totalParts = Math.ceil(file.size / chunkSize);
      setProgress({ uploadedParts: 0, totalParts, percent: 0 });
      let currentUploadId: string | null = null;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      const isAborted = () => signal.aborted;
      const isNonRetryable = (e: unknown) => {
        if (e instanceof HttpError) {
          if (e.status === 401) return true;
          if (e.status === 413) {
            setError('File too large');
            return true;
          }
        }
        return false;
      };

      try {
        const initRes = await uploadApi.init({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          totalSize: file.size,
          contentText: meta?.contentText,
          tags: meta?.tags,
        });
        if (isAborted()) {
          setStatus('cancelled');
          return null;
        }
        const id = initRes.uploadId;
        currentUploadId = id;
        setUploadId(id);
        trackEvent({
          eventName: 'upload_init',
          propsJson: JSON.stringify({ upload_id: id, file_name: file.name, total_size: file.size }),
        }).catch(() => {});

        for (let partIndex = 0; partIndex < totalParts; partIndex++) {
          if (isAborted()) {
            setStatus('cancelled');
            return null;
          }
          const start = partIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const blob = file.slice(start, end);
          let lastErr: Error | null = null;
          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
              await uploadApi.uploadPart(id, partIndex, blob, { signal });
              if (isAborted()) {
                setStatus('cancelled');
                return null;
              }
              trackEvent({
                eventName: 'upload_part',
                propsJson: JSON.stringify({ part_index: partIndex, upload_id: id }),
              }).catch(() => {});
              reportProgress(partIndex + 1, totalParts);
              lastErr = null;
              break;
            } catch (e) {
              if (isAborted()) {
                setStatus('cancelled');
                return null;
              }
              if (isNonRetryable(e)) {
                setStatus('error');
                return null;
              }
              lastErr = e instanceof Error ? e : new Error(String(e));
              if (attempt < MAX_RETRIES - 1) {
                await delay(BACKOFF_MS[attempt] ?? 1800);
              }
            }
          }
          if (lastErr) {
            trackEvent({
              eventName: 'upload_failed',
              propsJson: JSON.stringify({ upload_id: id, reason: lastErr.message }),
            }).catch(() => {});
            setError(lastErr.message);
            setStatus('error');
            return null;
          }
        }

        if (isAborted()) {
          setStatus('cancelled');
          return null;
        }
        setStatus('finalizing');
        const finalPost = await uploadApi.finalize(
          id,
          {
            contentText: meta?.contentText,
            tags: meta?.tags,
            visibility: meta?.visibility,
            trimStartMs: meta?.trimStartMs,
            trimEndMs: meta?.trimEndMs,
          },
          { signal }
        );
        if (isAborted()) {
          setStatus('cancelled');
          return null;
        }
        trackEvent({
          eventName: 'upload_success',
          propsJson: JSON.stringify({ upload_id: id }),
        }).catch(() => {});
        setPost(finalPost);
        setStatus('done');
        return finalPost;
      } catch (e) {
        if (isAborted()) {
          setStatus('cancelled');
          return null;
        }
        if (e instanceof HttpError && e.status === 413) {
          setError('File too large');
          setStatus('error');
          return null;
        }
        const msg = e instanceof Error ? e.message : String(e);
        trackEvent({
          eventName: 'upload_failed',
          propsJson: JSON.stringify({ upload_id: currentUploadId, reason: msg }),
        }).catch(() => {});
        setError(msg);
        setStatus('error');
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [chunkSize, reportProgress]
  );

  const reset = useCallback(() => {
    setUploadId(null);
    setStatus('idle');
    setProgress({ uploadedParts: 0, totalParts: 0, percent: 0 });
    setError(null);
    setPost(null);
  }, []);

  return { uploadId, status, progress, error, post, upload, reset, cancelUpload };
}
