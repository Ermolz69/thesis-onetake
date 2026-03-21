import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Button, ErrorMessage, Card } from '@/shared/ui';
import { useDevices } from '@/features/recording-studio/useDevices';
import type { RecordingMode } from '@/features/recording-studio';
import { useI18n } from '@/app/providers/i18n';

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

const selectClass =
  'w-full rounded-xl border border-border-soft bg-surface-elevated px-3 py-2 text-text-primary focus:outline-none focus-visible:[box-shadow:var(--input-ring)]';

export const RecordControlsPage = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const mode = parseMode(searchParams.get('mode'));
  const {
    videoDevices,
    audioDevices,
    loading,
    error: devicesError,
    accessGranted,
    requestAccess,
    refresh,
  } = useDevices();

  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [remoteState, setRemoteState] = useState<string>('idle');
  const [liveDurationMs, setLiveDurationMs] = useState(0);
  const [showDevicePicker, setShowDevicePicker] = useState(true);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedVideoDeviceId = videoDeviceId || videoDevices[0]?.deviceId || '';
  const selectedAudioDeviceId = audioDeviceId || audioDevices[0]?.deviceId || '';

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
          videoDeviceId: selectedVideoDeviceId || undefined,
          audioDeviceId: selectedAudioDeviceId || undefined,
        });
      }
    }, 1000);
  };

  const handlePause = () => send({ type: 'pause' });
  const handleResume = () => send({ type: 'resume' });
  const handleStop = () => send({ type: 'stop' });
  const handleGrantAccess = async () => {
    await requestAccess({
      video: mode !== 'screen',
      audio: true,
    });
  };

  const isIdle = remoteState === 'idle' && countdown === null;
  const isCountdown = countdown !== null;
  const isRecording = remoteState === 'recording' || remoteState === 'paused';
  const canChooseCamera = mode !== 'screen' && videoDevices.length > 0;
  const canChooseMicrophone = audioDevices.length > 0;

  return (
    <div className="min-h-screen bg-surface-muted p-4 text-text-primary">
      <div className="mx-auto max-w-sm">
        <Card radius="xl" className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-primary">{t('recordControls.title')}</h2>
            <p className="text-sm text-text-secondary">{t('recordControls.subtitle')}</p>
          </div>

          {devicesError && <ErrorMessage message={devicesError} className="mb-2" />}

          <div className="rounded-2xl border border-border-soft bg-surface-muted/70 p-3 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {t('recordControls.inputSetup')}
                </p>
                <p className="text-xs text-text-secondary">{t('recordControls.inputSetupBody')}</p>
              </div>
              <Badge variant="soft" tone={accessGranted ? 'success' : 'neutral'}>
                {accessGranted ? t('recordControls.ready') : t('recordControls.accessNeeded')}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="soft"
                tone="accent"
                size="sm"
                onClick={handleGrantAccess}
                disabled={!isIdle || loading}
              >
                {accessGranted
                  ? t('recordControls.reconnectDevices')
                  : t('recordControls.grantAccess')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                tone="neutral"
                size="sm"
                onClick={() => refresh()}
                disabled={!isIdle || loading}
              >
                {t('recordControls.refreshList')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                tone="neutral"
                size="sm"
                onClick={() => setShowDevicePicker((value) => !value)}
                disabled={!isIdle}
              >
                {showDevicePicker
                  ? t('recordControls.hideInputs')
                  : t('recordControls.chooseMicrophone')}
              </Button>
            </div>

            {showDevicePicker && (
              <div className="mt-4 space-y-3">
                {mode !== 'screen' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-text-secondary">
                      {t('recordControls.camera')}
                    </label>
                    <select
                      value={selectedVideoDeviceId}
                      onChange={(e) => setVideoDeviceId(e.target.value)}
                      disabled={!isIdle || loading || !canChooseCamera}
                      className={selectClass}
                    >
                      {canChooseCamera ? (
                        videoDevices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label}
                          </option>
                        ))
                      ) : (
                        <option value="">{t('recordControls.noCameras')}</option>
                      )}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-text-secondary">
                    {t('recordControls.microphone')}
                  </label>
                  <select
                    value={selectedAudioDeviceId}
                    onChange={(e) => setAudioDeviceId(e.target.value)}
                    disabled={!isIdle || loading || !canChooseMicrophone}
                    className={selectClass}
                  >
                    {canChooseMicrophone ? (
                      audioDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </option>
                      ))
                    ) : (
                      <option value="">{t('recordControls.noMicrophones')}</option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {isCountdown && (
              <p className="text-center text-3xl font-semibold text-text-primary">{countdown}</p>
            )}
            {isIdle && !isCountdown && (
              <Button
                variant="solid"
                tone="accent"
                onClick={handleStart}
                disabled={loading || !accessGranted || !canChooseMicrophone}
              >
                {t('recordControls.startCountdown')}
              </Button>
            )}
            {isRecording && (
              <>
                <div className="rounded-xl bg-surface-muted px-3 py-2 text-sm font-medium text-text-primary">
                  {formatMs(liveDurationMs)}
                </div>
                <div className="flex gap-2">
                  {remoteState === 'paused' ? (
                    <Button variant="solid" tone="accent" size="md" onClick={handleResume}>
                      {t('recording.resume')}
                    </Button>
                  ) : (
                    <Button variant="outline" tone="neutral" size="md" onClick={handlePause}>
                      {t('recording.pause')}
                    </Button>
                  )}
                  <Button variant="solid" tone="danger" size="md" onClick={handleStop}>
                    {t('recording.stop')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
