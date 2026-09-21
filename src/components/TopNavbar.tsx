import React from 'react';
import { Sparkles, Cpu, ShieldCheck, Eye, EyeOff, RotateCcw, Orbit, Layers, Radio } from 'lucide-react';
import { ButlerVoiceHUD } from './ButlerVoiceHUD';
import { AssistantStatus } from '../types';
import { jarvisAudio } from '../utils/audioEffects';

interface TopNavbarProps {
  status: AssistantStatus;
  setStatus: (status: AssistantStatus) => void;
  onTranscriptSubmitted: (t: string) => void;
  onInterrupt: () => void;
  nodeCount: number;
  bootGreetingTriggered: boolean;
  setBootGreetingTriggered: (val: boolean) => void;
  currentModelName: string;
  onOpenBrainSwap: () => void;
  onOpenDiagnostics: () => void;
  onOpenEyesOrgan: () => void;
  isScreenSharing: boolean;
  isWebcamActive: boolean;
  onResetView: () => void;
  viewMode: 'CORE' | 'GALAXY' | 'HYBRID';
  onSetViewMode: (mode: 'CORE' | 'GALAXY' | 'HYBRID') => void;
  isContinuousLoop: boolean;
  onToggleContinuousLoop: () => void;
  onTranscriptChange?: (text: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  status,
  setStatus,
  onTranscriptSubmitted,
  onInterrupt,
  nodeCount,
  bootGreetingTriggered,
  setBootGreetingTriggered,
  currentModelName,
  onOpenBrainSwap,
  onOpenDiagnostics,
  onOpenEyesOrgan,
  isScreenSharing,
  isWebcamActive,
  onResetView,
  viewMode,
  onSetViewMode,
  isContinuousLoop,
  onToggleContinuousLoop,
  onTranscriptChange
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-4 sm:px-6 py-3 bg-slate-950/80 backdrop-blur-xl border-b border-cyan-500/20 flex items-center justify-between pointer-events-auto">
      {/* Left: Brand & Butler Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-serif font-bold text-slate-100 tracking-wider">J.A.R.V.I.S.</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/50">
                GPT-6 ASTRA
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Holographic HUD & Knowledge Galaxy
            </p>
          </div>
        </div>

        {/* Voice HUD: Status pill, mic button, mute button */}
        <ButlerVoiceHUD
          status={status}
          setStatus={setStatus}
          onTranscriptSubmitted={onTranscriptSubmitted}
          onInterrupt={onInterrupt}
          nodeCount={nodeCount}
          bootGreetingTriggered={bootGreetingTriggered}
          setBootGreetingTriggered={setBootGreetingTriggered}
          isContinuousLoop={isContinuousLoop}
          onToggleContinuousLoop={onToggleContinuousLoop}
          onTranscriptChange={onTranscriptChange}
        />
      </div>

      {/* Center/Right Mode Toggle: Core HUD vs Galaxy vs Hybrid */}
      <div className="hidden md:flex items-center bg-slate-900/90 rounded-full p-1 border border-slate-800 text-xs font-mono">
        <button
          onClick={() => {
            jarvisAudio.playHudTick();
            onSetViewMode('CORE');
          }}
          className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
            viewMode === 'CORE'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Stark Holographic Arc Reactor HUD"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>CORE HUD</span>
        </button>

        <button
          onClick={() => {
            jarvisAudio.playHudTick();
            onSetViewMode('HYBRID');
          }}
          className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
            viewMode === 'HYBRID'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Holographic HUD with 3D Galaxy background"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>HYBRID</span>
        </button>

        <button
          onClick={() => {
            jarvisAudio.playHudTick();
            onSetViewMode('GALAXY');
          }}
          className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
            viewMode === 'GALAXY'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Full 3D Knowledge Galaxy Starfield"
        >
          <Orbit className="w-3.5 h-3.5" />
          <span>GALAXY</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Brain Swap Chip (Prompt 08) */}
        <button
          id="brain-swap-chip"
          onClick={() => {
            jarvisAudio.playHudTick();
            onOpenBrainSwap();
          }}
          className="px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-mono transition-all flex items-center gap-1.5"
          title="Swap cognitive model (Prompt 08 & 15)"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold tracking-wider text-[11px]">{currentModelName}</span>
        </button>

        {/* Eyes Organ Pill (Prompt 06 & 13) */}
        <button
          id="eyes-organ-pill"
          onClick={() => {
            jarvisAudio.playHudTick();
            onOpenEyesOrgan();
          }}
          className={`px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-mono transition-all flex items-center gap-1.5 ${
            isScreenSharing || isWebcamActive
              ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Eyes: Screen Sight & Posture Organ"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-[11px]">
            {isScreenSharing && isWebcamActive
              ? 'EYES (SCREEN+CAM)'
              : isScreenSharing
              ? 'EYES (SCREEN)'
              : isWebcamActive
              ? 'EYES (CAM)'
              : 'EYES'}
          </span>
        </button>

        {/* Field Diagnostics & Preflight (Prompt 07 & 16) */}
        <button
          id="field-diagnostics-btn"
          onClick={() => {
            jarvisAudio.playHudTick();
            onOpenDiagnostics();
          }}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-cyan-400 transition-all"
          title="Field Diagnostics & Preflight Harness (Prompt 07 & 16)"
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Reset Camera View */}
        <button
          onClick={() => {
            jarvisAudio.playHudTick();
            onResetView();
          }}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
          title="Recenter Galaxy Cosmos"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
