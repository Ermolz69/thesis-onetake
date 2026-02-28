import { useState, useCallback, useRef, useEffect } from 'react';
import { trackEvent } from '@/features/analytics-track';
import { pickRecorderMimeType } from './recordingUtils';
import type { RecordingMode, RecordingState } from './types';

export const MAX_RECORDING_DURATION_MS = 30 * 60 * 1000; // 30 minutes
export const RECORDING_WARNING_BEFORE_MS = 2 * 60 * 1000; // warn 2 min before limit

export interface StartRecordingOptions {
  videoDeviceId?: string;
  audioDeviceId?: string;
}

export interface UseRecordingReturn {
  state: RecordingState;
  error: string | null;
  recordedBlob: Blob | null;
  recordedFile: File | null;
  stream: MediaStream | null;
  startRecording: (mode: RecordingMode, options?: StartRecordingOptions) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  durationMs: number;
  liveDurationMs: number;
  isNearDurationLimit: boolean;
  isAtDurationLimit: boolean;
}

export function useRecording(): UseRecordingReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [liveDurationMs, setLiveDurationMs] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  useEffect(() => {
    if (state !== 'recording' && state !== 'paused') {
      setLiveDurationMs(0);
      return;
    }
    const interval = setInterval(() => {
      const elapsed =
        elapsedBeforePauseRef.current +
        (state === 'recording' ? Date.now() - startTimeRef.current : 0);
      setLiveDurationMs(elapsed);
      if (elapsed >= MAX_RECORDING_DURATION_MS && recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
        recorderRef.current = null;
        setState('stopped');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(
    async (mode: RecordingMode, options?: StartRecordingOptions) => {
      setError(null);
      chunksRef.current = [];
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
      const videoConstraint = options?.videoDeviceId
        ? ({ deviceId: { exact: options.videoDeviceId } } as const)
        : true;
      const audioConstraint = options?.audioDeviceId
        ? ({ deviceId: { exact: options.audioDeviceId } } as const)
        : true;
      try {
        let stream: MediaStream;
        if (mode === 'screen') {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } else if (mode === 'camera') {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraint,
            audio: audioConstraint,
          });
        } else {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraint,
            audio: audioConstraint,
          });
          const tracks = [...screenStream.getVideoTracks(), ...cameraStream.getAudioTracks()];
          if (cameraStream.getVideoTracks().length) tracks.push(cameraStream.getVideoTracks()[0]);
          stream = new MediaStream(tracks);
        }
        let mimeType = pickRecorderMimeType();
        let recorder: MediaRecorder;
        try {
          if (mimeType) {
            recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
          } else {
            recorder = new MediaRecorder(stream, { videoBitsPerSecond: 2500000 });
            mimeType = recorder.mimeType || 'video/webm';
          }
        } catch {
          stream.getTracks().forEach((t) => t.stop());
          setError('Your browser does not support recording. Try Chrome or Edge.');
          setState('idle');
          return;
        }
        streamRef.current = stream;
        setStream(stream);
        trackEvent({ eventName: 'record_start' }).catch(() => {});
        recorderRef.current = recorder;
        const extension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
        const finalMimeType = mimeType;
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          stopStream();
          setStream(null);
          const extra = recorder.state === 'recording' ? Date.now() - startTimeRef.current : 0;
          const totalMs = elapsedBeforePauseRef.current + extra;
          trackEvent({
            eventName: 'record_stop',
            propsJson: JSON.stringify({ duration_ms: totalMs }),
          }).catch(() => {});
          const blob = new Blob(chunksRef.current, { type: finalMimeType });
          setRecordedBlob(blob);
          const file = new File([blob], `recording-${Date.now()}.${extension}`, {
            type: finalMimeType,
          });
          setRecordedFile(file);
          setDurationMs(totalMs);
        };
        recorder.start(1000);
        setState('recording');
      } catch (err) {
        const msg =
          err instanceof DOMException
            ? err.name === 'NotAllowedError'
              ? 'Permission needed. Please allow camera/screen access and try again.'
              : err.name === 'NotFoundError'
                ? 'No camera or microphone detected. Try connecting a device or use Screen only.'
                : err.message
            : err instanceof Error
              ? err.message
              : 'Failed to start recording';
        setError(msg);
        setState('idle');
      }
    },
    [stopStream]
  );

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording' || recorderRef.current?.state === 'paused') {
      if (recorderRef.current.state === 'paused') {
        elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      } else {
        elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      }
      recorderRef.current.stop();
      recorderRef.current = null;
      setState('stopped');
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      recorderRef.current.pause();
      setState('paused');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current?.state === 'paused') {
      startTimeRef.current = Date.now();
      recorderRef.current.resume();
      setState('recording');
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording' || recorderRef.current?.state === 'paused') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    stopStream();
    setStream(null);
    setRecordedBlob(null);
    setRecordedFile(null);
    setState('idle');
    setError(null);
    setDurationMs(0);
    chunksRef.current = [];
  }, [stopStream]);

  const isNearDurationLimit =
    (state === 'recording' || state === 'paused') &&
    liveDurationMs >= MAX_RECORDING_DURATION_MS - RECORDING_WARNING_BEFORE_MS;
  const isAtDurationLimit =
    (state === 'recording' || state === 'paused') && liveDurationMs >= MAX_RECORDING_DURATION_MS;

  return {
    state,
    error,
    recordedBlob,
    recordedFile,
    stream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    durationMs,
    liveDurationMs,
    isNearDurationLimit,
    isAtDurationLimit,
  };
}
