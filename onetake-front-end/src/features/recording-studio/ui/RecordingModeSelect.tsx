import { Button } from '@/shared/ui';
import type { RecordingMode } from '@/features/recording-studio/types';
import { useI18n } from '@/app/providers/i18n';

export interface RecordingModeSelectProps {
  value: RecordingMode | null;
  onChange: (mode: RecordingMode) => void;
  disabled?: boolean;
}

export const RecordingModeSelect = ({ value, onChange, disabled }: RecordingModeSelectProps) => {
  const { t } = useI18n();
  const modes: { value: RecordingMode; label: string }[] = [
    { value: 'screen', label: t('recording.screen') },
    { value: 'camera', label: t('recording.camera') },
    { value: 'screen+camera', label: t('recording.screenCamera') },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {modes.map(({ value: mode, label }) => (
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
