import { Input } from '@/shared/ui';
import type { TrimRange } from '@/features/recording-studio/types';
import { useI18n } from '@/app/providers/i18n';

export interface TrimControlsProps {
  durationMs: number;
  value: TrimRange;
  onChange: (range: TrimRange) => void;
  disabled?: boolean;
}

export const TrimControls = ({ durationMs, value, onChange, disabled }: TrimControlsProps) => {
  const { t } = useI18n();
  const max = Math.max(0, durationMs);
  const start = Math.min(value.startMs, max - 100);
  const end = Math.min(Math.max(value.endMs, start + 100), max);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-secondary">
          {t('recording.trim')}
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <Input
          label={t('recording.trimStart')}
          type="number"
          min={0}
          max={max}
          value={start}
          onChange={(e) => onChange({ ...value, startMs: Number(e.target.value) })}
          disabled={disabled}
          variant="filled"
          size="sm"
          className="w-28"
        />
        <Input
          label={t('recording.trimEnd')}
          type="number"
          min={start}
          max={max}
          value={end}
          onChange={(e) => onChange({ ...value, endMs: Number(e.target.value) })}
          disabled={disabled}
          variant="filled"
          size="sm"
          className="w-28"
        />
      </div>
    </div>
  );
};
