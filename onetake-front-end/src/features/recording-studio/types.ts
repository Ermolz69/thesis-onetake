export type RecordingMode = 'screen' | 'camera' | 'screen+camera';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface TrimRange {
  startMs: number;
  endMs: number;
}
