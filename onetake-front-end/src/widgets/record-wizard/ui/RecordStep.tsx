import { RecordingStudio } from '@/features/recording-studio';
import type { TrimRange } from '@/features/recording-studio';
import { recordWizardStepCard, recordWizardStepTitle } from './styles';

export interface RecordStepProps {
  onRecorded: (file: File, trimRange: TrimRange) => void;
}

export const RecordStep = ({ onRecorded }: RecordStepProps) => {
  return (
    <div className="mt-6 max-w-2xl">
      <div className={recordWizardStepCard}>
        <h2 className={recordWizardStepTitle}>Record</h2>
        <RecordingStudio onRecorded={onRecorded} />
      </div>
    </div>
  );
};
