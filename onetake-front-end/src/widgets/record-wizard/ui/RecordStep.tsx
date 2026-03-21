import { RecordingStudio } from '@/features/recording-studio';
import type { TrimRange } from '@/features/recording-studio';
import { useI18n } from '@/app/providers/i18n';
import { recordWizardStepCard, recordWizardStepTitle } from './styles';

export interface RecordStepProps {
  onRecorded: (file: File, trimRange: TrimRange) => void;
}

export const RecordStep = ({ onRecorded }: RecordStepProps) => {
  const { t } = useI18n();
  return (
    <div className="mt-6 max-w-2xl">
      <div className={recordWizardStepCard}>
        <h2 className={recordWizardStepTitle}>{t('record.stepRecord')}</h2>
        <RecordingStudio onRecorded={onRecorded} />
      </div>
    </div>
  );
};
