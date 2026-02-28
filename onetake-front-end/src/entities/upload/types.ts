export interface InitUploadRequest {
  fileName: string;
  contentType: string;
  totalSize: number;
  contentText?: string;
  tags?: string[];
}

export interface InitUploadResponse {
  uploadId: string;
  chunkSize: number;
}

export interface UploadStatusResponse {
  uploadId: string;
  totalParts: number;
  uploadedPartIndices: number[];
}

export interface FinalizeUploadRequest {
  contentText?: string;
  tags?: string[];
  visibility?: number;
  trimStartMs?: number;
  trimEndMs?: number;
}
