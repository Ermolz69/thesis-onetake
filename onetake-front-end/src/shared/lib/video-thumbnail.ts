export async function createVideoThumbnail(
  source: Blob,
  seekTimeSeconds = 0.05
): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const objectUrl = URL.createObjectURL(source);

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    let settled = false;

    const cleanup = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    video.onerror = () => finish(null);

    video.onloadeddata = () => {
      const safeSeekTime =
        Number.isFinite(video.duration) && video.duration > seekTimeSeconds ? seekTimeSeconds : 0;

      if (safeSeekTime === 0) {
        captureFrame();
        return;
      }

      const handleSeeked = () => {
        video.removeEventListener('seeked', handleSeeked);
        captureFrame();
      };

      video.addEventListener('seeked', handleSeeked, { once: true });

      try {
        video.currentTime = safeSeekTime;
      } catch {
        video.removeEventListener('seeked', handleSeeked);
        captureFrame();
      }
    };

    const captureFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        finish(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      if (!context) {
        finish(null);
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      finish(canvas.toDataURL('image/jpeg', 0.82));
    };
  });
}
