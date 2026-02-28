import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui';
import { previewBlockClass } from '@/shared/ui/record-styles';
import type { RecordingState } from '@/features/recording-studio/types';

export interface RecordingPreviewProps {
  state: RecordingState;
  stream: MediaStream | null;
  recordedBlob: Blob | null;
  onRetake: () => void;
}

export const RecordingPreview = ({
  state,
  stream,
  recordedBlob,
  onRetake,
}: RecordingPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.muted = true;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    if (recordedBlob && state === 'stopped') {
      const url = URL.createObjectURL(recordedBlob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [recordedBlob, state]);

  const showLive = (state === 'recording' || state === 'paused') && stream;
  const showRecorded = state === 'stopped' && objectUrl;
  const showPlaceholder = !showLive && !showRecorded;

  return (
    <div className="space-y-2">
      <div className={`relative w-full ${previewBlockClass}`}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-contain ${showLive ? 'block' : 'hidden'}`}
          aria-hidden={!showLive}
        />
        <video
          src={objectUrl ?? undefined}
          controls
          className={`w-full h-full object-contain ${showRecorded ? 'block' : 'hidden'}`}
          aria-hidden={!showRecorded}
        />
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            Preview will appear here
          </div>
        )}
      </div>
      {state === 'stopped' && (
        <Button variant="outline" size="md" onClick={onRetake}>
          Retake
        </Button>
      )}
    </div>
  );
};
