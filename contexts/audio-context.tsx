"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

interface AudioContextType {
  playSound: (soundName: string) => void;
  toggleMusic: () => void;
  isMusicPlaying: boolean;
  setVolume: (volume: number) => void;
  volume: number;
  setMusicVolume: (volume: number) => void;
  musicVolume: number;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("isMusicPlaying");
      return stored === null ? true : stored === "true";
    }
    return false;
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      //const stored = localStorage.getItem("soundVolume");
      //return stored === null ? 0.5 : parseFloat(stored);
    }
    return 0.1;
  });
  const [musicVolume, setMusicVolume] = useState(() => {
    if (typeof window !== "undefined") {
      // const stored = localStorage.getItem("musicVolume");
      // return stored === null ? 0.02 : parseFloat(stored);
    }
    return 0.02;
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("isSoundEnabled");
      return stored === null ? true : stored === "true";
    }
    return true;
  });
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!musicRef.current) {
      musicRef.current = new Audio("/sounds/background-music.mp3");
      musicRef.current.loop = true;
      musicRef.current.volume = 0.03;
    }
  }, []);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        startBackgroundMusic();
        setHasInteracted(true);
        document.removeEventListener("click", handleFirstInteraction);
        document.removeEventListener("touchstart", handleFirstInteraction);
      }
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [hasInteracted]);

  const initAudio = () => {
    audioRefs.current = {
      wordSubmitted: new Audio("/sounds/word-submitted.mp3"),
      wordNotValid: new Audio("/sounds/word-not-valid.mp3"),
      letterPlaced: new Audio("/sounds/letter-placed.mp3"),
      letterRemoved: new Audio("/sounds/letter-removed.mp3"),
      shuffleLetters: new Audio("/sounds/shuffle-letters.mp3"),
    };
  };

  const playSound = (soundName: string) => {
    if (!isSoundEnabled) return;

    if (!audioRefs.current[soundName]) {
      initAudio();
    }

    // Create a new audio element for each play
    const audio = new Audio(audioRefs.current[soundName].src);
    audio.volume = volume;
    audio.play().catch(console.error);
  };

  const toggleMusic = () => {
    if (!musicRef.current) {
      musicRef.current = new Audio("/sounds/background-music.mp3");
      musicRef.current.loop = true;
    }

    const newValue = !isMusicPlaying;
    if (newValue) {
      musicRef.current.volume = musicVolume;
      musicRef.current.play().catch(console.error);
    } else {
      musicRef.current.pause();
    }
    setIsMusicPlaying(newValue);
    localStorage.setItem("isMusicPlaying", newValue.toString());
  };

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem("soundVolume", newVolume.toString());
    requestAnimationFrame(() => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.volume = newVolume;
      });
    });
  };

  const updateMusicVolume = (newVolume: number) => {
    setMusicVolume(newVolume);
    localStorage.setItem("musicVolume", newVolume.toString());
    if (musicRef.current) {
      musicRef.current.volume = newVolume;
    }
  };

  const toggleSound = () => {
    const newValue = !isSoundEnabled;
    setIsSoundEnabled(newValue);
    localStorage.setItem("isSoundEnabled", newValue.toString());
  };

  const startBackgroundMusic = () => {
    if (musicRef.current && isMusicPlaying) {
      musicRef.current.volume = musicVolume;
      musicRef.current
        .play()
        .then(() => {
          setIsMusicPlaying(true);
          localStorage.setItem("isMusicPlaying", "true");
        })
        .catch((error) => {
          if (error.name === "NotAllowedError") {
            console.log("Autoplay prevented - waiting for user interaction");
          }
        });
    }
  };

  const stopBackgroundMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
      setIsMusicPlaying(false);
      localStorage.setItem("isMusicPlaying", "false");
    }
  };

  return (
    <AudioContext.Provider
      value={{
        playSound,
        toggleMusic,
        isMusicPlaying,
        setVolume: updateVolume,
        volume,
        setMusicVolume: updateMusicVolume,
        musicVolume,
        isSoundEnabled,
        toggleSound,
        startBackgroundMusic,
        stopBackgroundMusic,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
