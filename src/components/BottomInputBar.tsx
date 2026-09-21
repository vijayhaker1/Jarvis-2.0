import React, { useState } from 'react';
import { Send, Mic, Sparkles, Monitor, Camera, Target, BookmarkPlus } from 'lucide-react';
import { AssistantStatus } from '../types';
import { jarvisAudio } from '../utils/audioEffects';

interface BottomInputBarProps {
  status: AssistantStatus;
  onSubmitQuestion: (q: string) => void;
  onStartScreenShare: () => void;
  isScreenSharing: boolean;
  onToggleWebcam: () => void;
  isWebcamActive: boolean;
  onStartFocus: () => void;
  isFocusActive: boolean;
  onQuickRemember: () => void;
  onOpenCommands?: () => void;
}

export const BottomInputBar: React.FC<BottomInputBarProps> = ({
  status,
  onSubmitQuestion,
  onStartScreenShare,
  isScreenSharing,
  onToggleWebcam,
  isWebcamActive,
  onStartFocus,
  isFocusActive,
  onQuickRemember,
  onOpenCommands
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || status === 'thinking') return;
    jarvisAudio.playConfirmBeep();
    onSubmitQuestion(inputValue.trim());
    setInputValue('');
  };

  const sampleQuestions = [
    "YouTube kholo",
    "Spotify kholo",
    "Google kholo",
    "Screen dekho",
    "What is our 2026 executive strategy?",
    "Explain the focus accountability protocol and escalation tiers."
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5 pointer-events-auto">
        {/* Sample Questions Chips */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
          <span className="text-slate-400 uppercase tracking-wider pl-1">Exemplars:</span>
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                jarvisAudio.playConfirmBeep();
                onSubmitQuestion(sq);
              }}
              disabled={status === 'thinking'}
              className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all truncate whitespace-nowrap"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Main Bar */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-2xl p-2 rounded-2xl border border-slate-800/90 shadow-2xl focus-within:border-cyan-500/50 transition-all"
        >
          {/* System Voice Commands Cheatsheet */}
          {onOpenCommands && (
            <button
              type="button"
              onClick={() => {
                jarvisAudio.playHudTick();
                onOpenCommands();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center gap-1 text-xs font-mono"
              title="System Control & Voice Commands Matrix"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline font-bold">Commands</span>
            </button>
          )}

          {/* Quick Memory Capture Button (Prompt 05: Total Recall) */}
          <button
            type="button"
            onClick={() => {
              jarvisAudio.playHudTick();
              onQuickRemember();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-pink-400 border border-slate-800 transition-all flex items-center gap-1 text-xs font-mono"
            title="Grow the brain (Prompt 05: 'remember that...')"
          >
            <BookmarkPlus className="w-4 h-4 text-pink-400" />
            <span className="hidden md:inline">Remember</span>
          </button>

          {/* Eyes on Screen Button (Prompt 06: Sight) */}
          <button
            type="button"
            onClick={() => {
              jarvisAudio.playHudTick();
              onStartScreenShare();
            }}
            className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1 ${
              isScreenSharing
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-cyan-400'
            }`}
            title="The Eyes on your Screen (Prompt 06 & 14)"
          >
            <Monitor className={`w-4 h-4 ${isScreenSharing ? 'text-cyan-400 animate-pulse' : ''}`} />
            <span className="hidden md:inline">{isScreenSharing ? 'Screen Live' : 'Watch Screen'}</span>
          </button>

          {/* Webcam Posture Organ Button (Prompt 13: The Eyes) */}
          <button
            type="button"
            onClick={() => {
              jarvisAudio.playHudTick();
              onToggleWebcam();
            }}
            className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1 ${
              isWebcamActive
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-emerald-400'
            }`}
            title="The Eyes: Webcam Posture & Phone Organ (Prompt 13)"
          >
            <Camera className={`w-4 h-4 ${isWebcamActive ? 'text-emerald-400' : ''}`} />
            <span className="hidden md:inline">{isWebcamActive ? 'Eyes On' : 'Webcam Eyes'}</span>
          </button>

          {/* Focus Session Button (Prompt 09) */}
          <button
            type="button"
            onClick={() => {
              jarvisAudio.playHudTick();
              onStartFocus();
            }}
            className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1 ${
              isFocusActive
                ? 'bg-amber-950/60 text-amber-300 border-amber-500'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-amber-400'
            }`}
            title="Focus Accountability Session (Prompt 09 & 10)"
          >
            <Target className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{isFocusActive ? 'Focus Active' : 'Focus (30m)'}</span>
          </button>

          {/* Text Input */}
          <input
            id="jarvis-main-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Boliye 'YouTube kholo', 'Spotify chalao', 'Google search...', ya koi bhi sawal..."
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none font-sans"
            disabled={status === 'thinking'}
          />

          {/* Submit Button */}
          <button
            id="jarvis-send-btn"
            type="submit"
            disabled={!inputValue.trim() || status === 'thinking'}
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 transition-all font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
