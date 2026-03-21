import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  onPlay?: () => void;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: () => void;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const totalSeconds = Math.floor(sec);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const buttonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-pill border border-border-soft/70 bg-[var(--player-control-bg)] text-text-inverse transition hover:border-border-strong hover:bg-surface-card/20 focus-visible:outline-none focus-visible:[box-shadow:var(--input-ring)]';
const COMPACT_BREAKPOINT = 520;
const IDLE_HIDE_DELAY_MS = 1800;

function PlayIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m16.5 12 2.5 2.5-1.4 1.4-2.5-2.5-2.5 2.5-1.4-1.4 2.5-2.5-2.5-2.5 1.4-1.4 2.5 2.5 2.5-2.5 1.4 1.4zM4 9h4l5-4v14l-5-4H4z" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4zm11.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05A4.47 4.47 0 0 0 15.5 12zm-2.5-8.77v2.06a7 7 0 0 1 0 13.42v2.06C17.01 19.86 20 16.28 20 12s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  return active ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 16H5v3h3zm0-8H5v3h3zm8 8v3h3v-3zm0-8v3h3V8z" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zm-3-12v2h3v3h2V5z" />
    </svg>
  );
}

function VideoPlayerInner({
  src,
  poster,
  className = '',
  controls = true,
  onPlay,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  const progressValue = duration > 0 ? (currentTime / duration) * 100 : 0;
  const durationLabel = useMemo(() => formatTime(duration), [duration]);
  const currentTimeLabel = useMemo(() => formatTime(currentTime), [currentTime]);
  const showOverlay = showControls || !isPlaying || isEnded || isBuffering || isFocused;

  const clearHideControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current !== null) {
      window.clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    if (typeof window === 'undefined') return;
    clearHideControlsTimer();
    hideControlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, IDLE_HIDE_DELAY_MS);
  }, [clearHideControlsTimer]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (isPlaying && !isEnded && !isBuffering && !isHovering && !isFocused) {
      scheduleHideControls();
    } else {
      clearHideControlsTimer();
    }
  }, [
    clearHideControlsTimer,
    isBuffering,
    isEnded,
    isFocused,
    isHovering,
    isPlaying,
    scheduleHideControls,
  ]);

  const syncTime = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, []);

  const syncVolume = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setMuted(video.muted);
    setVolume(video.volume);
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsEnded(false);
        setError(null);
        revealControls();
        onPlay?.();
      })
      .catch(() => {
        setError('Playback failed. Try interacting with the video again.');
      });
  }, [onPlay, revealControls]);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      play();
    } else {
      pause();
    }
  }, [pause, play]);

  const toggleMuted = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    syncVolume();
  }, [syncVolume]);

  const handleVolumeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const nextVolume = Number(event.target.value);
      video.volume = nextVolume;
      video.muted = nextVolume === 0;
      syncVolume();
    },
    [syncVolume]
  );

  const handleProgressChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const nextValue = Number(event.target.value);
      const nextTime = (nextValue / 100) * duration;
      video.currentTime = nextTime;
      setCurrentTime(nextTime);
      setIsEnded(false);
    },
    [duration]
  );

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement === container) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      return;
    }
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {});
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setIsEnded(true);
    setCurrentTime(duration);
    setShowControls(true);
    onEnded?.();
  }, [duration, onEnded]);

  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setCurrentTime(0);
    setIsEnded(false);
    revealControls();
    play();
  }, [play, revealControls]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === ' ' || event.key.toLowerCase() === 'k') {
        event.preventDefault();
        togglePlay();
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
        syncTime();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        syncTime();
        return;
      }

      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        toggleMuted();
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
      }
    },
    [syncTime, toggleFullscreen, toggleMuted, togglePlay]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      syncTime();
      syncVolume();
    };

    const handleTimeUpdate = () => {
      syncTime();
      onTimeUpdate?.({ currentTarget: video } as React.SyntheticEvent<HTMLVideoElement>);
    };

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      setIsEnded(false);
      setError(null);
      revealControls();
    };

    const handlePauseEvent = () => {
      if (!video.ended) {
        setIsPlaying(false);
        setShowControls(true);
      }
    };

    const handleWaiting = () => {
      setIsBuffering(true);
      setShowControls(true);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
      revealControls();
    };
    const handleError = () => {
      setError('Unable to load this video.');
      setShowControls(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePauseEvent);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('volumechange', syncVolume);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePauseEvent);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('volumechange', syncVolume);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [handleEnded, onTimeUpdate, revealControls, syncTime, syncVolume]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setIsCompact(entry.contentRect.width <= COMPACT_BREAKPOINT);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isPlaying || isEnded || isBuffering || isHovering || isFocused) {
      clearHideControlsTimer();
      return;
    }

    scheduleHideControls();
    return clearHideControlsTimer;
  }, [
    clearHideControlsTimer,
    isBuffering,
    isEnded,
    isFocused,
    isHovering,
    isPlaying,
    scheduleHideControls,
  ]);

  useEffect(() => clearHideControlsTimer, [clearHideControlsTimer]);

  if (!controls) {
    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={`h-full w-full object-contain ${className}`}
        playsInline
        muted
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-2xl border border-border-soft bg-surface-inverse text-text-inverse shadow-md ${className}`}
      onMouseEnter={() => {
        setIsHovering(true);
        revealControls();
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onKeyDown={handleKeyDown}
      onFocusCapture={() => {
        setIsFocused(true);
        revealControls();
      }}
      onBlurCapture={() => {
        setIsFocused(false);
      }}
      tabIndex={0}
      role="application"
      aria-label="Video player"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="h-full w-full object-contain"
        playsInline
        muted={muted}
        onClick={togglePlay}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-overlay/20 via-transparent to-overlay/20" />

      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={isEnded ? handleReplay : togglePlay}
            className={`pointer-events-auto inline-flex items-center justify-center rounded-pill border border-border-soft/70 bg-surface-card/15 text-text-inverse shadow-md backdrop-blur-md transition hover:bg-surface-card/25 focus-visible:outline-none focus-visible:[box-shadow:var(--input-ring)] ${isCompact ? 'h-14 w-14' : 'h-20 w-20'}`}
            aria-label={isEnded ? 'Replay video' : isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying && !isEnded ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      )}

      {isBuffering && (
        <div className="absolute inset-x-0 top-4 flex justify-center">
          <div className="rounded-pill border border-border-soft/70 bg-surface-card/15 px-3 py-1 text-xs font-medium text-text-inverse backdrop-blur-md">
            Buffering...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 top-4 rounded-xl border border-danger/40 bg-surface-card/15 px-3 py-2 text-sm text-text-inverse backdrop-blur-md">
          {error}
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 transition duration-200 ${isCompact ? 'p-2' : 'p-3'} ${showOverlay ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{ background: 'var(--player-overlay)' }}
      >
        <div
          className={`rounded-2xl border border-border-soft/70 bg-surface-card/10 backdrop-blur-xl ${isCompact ? 'space-y-2 p-2' : 'space-y-3 p-3'}`}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={progressValue}
            onChange={handleProgressChange}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-pill bg-surface-card/25 accent-accent"
            aria-label="Seek video"
          />

          <div className={`flex items-center ${isCompact ? 'gap-2' : 'flex-wrap gap-3'}`}>
            <button
              type="button"
              onClick={isEnded ? handleReplay : togglePlay}
              className={`${buttonClass} ${isCompact ? 'h-9 w-9' : ''}`}
              aria-label={isEnded ? 'Replay video' : isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying && !isEnded ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className={`flex items-center ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
              <button
                type="button"
                onClick={toggleMuted}
                className={`${buttonClass} ${isCompact ? 'h-9 w-9' : ''}`}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                <VolumeIcon muted={muted} />
              </button>
              {!isCompact && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="h-1.5 w-20 cursor-pointer appearance-none rounded-pill bg-surface-card/25 accent-accent"
                  aria-label="Volume"
                />
              )}
            </div>

            <div
              className={`font-medium tabular-nums text-text-inverse/90 ${isCompact ? 'min-w-0 text-xs' : 'min-w-[92px] text-sm'}`}
            >
              {isCompact ? currentTimeLabel : `${currentTimeLabel} / ${durationLabel}`}
            </div>

            <div className={`ml-auto flex items-center ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
              {isEnded && !isCompact && (
                <span className="rounded-pill border border-border-soft/70 bg-surface-card/10 px-2.5 py-1 text-xs font-medium text-text-inverse/90">
                  Ended
                </span>
              )}
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`${buttonClass} ${isCompact ? 'h-9 w-9' : ''}`}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <FullscreenIcon active={isFullscreen} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const VideoPlayer = (props: VideoPlayerProps) => {
  return <VideoPlayerInner key={`${props.src}::${props.poster ?? ''}`} {...props} />;
};
