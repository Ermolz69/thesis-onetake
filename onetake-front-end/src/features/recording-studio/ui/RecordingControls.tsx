import { Button } from '@/shared/ui';
import type { RecordingState } from '@/features/recording-studio/types';

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
  if (state === 'idle') {
    return (
      <Button variant="primary" onClick={onStart} disabled={startDisabled}>
        Start recording
      </Button>
    );
  }
  if (state === 'recording') {
    return (
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPause}>
          Pause
        </Button>
        <Button variant="primary" onClick={onStop}>
          Stop
        </Button>
      </div>
    );
  }
  if (state === 'paused') {
    return (
      <div className="flex gap-2">
        <Button variant="primary" onClick={onResume}>
          Resume
        </Button>
        <Button variant="outline" onClick={onStop}>
          Stop
        </Button>
      </div>
    );
  }
  return null;
};
