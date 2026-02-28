import { RecordingStudio } from '@/features/recording-studio';
import type { TrimRange } from '@/features/recording-studio';
import { cardClass } from '@/shared/ui/record-styles';

export interface RecordStepProps {
  onRecorded: (file: File, trimRange: TrimRange) => void;
}

export const RecordStep = ({ onRecorded }: RecordStepProps) => {
  return (
    <div className="mt-6 max-w-2xl">
      <div className={`${cardClass} p-6`}>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Record</h2>
        <RecordingStudio onRecorded={onRecorded} />
      </div>
    </div>
  );
};
