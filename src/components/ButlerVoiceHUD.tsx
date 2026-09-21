import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Radio, Repeat, ShieldCheck } from 'lucide-react';
import { AssistantStatus } from '../types';
import { jarvisAudio } from '../utils/audioEffects';
import { jarvisVoicePlayer } from '../utils/naturalVoicePlayer';

// ============================================================================
// PROMPT 02: THE FINISH_MS TIMING CONSTANT
// Buffers speech pauses so mid-sentence breath pauses do not trigger early dispatch.
// Short interrupt words like "stop" and "wait" bypass this buffer instantly.
// ============================================================================
export const FINISH_MS = 900;

interface ButlerVoiceHUDProps {
  status: AssistantStatus;
  setStatus: (status: AssistantStatus) => void;
  onTranscriptSubmitted: (transcript: string) => void;
  onInterrupt: () => void;
  nodeCount: number;
  bootGreetingTriggered: boolean;
  setBootGreetingTriggered: (val: boolean) => void;
  isContinuousLoop?: boolean;
  onToggleContinuousLoop?: () => void;
  onTranscriptChange?: (text: string) => void;
}

export const ButlerVoiceHUD: React.FC<ButlerVoiceHUDProps> = ({
  status,
  setStatus,
  onTranscriptSubmitted,
  onInterrupt,
  nodeCount,
  bootGreetingTriggered,
  setBootGreetingTriggered,
  isContinuousLoop = false,
  onToggleContinuousLoop,
  onTranscriptChange
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const bufferTimerRef = useRef<number | null>(null);
  const bufferedSpeechRef = useRef<string>('');
  const userInteractedRef = useRef<boolean>(false);
  const isContinuousLoopRef = useRef<boolean>(isContinuousLoop);

  useEffect(() => {
    isContinuousLoopRef.current = isContinuousLoop;
  }, [isContinuousLoop]);

  // Check URL ?mute=1 flag (Prompt 02)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mute') === '1') {
      setIsMuted(true);
      jarvisAudio.setMuted(true);
      jarvisVoicePlayer.setMuted(true);
    }
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    jarvisAudio.setMuted(next);
    jarvisVoicePlayer.setMuted(next);
  };

  // Cinematic Iron Man Movie Natural J.A.R.V.I.S. Speech Synthesizer (Single Unified Voice)
  const speakText = useCallback((text: string, onEnd?: () => void) => {
    // Strict Mute Flag Enforcement (Prompt 02)
    const params = new URLSearchParams(window.location.search);
    if (isMuted || params.get('mute') === '1') {
      if (onEnd) onEnd();
      return;
    }

    const handleSpeechFinish = () => {
      setStatus('idle');
      if (onEnd) onEnd();

      // Continuous Voice Loop (Astra Mode):
      if (isContinuousLoopRef.current) {
        setTimeout(() => {
          if (!userInteractedRef.current) return;
          startListening();
        }, 400);
      }
    };

    jarvisVoicePlayer.speakText(text, {
      onStart: () => {
        setStatus('speaking');
      },
      onEnd: handleSpeechFinish,
      onError: handleSpeechFinish
    });
  }, [isMuted, setStatus]);

  // Expose speak function to window for global speech dispatch
  useEffect(() => {
    (window as any).jarvisSpeak = speakText;
    return () => {
      delete (window as any).jarvisSpeak;
    };
  }, [speakText]);

  // Boot Greeting: Trigger on first user click or interaction (Prompt 02 & 04)
  const handleUserInteraction = useCallback(() => {
    if (userInteractedRef.current) return;
    userInteractedRef.current = true;
    jarvisVoicePlayer.getAudioContext();

    if (!bootGreetingTriggered && nodeCount > 0) {
      setBootGreetingTriggered(true);

      const hour = new Date().getHours();
      let timeGreeting = "Good evening";
      if (hour >= 4 && hour < 12) timeGreeting = "Good morning";
      else if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";

      const bootLine = `${timeGreeting}, sir. ${nodeCount} notes indexed, all present and accounted for.`;
      speakText(bootLine);
    }
  }, [bootGreetingTriggered, nodeCount, setBootGreetingTriggered, speakText]);

  useEffect(() => {
    const handleFirstClick = () => {
      handleUserInteraction();
    };
    window.addEventListener('click', handleFirstClick, { once: true });
    window.addEventListener('keydown', handleFirstClick, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstClick);
      window.removeEventListener('keydown', handleFirstClick);
    };
  }, [handleUserInteraction]);

  // Speech Recognition with FINISH_MS Debounce Buffer (Prompt 02)
  const startListening = () => {
    handleUserInteraction();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not available in this browser context.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      bufferedSpeechRef.current = '';
      setCurrentTranscript('');
      if (onTranscriptChange) onTranscriptChange('');
      jarvisAudio.playActivateChirp();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalized = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalized += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const activeText = (finalized + interim).trim();
      setCurrentTranscript(activeText);
      if (onTranscriptChange) onTranscriptChange(activeText);

      // FAST-PATH INTERRUPT BYPASS (Prompt 02)
      const lower = activeText.toLowerCase();
      if (lower === 'stop' || lower === 'wait' || lower === 'pause' || lower === 'abort') {
        if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
        jarvisVoicePlayer.stopSpeech();
        setStatus('idle');
        setIsListening(false);
        recognition.stop();
        onInterrupt();
        return;
      }

      // Buffer speech before dispatching (FINISH_MS = 900)
      if (finalized.trim()) {
        bufferedSpeechRef.current += finalized;

        if (bufferTimerRef.current) {
          clearTimeout(bufferTimerRef.current);
        }

        bufferTimerRef.current = window.setTimeout(() => {
          const fullQuery = bufferedSpeechRef.current.trim();
          bufferedSpeechRef.current = '';
          setCurrentTranscript('');
          if (onTranscriptChange) onTranscriptChange('');
          setIsListening(false);
          recognition.stop();

          if (fullQuery) {
            jarvisAudio.playConfirmBeep();
            onTranscriptSubmitted(fullQuery);
          }
        }, FINISH_MS);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition warning:', e?.error);
      setIsListening(false);
      if (status === 'listening') setStatus('idle');
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
    }
  };

  const stopListening = () => {
    if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setStatus('idle');
    if (bufferedSpeechRef.current.trim()) {
      jarvisAudio.playConfirmBeep();
      onTranscriptSubmitted(bufferedSpeechRef.current.trim());
      bufferedSpeechRef.current = '';
      setCurrentTranscript('');
      if (onTranscriptChange) onTranscriptChange('');
    }
  };

  // Expose toggle mic globally so the central Arc Reactor can toggle it
  useEffect(() => {
    (window as any).jarvisToggleMic = () => {
      if (isListening || status === 'listening') {
        stopListening();
      } else {
        startListening();
      }
    };
    (window as any).jarvisIsListening = isListening;
    return () => {
      delete (window as any).jarvisToggleMic;
      delete (window as any).jarvisIsListening;
    };
  }, [isListening, status]);

  return (
    <div className="flex items-center gap-2.5 relative">
      {/* Dynamic Status Indicator */}
      <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-mono">
        {status === 'listening' && (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-cyan-300 font-semibold tracking-wider">LISTENING</span>
            <span className="text-slate-400 text-[10px] truncate max-w-[140px]">
              {currentTranscript || `FINISH_MS: ${FINISH_MS}ms`}
            </span>
          </>
        )}

        {status === 'thinking' && (
          <>
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-amber-300 font-semibold tracking-wider">THINKING</span>
          </>
        )}

        {status === 'speaking' && (
          <>
            <div className="flex items-center gap-0.5 h-3.5">
              <span className="w-0.5 h-2.5 bg-emerald-400 animate-pulse"></span>
              <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse delay-75"></span>
              <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-150"></span>
              <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-200"></span>
            </div>
            <span className="text-emerald-300 font-semibold tracking-wider">SPEAKING</span>
            <span className="text-cyan-400/90 text-[10px] hidden sm:inline font-mono">(CINEMATIC JARVIS)</span>
          </>
        )}

        {status === 'idle' && (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
            <span className="text-slate-300 font-medium tracking-wide">JARVIS READY</span>
          </>
        )}
      </div>

      {/* J.A.R.V.I.S. Vocal Core Badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-cyan-500/30 rounded-full text-[11px] font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.12)]">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-semibold tracking-wider">JARVIS AUDIO CORE</span>
      </div>

      {/* Interactive Mic Button */}
      <button
        id="jarvis-mic-toggle-btn"
        onClick={isListening ? stopListening : startListening}
        className={`p-2 rounded-full border transition-all duration-200 flex items-center justify-center ${
          isListening
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
            : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:text-emerald-400 hover:border-emerald-500/40'
        }`}
        title={isListening ? "Stop listening (or say 'stop')" : "Talk to Jarvis (Click to speak)"}
      >
        {isListening ? <MicOff className="w-4 h-4 text-cyan-300" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* Mute Flag Toggle (?mute=1, Prompt 02) */}
      <button
        id="jarvis-mute-toggle-btn"
        onClick={toggleMute}
        className={`p-2 rounded-full border transition-all ${
          isMuted
            ? 'bg-rose-950/40 text-rose-400 border-rose-800/80'
            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
        }`}
        title={isMuted ? "Audio muted (?mute=1 active)" : "Audio active (Click to mute)"}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

