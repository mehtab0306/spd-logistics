"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type VoiceAssistantLanguage = "ur-PK" | "hi-IN" | "en-US";

export interface UseVoiceAssistantOptions {
  initialLanguage?: VoiceAssistantLanguage;
  continuous?: boolean;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const {
    initialLanguage = "ur-PK",
    continuous = false,
    onFinalResult,
    onError,
  } = options;

  const [language, setLanguage] = useState<VoiceAssistantLanguage>(initialLanguage);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [audioWaveData, setAudioWaveData] = useState<number[]>([15, 25, 45, 70, 40, 20, 10]);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  // Cleanup audio analyzer
  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setAudioWaveData([10, 15, 20, 15, 10, 15, 10]);
  }, []);

  // Fallback simulated wave animation if getUserMedia is blocked or restricted
  const startFallbackVisualizer = useCallback(() => {
    fallbackIntervalRef.current = setInterval(() => {
      const simulatedLevel = Math.floor(Math.random() * 65) + 35;
      setAudioLevel(simulatedLevel);
      setAudioWaveData([
        Math.floor(Math.random() * 40) + 20,
        Math.floor(Math.random() * 70) + 30,
        Math.floor(Math.random() * 90) + 35,
        Math.floor(Math.random() * 100) + 40,
        Math.floor(Math.random() * 80) + 30,
        Math.floor(Math.random() * 60) + 20,
        Math.floor(Math.random() * 40) + 15,
      ]);
    }, 120);
  }, []);

  // Initialize Web Audio API for real-time waveform visualization
  const startAudioVisualizer = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        startFallbackVisualizer();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        startFallbackVisualizer();
        return;
      }

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        const waveSlices: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 8));

        for (let i = 0; i < 8; i++) {
          const val = dataArray[i * step] || 0;
          sum += val;
          // Normalize height between 15% and 100%
          const normalized = Math.min(100, Math.max(15, Math.round((val / 255) * 100)));
          waveSlices.push(normalized);
        }

        const avg = sum / bufferLength;
        const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalizedLevel);
        setAudioWaveData(waveSlices);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch {
      // If mic stream error or permission rejected, fall back to simulated wave
      startFallbackVisualizer();
    }
  }, [startFallbackVisualizer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    cleanupAudio();
  }, [cleanupAudio]);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    setError(null);
    setTranscript("");
    setInterimTranscript("");

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const err = "Speech recognition is not supported in this browser.";
      setError(err);
      onError?.(err);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        startAudioVisualizer();
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let currentFinal = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            currentFinal += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentFinal) {
          const cleanFinal = currentFinal.trim();
          setTranscript((prev) => (prev ? `${prev} ${cleanFinal}` : cleanFinal));
          onFinalResult?.(cleanFinal);
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error || "unknown";
        if (errorType !== "no-speech") {
          const errMsg = `Speech error: ${errorType}`;
          setError(errMsg);
          onError?.(errMsg);
        }
        setIsListening(false);
        cleanupAudio();
      };

      recognition.onend = () => {
        setIsListening(false);
        cleanupAudio();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      const msg = err.message || "Failed to initialize microphone.";
      setError(msg);
      onError?.(msg);
      setIsListening(false);
      cleanupAudio();
    }
  }, [language, continuous, onFinalResult, onError, startAudioVisualizer, cleanupAudio]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isListening,
    transcript,
    interimTranscript,
    language,
    isSupported,
    error,
    audioLevel,
    audioWaveData,
    setLanguage,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

export default useVoiceAssistant;
