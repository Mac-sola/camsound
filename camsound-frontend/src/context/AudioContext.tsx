import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { songsService } from '../services/api';

interface Song {
  _id: string;
  title: string;
  filePath?: string;
  fileUrl?: string;
  coverArt?: string;
  artistId?: { name?: string; _id?: string };
  genre?: string;
  plays?: number;
  duration?: string;
}

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  audioError: string | null;
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  seek: (percentage: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  nextSong: () => void;
  previousSong: () => void;
  isPlayerOpen: boolean;
  closePlayer: () => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [songQueue, setSongQueue] = useState<Song[]>([]);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();

    const handleTimeUpdate = () => {
      if (audioRef.current) setProgress(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    const handleError = () => {
      setIsPlaying(false);
      setAudioError('Unable to load or play audio track. Check network connection or media format.');
    };

    const audio = audioRef.current;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const getAudioSource = (url: string) => {
    return url || '';
  };

  const playSong = async (song: Song, queue?: Song[]) => {
    if (audioRef.current) {
      setAudioError(null);
      setIsPlayerOpen(true);
      if (queue?.length) setSongQueue(queue);
      else if (!songQueue.length) setSongQueue([song]);
      if (currentSong?._id === song._id) {
        togglePlay();
        return;
      }

      setCurrentSong(song);
      const source = getAudioSource(song.filePath || song.fileUrl || '');
      audioRef.current.src = source;
      audioRef.current.volume = isMuted ? 0 : volume;
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.error('Audio playback error:', err);
        setIsPlaying(false);
        setAudioError('Audio playback failed or was blocked by browser.');
      }

      try {
        await songsService.trackPlay(song._id);
      } catch {}

    }
  };

  const togglePlay = async () => {
    if (audioRef.current && currentSong) {
      setAudioError(null);
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.error('Playback toggle error:', err);
          setIsPlaying(false);
          setAudioError('Unable to resume playback.');
        }
      }
    }
  };

  const seek = (percentage: number) => {
    if (audioRef.current && duration) {
      const time = (percentage / 100) * duration;
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skipForward = () => {
    if (audioRef.current && duration) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
    }
  };

  const nextSong = () => {
    if (!currentSong || !songQueue.length) return;
    const currentIndex = songQueue.findIndex(song => song._id === currentSong._id);
    const next = songQueue[currentIndex + 1];
    if (next) playSong(next, songQueue);
  };

  const previousSong = () => {
    if (!currentSong || !songQueue.length) return;
    const currentIndex = songQueue.findIndex(song => song._id === currentSong._id);
    const previous = songQueue[currentIndex - 1];
    if (previous) playSong(previous, songQueue);
  };

  const closePlayer = () => setIsPlayerOpen(false);

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : v;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (e.code === 'Space' && !isInput) {
        e.preventDefault(); // prevent scrolling and default button triggers
        if (target.tagName === 'BUTTON') {
          target.blur(); // remove focus from buttons so space doesn't click them
        }
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  return (
    <AudioContext.Provider value={{ currentSong, isPlaying, progress, duration, audioError, playSong, togglePlay, seek, skipForward, skipBackward, nextSong, previousSong, isPlayerOpen, closePlayer, volume, setVolume, isMuted, toggleMute }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
