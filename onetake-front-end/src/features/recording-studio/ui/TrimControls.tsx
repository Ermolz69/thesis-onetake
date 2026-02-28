import type { TrimRange } from '@/features/recording-studio/types';

export interface TrimControlsProps {
  durationMs: number;
  value: TrimRange;
  onChange: (range: TrimRange) => void;
  disabled?: boolean;
}

export const TrimControls = ({ durationMs, value, onChange, disabled }: TrimControlsProps) => {
  const max = Math.max(0, durationMs);
  const start = Math.min(value.startMs, max - 100);
  const end = Math.min(Math.max(value.endMs, start + 100), max);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-fg-primary">Trim (v1)</label>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-secondary">Start (ms)</span>
          <input
            type="number"
            min={0}
            max={max}
            value={start}
            onChange={(e) => onChange({ ...value, startMs: Number(e.target.value) })}
            disabled={disabled}
            className="w-24 px-2 py-1 rounded border border-border bg-bg-primary text-fg-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-secondary">End (ms)</span>
          <input
            type="number"
            min={start}
            max={max}
            value={end}
            onChange={(e) => onChange({ ...value, endMs: Number(e.target.value) })}
            disabled={disabled}
            className="w-24 px-2 py-1 rounded border border-border bg-bg-primary text-fg-primary"
          />
        </div>
      </div>
    </div>
  );
};
