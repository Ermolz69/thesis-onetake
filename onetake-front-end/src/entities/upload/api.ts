import { http } from '@/shared/api';
import { api } from '@/shared/config';
import type {
  InitUploadRequest,
  InitUploadResponse,
  UploadStatusResponse,
  FinalizeUploadRequest,
} from './types';
import type { Post } from '@/entities/post';

export const uploadApi = {
  init: async (payload: InitUploadRequest): Promise<InitUploadResponse> => {
    return http.post<InitUploadResponse>(api.endpoints.uploads.init, payload);
  },

  uploadPart: async (
    uploadId: string,
    partIndex: number,
    blob: Blob,
    config?: { signal?: AbortSignal }
  ): Promise<void> => {
    await http.put(api.endpoints.uploads.part(uploadId, partIndex), blob, {
      headers: { 'Content-Type': 'application/octet-stream' },
      signal: config?.signal,
    });
  },

  finalize: async (
    uploadId: string,
    body?: FinalizeUploadRequest,
    config?: { signal?: AbortSignal }
  ): Promise<Post> => {
    return http.post<Post>(api.endpoints.uploads.finalize(uploadId), body ?? {}, {
      signal: config?.signal,
    });
  },

  status: async (uploadId: string): Promise<UploadStatusResponse> => {
    return http.get<UploadStatusResponse>(api.endpoints.uploads.status(uploadId));
  },
};
