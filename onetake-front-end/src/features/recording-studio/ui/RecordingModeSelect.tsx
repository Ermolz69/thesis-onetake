import { Button } from '@/shared/ui';
import type { RecordingMode } from '@/features/recording-studio/types';

export interface RecordingModeSelectProps {
  value: RecordingMode | null;
  onChange: (mode: RecordingMode) => void;
  disabled?: boolean;
}

const MODES: { value: RecordingMode; label: string }[] = [
  { value: 'screen', label: 'Screen' },
  { value: 'camera', label: 'Camera' },
  { value: 'screen+camera', label: 'Screen + Camera' },
];

export const RecordingModeSelect = ({ value, onChange, disabled }: RecordingModeSelectProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map(({ value: mode, label }) => (
        <Button
          key={mode}
          variant={value === mode ? 'primary' : 'outline'}
          size="md"
          onClick={() => onChange(mode)}
          disabled={disabled}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};
