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
  accessGranted: boolean;
  refresh: () => Promise<void>;
  requestAccess: (constraints?: { video?: boolean; audio?: boolean }) => Promise<void>;
} {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);

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
      setAccessGranted(devices.some((device) => Boolean(device.label)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to list devices');
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async (constraints?: { video?: boolean; audio?: boolean }) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Media devices not supported');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: constraints?.video ?? true,
        audio: constraints?.audio ?? true,
      });
      mediaStream.getTracks().forEach((track) => track.stop());
      setAccessGranted(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request device access');
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handleDeviceChange = () => {
      load().catch(() => {});
    };
    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange);
    };
  }, []);

  return {
    videoDevices,
    audioDevices,
    loading,
    error,
    accessGranted,
    refresh: load,
    requestAccess,
  };
}
