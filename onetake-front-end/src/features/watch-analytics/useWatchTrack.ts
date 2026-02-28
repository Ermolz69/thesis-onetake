import { useRef, useCallback } from 'react';
import { trackEvent } from '@/features/analytics-track';

export function useWatchTrack(postId: string) {
  const watchStartSent = useRef(false);
  const watchCompleteSent = useRef(false);

  const onPlay = useCallback(() => {
    if (watchStartSent.current) return;
    watchStartSent.current = true;
    trackEvent({
      eventName: 'watch_start',
      entityType: 'post',
      entityId: postId,
    }).catch(() => {});
  }, [postId]);

  const onTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (watchCompleteSent.current) return;
      const video = e.currentTarget;
      if (video.duration && video.currentTime / video.duration >= 0.9) {
        watchCompleteSent.current = true;
        trackEvent({
          eventName: 'watch_complete',
          entityType: 'post',
          entityId: postId,
          propsJson: JSON.stringify({ duration_sec: video.duration }),
        }).catch(() => {});
      }
    },
    [postId]
  );

  const onEnded = useCallback(() => {
    if (watchCompleteSent.current) return;
    watchCompleteSent.current = true;
    trackEvent({
      eventName: 'watch_complete',
      entityType: 'post',
      entityId: postId,
    }).catch(() => {});
  }, [postId]);

  return { onPlay, onTimeUpdate, onEnded };
}
