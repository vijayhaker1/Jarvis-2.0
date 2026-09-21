import React, { useEffect, useRef } from 'react';
import { AssistantStatus } from '../types';
import { Mic, MicOff, Volume2, Radio, Zap, Shield, Eye, Activity, Cpu } from 'lucide-react';
import { jarvisAudio } from '../utils/audioEffects';
import { jarvisVoicePlayer } from '../utils/naturalVoicePlayer';

interface HoloArcReactorProps {
  status: AssistantStatus;
  currentModelName: string;
  isListening: boolean;
  onToggleMic: () => void;
  isContinuousLoop: boolean;
  onToggleContinuousLoop: () => void;
  onExecuteCommand: (cmd: string) => void;
  currentTranscript?: string;
  nodeCount: number;
}

export const HoloArcReactor: React.FC<HoloArcReactorProps> = ({
  status,
  currentModelName,
  isListening,
  onToggleMic,
  isContinuousLoop,
  onToggleContinuousLoop,
  onExecuteCommand,
  currentTranscript,
  nodeCount
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Soundwave & Waveform Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 95;

      ctx.clearRect(0, 0, width, height);

      // Rotating Outer Gyro Ring
      angle += status === 'thinking' ? 0.04 : status === 'speaking' ? 0.02 : 0.008;

      // 1. Circular Waveform Spectrum
      const bars = 48;
      const step = (Math.PI * 2) / bars;
      const voiceFreqData = jarvisVoicePlayer.getVisualizerData();

      for (let i = 0; i < bars; i++) {
        const barAngle = i * step + angle * 0.3;
        let intensity = 0.15;

        if (status === 'speaking') {
          if (voiceFreqData && voiceFreqData.length > 0) {
            const freqIdx = Math.floor((i / bars) * (voiceFreqData.length * 0.75));
            const rawAmp = voiceFreqData[freqIdx] / 255.0;
            intensity = Math.min(1.0, 0.15 + rawAmp * 1.1);
          } else {
            intensity = 0.3 + 0.6 * Math.abs(Math.sin(angle * 4 + i * 0.7) * Math.cos(angle * 2 + i * 0.3));
          }
        } else if (status === 'listening') {
          intensity = 0.25 + 0.45 * Math.abs(Math.sin(angle * 6 + i));
        } else if (status === 'thinking') {
          intensity = 0.2 + 0.4 * Math.abs(Math.cos(angle * 8 + i * 0.5));
        } else {
          intensity = 0.1 + 0.12 * Math.sin(angle * 2 + i * 0.4);
        }

        const barLength = 12 + intensity * 35;
        const innerX = centerX + Math.cos(barAngle) * (radius - 5);
        const innerY = centerY + Math.sin(barAngle) * (radius - 5);
        const outerX = centerX + Math.cos(barAngle) * (radius + barLength);
        const outerY = centerY + Math.sin(barAngle) * (radius + barLength);

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.lineWidth = 2.2;

        if (status === 'speaking') {
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + intensity * 0.6})`;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
        } else if (status === 'listening') {
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.5 + intensity * 0.5})`;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 10;
        } else if (status === 'thinking') {
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + intensity * 0.6})`;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
        } else {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + intensity * 0.4})`;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
          ctx.shadowBlur = 4;
        }

        ctx.stroke();
      }

      // Reset shadow
      ctx.shadowBlur = 0;

      // 2. Center Concentric Energy Circles
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 12, 0, Math.PI * 2);
      ctx.strokeStyle = status === 'speaking' ? 'rgba(0, 240, 255, 0.7)' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Counter-rotating tick dashes
      const tickCount = 24;
      const tickStep = (Math.PI * 2) / tickCount;
      for (let j = 0; j < tickCount; j++) {
        const tAngle = j * tickStep - angle * 0.6;
        const tInX = centerX + Math.cos(tAngle) * (radius - 22);
        const tInY = centerY + Math.sin(tAngle) * (radius - 22);
        const tOutX = centerX + Math.cos(tAngle) * (radius - 15);
        const tOutY = centerY + Math.sin(tAngle) * (radius - 15);

        ctx.beginPath();
        ctx.moveTo(tInX, tInY);
        ctx.lineTo(tOutX, tOutY);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.5)';
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  const quickDirectives = [
    { label: "Status Report", cmd: "Jarvis, run a complete status report and diagnostic check." },
    { label: "Who Are You?", cmd: "Who are you and what are your capabilities?" },
    { label: "Strategic Overview", cmd: "What is our 2026 executive strategy and photonic timeline?" },
    { label: "Focus Protocol", cmd: "Jarvis, engage focus accountability mode for 25 minutes." },
    { label: "Security Sweep", cmd: "Jarvis, perform a sovereign security scan on our network." },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-4">
      {/* Stark Industries Hologram Glass Backplate */}
      <div className="relative w-full bg-slate-950/70 border border-cyan-500/20 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center overflow-hidden">
        
        {/* Holographic HUD Grid & Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Top Telemetry Header */}
        <div className="w-full flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-6 font-mono text-xs text-cyan-400/80">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold tracking-widest text-cyan-300">STARK OS // J.A.R.V.I.S. V8.4</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">CORE: {currentModelName}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
              <span>ARC: 100% NOMINAL</span>
            </span>
            <span className="hidden md:flex items-center gap-1 text-[11px] text-cyan-400">
              <Activity className="w-3.5 h-3.5" />
              <span>4.82 THz</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {nodeCount} NODES INDEXED
            </span>
          </div>
        </div>

        {/* Central Arc Reactor Interactive Hologram */}
        <div className="relative my-4 flex flex-col items-center">
          {/* Multi-layered CSS Pulsing Rings */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Outer Compass / Azimuth Ring */}
            <div 
              className={`absolute inset-0 rounded-full border border-cyan-500/30 border-dashed transition-all duration-1000 ${
                status === 'speaking' ? 'animate-[spin_20s_linear_infinite] border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.3)]' :
                status === 'listening' ? 'animate-[spin_12s_linear_infinite] border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.3)]' :
                status === 'thinking' ? 'animate-[spin_6s_linear_infinite] border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.3)]' :
                'animate-[spin_40s_linear_infinite]'
              }`}
            />

            {/* Middle Rotating Arc Segments */}
            <div 
              className={`absolute inset-4 rounded-full border-2 border-transparent border-t-cyan-400 border-b-cyan-500/40 transition-all duration-700 ${
                status === 'speaking' ? 'animate-[spin_8s_linear_infinite_reverse]' :
                status === 'listening' ? 'animate-[spin_5s_linear_infinite_reverse]' :
                'animate-[spin_24s_linear_infinite_reverse]'
              }`}
            />

            {/* High-tech Canvas Waveform Spectrum */}
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Central Interactive Core Sphere */}
            <button
              onClick={() => {
                jarvisAudio.playHudTick();
                onToggleMic();
              }}
              className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 group cursor-pointer ${
                status === 'speaking'
                  ? 'bg-gradient-to-br from-cyan-500/30 via-blue-600/20 to-slate-950 border-2 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.6)]'
                  : status === 'listening'
                  ? 'bg-gradient-to-br from-emerald-500/30 via-teal-600/20 to-slate-950 border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.6)] animate-pulse'
                  : status === 'thinking'
                  ? 'bg-gradient-to-br from-amber-500/30 via-orange-600/20 to-slate-950 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.6)]'
                  : 'bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-950 border border-cyan-500/50 hover:border-cyan-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]'
              }`}
              title="Click to talk with Jarvis"
            >
              {/* Inner Core Glow */}
              <div className="absolute inset-2 rounded-full bg-cyan-400/10 blur-sm pointer-events-none" />

              {/* Status Icon */}
              {status === 'speaking' ? (
                <Volume2 className="w-8 h-8 text-cyan-300 animate-bounce" />
              ) : status === 'listening' ? (
                <Radio className="w-8 h-8 text-emerald-300 animate-ping" />
              ) : status === 'thinking' ? (
                <Cpu className="w-8 h-8 text-amber-300 animate-spin" />
              ) : (
                <Mic className="w-8 h-8 text-cyan-400 group-hover:text-cyan-200 group-hover:scale-110 transition-transform" />
              )}

              {/* Core State Text */}
              <span className="mt-1 text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-200">
                {status === 'speaking'
                  ? 'SPEAKING'
                  : status === 'listening'
                  ? 'LISTENING'
                  : status === 'thinking'
                  ? 'COMPUTING'
                  : 'ACTIVATE'}
              </span>
            </button>
          </div>

          {/* Real-time Subtitle / Voice Transcript Stream */}
          <div className="mt-3 text-center min-h-[28px] max-w-lg px-4">
            {currentTranscript ? (
              <p className="text-sm font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-full px-4 py-1 animate-pulse">
                "{currentTranscript}"
              </p>
            ) : isListening ? (
              <p className="text-xs font-mono text-emerald-400 animate-pulse tracking-wide">
                Listening for speech... Say "Jarvis" or ask any question.
              </p>
            ) : status === 'speaking' ? (
              <p className="text-xs font-mono text-cyan-400 tracking-wide">
                Synthesizing response with British aristocratic cadence...
              </p>
            ) : status === 'thinking' ? (
              <p className="text-xs font-mono text-amber-400 tracking-wide">
                Querying cognitive neural matrix...
              </p>
            ) : (
              <p className="text-xs font-mono text-slate-400 tracking-wide">
                Touch Arc Core or speak to engage voice interface.
              </p>
            )}
          </div>
        </div>

        {/* Continuous Voice Loop Switch (Astra Mode) */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              jarvisAudio.playHudTick();
              onToggleContinuousLoop();
            }}
            className={`px-3 py-1.5 rounded-full border text-xs font-mono transition-all flex items-center gap-2 ${
              isContinuousLoop
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Automatically listen again after Jarvis finishes speaking"
          >
            <span className={`w-2 h-2 rounded-full ${isContinuousLoop ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>CONTINUOUS ASTRA VOICE LOOP: {isContinuousLoop ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Quick Voice & Command Directives */}
        <div className="mt-5 w-full flex flex-col items-center">
          <div className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest mb-2">
            DIRECTIVE PROTOCOLS
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickDirectives.map((d, idx) => (
              <button
                key={idx}
                onClick={() => {
                  jarvisAudio.playHudTick();
                  onExecuteCommand(d.cmd);
                }}
                disabled={status === 'thinking'}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono transition-all shadow-sm"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
