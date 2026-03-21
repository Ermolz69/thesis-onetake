import { Button } from '@/shared/ui';
import type { RecordingState } from '@/features/recording-studio/types';
import { useI18n } from '@/app/providers/i18n';

export interface RecordingControlsProps {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  startDisabled?: boolean;
}

export const RecordingControls = ({
  state,
  onStart,
  onStop,
  onPause,
  onResume,
  startDisabled,
}: RecordingControlsProps) => {
  const { t } = useI18n();
  if (state === 'idle') {
    return (
      <Button variant="primary" onClick={onStart} disabled={startDisabled}>
        {t('recording.startRecording')}
      </Button>
    );
  }
  if (state === 'recording') {
    return (
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPause}>
          {t('recording.pause')}
        </Button>
        <Button variant="primary" onClick={onStop}>
          {t('recording.stop')}
        </Button>
      </div>
    );
  }
  if (state === 'paused') {
    return (
      <div className="flex gap-2">
        <Button variant="primary" onClick={onResume}>
          {t('recording.resume')}
        </Button>
        <Button variant="outline" onClick={onStop}>
          {t('recording.stop')}
        </Button>
      </div>
    );
  }
  return null;
};
