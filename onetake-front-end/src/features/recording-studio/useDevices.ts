import { useState, useEffect } from 'react';

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

export function useDevices(): {
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setError('Media devices not supported');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(
        devices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
            kind: d.kind as 'videoinput',
          }))
      );
      setAudioDevices(
        devices
          .filter((d) => d.kind === 'audioinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
            kind: d.kind as 'audioinput',
          }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to list devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { videoDevices, audioDevices, loading, error, refresh: load };
}
