import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, ErrorMessage } from '@/shared/ui';
import { useDevices } from '@/features/recording-studio/useDevices';
import type { RecordingMode } from '@/features/recording-studio';

const COUNTDOWN_SEC = 3;

export type RecordControlsMessageFromPopup =
  | { type: 'start'; videoDeviceId?: string; audioDeviceId?: string }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' };

export type RecordControlsMessageFromMain =
  | { type: 'state'; state: string; liveDurationMs: number }
  | { type: 'error'; message: string };

function parseMode(mode: string | null): RecordingMode {
  if (mode === 'screen' || mode === 'camera' || mode === 'screen+camera') return mode;
  return 'camera';
}

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const RecordControlsPage = () => {
  const [searchParams] = useSearchParams();
  const mode = parseMode(searchParams.get('mode'));
  const { videoDevices, audioDevices, loading, error: devicesError } = useDevices();

  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [remoteState, setRemoteState] = useState<string>('idle');
  const [liveDurationMs, setLiveDurationMs] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (videoDevices.length && !videoDeviceId) setVideoDeviceId(videoDevices[0].deviceId);
    if (audioDevices.length && !audioDeviceId) setAudioDeviceId(audioDevices[0].deviceId);
  }, [videoDevices, audioDevices, videoDeviceId, audioDeviceId]);

  useEffect(() => {
    const handler = (event: MessageEvent<RecordControlsMessageFromMain>) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || !('type' in data)) return;
      if (data.type === 'state') {
        setRemoteState(data.state);
        setLiveDurationMs(data.liveDurationMs ?? 0);
      }
      if (data.type === 'error') {
        setRemoteState('idle');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const send = (msg: RecordControlsMessageFromPopup) => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(msg, window.location.origin);
    }
  };

  const handleStart = () => {
    if (!window.opener || window.opener.closed) return;
    setCountdown(COUNTDOWN_SEC);
    let n = COUNTDOWN_SEC;
    countdownRef.current = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        send({
          type: 'start',
          videoDeviceId: videoDeviceId || undefined,
          audioDeviceId: audioDeviceId || undefined,
        });
      }
    }, 1000);
  };

  const handlePause = () => send({ type: 'pause' });
  const handleResume = () => send({ type: 'resume' });
  const handleStop = () => send({ type: 'stop' });

  const isIdle = remoteState === 'idle' && countdown === null;
  const isCountdown = countdown !== null;
  const isRecording = remoteState === 'recording' || remoteState === 'paused';

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <h2 className="text-lg font-semibold mb-4">Recording panel</h2>

      {devicesError && <ErrorMessage message={devicesError} className="mb-2" />}

      {mode !== 'screen' && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Camera</label>
          <select
            value={videoDeviceId}
            onChange={(e) => setVideoDeviceId(e.target.value)}
            disabled={!isIdle || loading}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {videoDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-600 mb-1">Microphone</label>
        <select
          value={audioDeviceId}
          onChange={(e) => setAudioDeviceId(e.target.value)}
          disabled={!isIdle || loading}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
        >
          {audioDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {isCountdown && (
          <p className="text-center text-2xl font-bold text-slate-700">{countdown}</p>
        )}
        {isIdle && !isCountdown && (
          <Button variant="primary" onClick={handleStart} disabled={loading}>
            Start (3…2…1)
          </Button>
        )}
        {isRecording && (
          <>
            <p className="text-sm font-medium">{formatMs(liveDurationMs)}</p>
            <div className="flex gap-2">
              {remoteState === 'paused' ? (
                <Button variant="primary" size="md" onClick={handleResume}>
                  Resume
                </Button>
              ) : (
                <Button variant="outline" size="md" onClick={handlePause}>
                  Pause
                </Button>
              )}
              <Button variant="primary" size="md" onClick={handleStop}>
                Stop
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
