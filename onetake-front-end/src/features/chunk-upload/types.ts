export interface ChunkUploadProgress {
  uploadedParts: number;
  totalParts: number;
  percent: number;
}

export type ChunkUploadStatus =
  | 'idle'
  | 'uploading'
  | 'finalizing'
  | 'done'
  | 'error'
  | 'cancelled';
