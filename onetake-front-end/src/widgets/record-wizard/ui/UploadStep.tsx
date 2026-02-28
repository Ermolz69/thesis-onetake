import { ChunkUploadForm } from '@/features/chunk-upload';
import type { TrimRange } from '@/features/recording-studio';
import { cardClass } from '@/shared/ui/record-styles';

export interface UploadStepProps {
  file: File;
  trimRange?: TrimRange;
  onBack?: () => void;
}

export const UploadStep = ({ file, trimRange, onBack }: UploadStepProps) => {
  return (
    <div className="mt-6 max-w-2xl">
      <div className={`${cardClass} p-6`}>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Publish</h2>
        <ChunkUploadForm file={file} trimRange={trimRange} onBack={onBack} />
      </div>
    </div>
  );
};
