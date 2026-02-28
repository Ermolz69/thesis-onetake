import { useState } from 'react';
import { RecordStep } from './RecordStep';
import { UploadStep } from './UploadStep';
import type { TrimRange } from '@/features/recording-studio';

type Step = 'record' | 'upload';

export const RecordWizard = () => {
  const [step, setStep] = useState<Step>('record');
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [trimRange, setTrimRange] = useState<TrimRange | null>(null);

  const handleRecorded = (file: File, trim: TrimRange) => {
    setRecordedFile(file);
    setTrimRange(trim);
    setStep('upload');
  };

  const handleBack = () => {
    setStep('record');
    setRecordedFile(null);
    setTrimRange(null);
  };

  if (step === 'record') {
    return <RecordStep onRecorded={handleRecorded} />;
  }

  if (step === 'upload' && recordedFile) {
    return (
      <UploadStep file={recordedFile} trimRange={trimRange ?? undefined} onBack={handleBack} />
    );
  }

  return null;
};
