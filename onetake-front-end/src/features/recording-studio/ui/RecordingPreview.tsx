import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, VideoPlayer } from '@/shared/ui';
import { mediaFrame } from '@/shared/ui/recipes';
import type { RecordingState } from '@/features/recording-studio/types';
import { createVideoThumbnail } from '@/shared/lib/video-thumbnail';

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
  const objectUrl = useMemo(
    () => (recordedBlob && state === 'stopped' ? URL.createObjectURL(recordedBlob) : null),
    [recordedBlob, state]
  );
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

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
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    let active = true;

    if (!recordedBlob || state !== 'stopped') {
      return () => {
        active = false;
      };
    }

    createVideoThumbnail(recordedBlob).then((thumbnail) => {
      if (active) {
        setPosterUrl(thumbnail);
      }
    });

    return () => {
      active = false;
    };
  }, [recordedBlob, state]);

  const showLive = (state === 'recording' || state === 'paused') && stream;
  const showRecorded = state === 'stopped' && objectUrl;
  const showPlaceholder = !showLive && !showRecorded;
  const displayPosterUrl = showRecorded ? posterUrl : null;

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full ${mediaFrame} flex items-center justify-center rounded-2xl border border-border-soft`}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-contain ${showLive ? 'block' : 'hidden'}`}
          aria-hidden={!showLive}
        />
        {showRecorded && objectUrl && (
          <VideoPlayer
            src={objectUrl}
            poster={displayPosterUrl ?? undefined}
            className="h-full w-full"
          />
        )}
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted">
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
