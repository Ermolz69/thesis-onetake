import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, ErrorMessage } from '@/shared/ui';
import { routes } from '@/shared/config';
import type { RecordControlsMessageFromPopup } from '@/pages/record-controls';
import { RecordingModeSelect } from './RecordingModeSelect';
import { RecordingPreview } from './RecordingPreview';
import { TrimControls } from './TrimControls';
import { useRecording } from '@/features/recording-studio/useRecording';
import type { RecordingMode, TrimRange } from '@/features/recording-studio/types';

export interface RecordingStudioProps {
  onRecorded?: (file: File, trimRange: TrimRange) => void;
}

const unsupportedMessage = "Your browser doesn't support in-browser recording. Try Chrome or Edge.";

export const RecordingStudio = ({ onRecorded }: RecordingStudioProps) => {
  const [mode, setMode] = useState<RecordingMode | null>(null);
  const [trimRange, setTrimRange] = useState<TrimRange>({ startMs: 0, endMs: 0 });

  const {
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
  } = useRecording();

  const popupRef = useRef<Window | null>(null);
  const stateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openControlsPopup = useCallback(() => {
    if (!mode || typeof window === 'undefined') return;
    const url = `${window.location.origin}${routes.recordControls}?mode=${encodeURIComponent(mode)}`;
    const w = window.open(url, 'recordControls', 'width=320,height=420,left=100,top=100');
    popupRef.current = w ?? null;
  }, [mode]);

  useEffect(() => {
    const handler = (event: MessageEvent<RecordControlsMessageFromPopup>) => {
      if (event.origin !== window.location.origin || event.source !== popupRef.current) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || !('type' in data)) return;
      if (data.type === 'start') {
        startRecording(mode!, {
          videoDeviceId: data.videoDeviceId,
          audioDeviceId: data.audioDeviceId,
        });
      }
      if (data.type === 'pause') pauseRecording();
      if (data.type === 'resume') resumeRecording();
      if (data.type === 'stop') stopRecording();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [mode, startRecording, pauseRecording, resumeRecording, stopRecording]);

  useEffect(() => {
    if (state !== 'recording' && state !== 'paused') {
      if (stateIntervalRef.current) {
        clearInterval(stateIntervalRef.current);
        stateIntervalRef.current = null;
      }
      return;
    }
    const sendState = () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.postMessage(
          { type: 'state', state, liveDurationMs },
          window.location.origin
        );
      }
    };
    sendState();
    stateIntervalRef.current = setInterval(sendState, 1000);
    return () => {
      if (stateIntervalRef.current) clearInterval(stateIntervalRef.current);
    };
  }, [state, liveDurationMs]);

  useEffect(() => {
    const checkClosed = setInterval(() => {
      if (popupRef.current?.closed) {
        popupRef.current = null;
        if (state === 'recording' || state === 'paused') stopRecording();
        if (stateIntervalRef.current) {
          clearInterval(stateIntervalRef.current);
          stateIntervalRef.current = null;
        }
        clearInterval(checkClosed);
      }
    }, 500);
    return () => clearInterval(checkClosed);
  }, [state, stopRecording]);

  useEffect(() => {
    if (error && popupRef.current && !popupRef.current.closed) {
      popupRef.current.postMessage({ type: 'error', message: error }, window.location.origin);
    }
  }, [error]);

  const handleUseRecording = useCallback(() => {
    if (recordedFile) {
      const range = { startMs: trimRange.startMs, endMs: trimRange.endMs || durationMs };
      onRecorded?.(recordedFile, range);
    }
  }, [recordedFile, trimRange, durationMs, onRecorded]);

  const trimEndMs = trimRange.endMs > 0 ? trimRange.endMs : durationMs;
  const isUnsupported = typeof window !== 'undefined' && !window.MediaRecorder;

  if (isUnsupported) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6 text-center">
        <p className="text-slate-700">{unsupportedMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Source</label>
        <RecordingModeSelect value={mode} onChange={setMode} disabled={state !== 'idle'} />
        <p className="mt-1 text-xs text-slate-500">
          Choose Screen, Camera or both, then click Start. Works only on HTTPS or localhost.
        </p>
      </div>

      <RecordingPreview
        state={state}
        stream={stream}
        recordedBlob={recordedBlob}
        onRetake={resetRecording}
      />

      <div className="flex items-center gap-2">
        {state === 'idle' && (
          <Button variant="primary" onClick={openControlsPopup} disabled={!mode}>
            Open recording panel
          </Button>
        )}
        {(state === 'recording' || state === 'paused') && (
          <span className="text-sm text-slate-600">
            Recording… {Math.floor(liveDurationMs / 60000)}:
            {Math.floor((liveDurationMs % 60000) / 1000)
              .toString()
              .padStart(2, '0')}{' '}
            (use panel to Pause/Stop)
          </span>
        )}
      </div>

      {isNearDurationLimit && (
        <p className="text-sm text-amber-600">
          Approaching 30 min limit. Recording will stop automatically at the limit.
        </p>
      )}

      {error && (
        <div>
          <ErrorMessage message={error} />
          <Button variant="outline" className="mt-2" onClick={resetRecording}>
            Try again
          </Button>
        </div>
      )}

      {state === 'stopped' && durationMs > 0 && (
        <>
          <TrimControls
            durationMs={durationMs}
            value={{ startMs: trimRange.startMs, endMs: trimEndMs }}
            onChange={setTrimRange}
          />
          <Button variant="primary" onClick={handleUseRecording}>
            Use recording & continue to upload
          </Button>
        </>
      )}
    </div>
  );
};
