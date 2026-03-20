import { ChunkUploadForm } from '@/features/chunk-upload';
import type { TrimRange } from '@/features/recording-studio';
import { recordWizardStepCard, recordWizardStepTitle } from './styles';

export interface UploadStepProps {
  file: File;
  trimRange?: TrimRange;
  onBack?: () => void;
}

export const UploadStep = ({ file, trimRange, onBack }: UploadStepProps) => {
  return (
    <div className="mt-6 max-w-2xl">
      <div className={recordWizardStepCard}>
        <h2 className={recordWizardStepTitle}>Publish</h2>
        <ChunkUploadForm file={file} trimRange={trimRange} onBack={onBack} />
      </div>
    </div>
  );
};
