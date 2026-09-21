import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Target, Lock, Play, Pause, Square, Sparkles, ShieldAlert, Coffee, HelpCircle, CheckCircle } from 'lucide-react';
import { FocusSessionState, FocusLedgerRecord } from '../types';

interface FocusCountdownCardProps {
  session: FocusSessionState;
  setSession: React.Dispatch<React.SetStateAction<FocusSessionState>>;
  onLockCurrentTab: () => void;
  onSnooze: () => void;
  onExcuse: () => void;
  onAbortSession: () => void;
  onSimulateDrift: (domain: string) => void;
  ledger: FocusLedgerRecord[];
}

export const FocusCountdownCard: React.FC<FocusCountdownCardProps> = ({
  session,
  setSession,
  onLockCurrentTab,
  onSnooze,
  onExcuse,
  onAbortSession,
  onSimulateDrift,
  ledger
}) => {
  const [justLocked, setJustLocked] = useState(false);
  const [showIntentInput, setShowIntentInput] = useState(false);
  const [customIntent, setCustomIntent] = useState('');
  const [selectedDriftSite, setSelectedDriftSite] = useState('Instagram');

  // Handle Tab Switch / Window Blur Simulation
  // When user switches away from window, if not deferred, detect drift!
  useEffect(() => {
    if (!session.isActive) return;

    const handleBlur = () => {
      // User switched away from Jarvis tab
      if (session.isDeferred) {
        // First switch while deferred: lock on!
        setTimeout(() => {
          setSession(prev => ({
            ...prev,
            isDeferred: false,
            targetApp: 'Target Workspace',
            targetTabHost: 'workspace.internal',
            isAdrift: false
          }));
          if ((window as any).jarvisSpeak) {
            (window as any).jarvisSpeak("Locked on, sir.");
          }
        }, 1200);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [session.isActive, session.isDeferred, setSession]);

  // Session Tick Loop (1-second tick on server & client synchronizer)
  useEffect(() => {
    if (!session.isActive) return;

    const timer = setInterval(() => {
      setSession(prev => {
        if (!prev.isActive) return prev;

        const totalPlannedSeconds = prev.plannedMinutes * 60;
        const newSecondsElapsed = prev.secondsElapsed + 1;

        let newSnooze = Math.max(0, prev.snoozeSecondsRemaining - 1);
        let newAdrift = prev.isAdrift;
        let newSecondsAdrift = prev.secondsAdrift;
        let newSecondsOnTarget = prev.secondsOnTarget;

        if (newAdrift && newSnooze === 0 && !prev.isExcused) {
          newSecondsAdrift += 1;
        } else {
          newSecondsOnTarget += 1;
        }

        if (newSecondsElapsed >= totalPlannedSeconds) {
          // Complete session!
          setTimeout(() => onAbortSession(), 100);
        }

        return {
          ...prev,
          secondsElapsed: newSecondsElapsed,
          secondsOnTarget: newSecondsOnTarget,
          secondsAdrift: newSecondsAdrift,
          snoozeSecondsRemaining: newSnooze
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session.isActive, onAbortSession, setSession]);

  const totalSeconds = session.plannedMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - session.secondsElapsed);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleLockClick = () => {
    setJustLocked(true);
    onLockCurrentTab();
    setTimeout(() => setJustLocked(false), 1200);
  };

  const handleIntentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIntent.trim()) return;
    setSession(prev => ({ ...prev, intent: customIntent.trim() }));
    setShowIntentInput(false);
    if ((window as any).jarvisSpeak) {
      (window as any).jarvisSpeak("Noted, sir.");
    }
  };

  if (!session.isActive) {
    return null;
  }

  // Card tints red/amber on drift (Prompt 09)
  const isCardDrifting = session.isAdrift && session.snoozeSecondsRemaining === 0 && !session.isExcused;

  return (
    <div
      id="focus-countdown-card"
      className={`fixed top-4 right-6 z-40 w-80 rounded-2xl backdrop-blur-xl border transition-all duration-300 shadow-2xl p-4 select-none ${
        isCardDrifting
          ? 'bg-rose-950/80 border-rose-500/80 shadow-[0_0_30px_rgba(225,29,72,0.4)]'
          : session.isDeferred
          ? 'bg-amber-950/70 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
          : 'bg-slate-900/85 border-slate-700/80 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
      }`}
    >
      {/* Top Header & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Target className={`w-4 h-4 ${isCardDrifting ? 'text-rose-400 animate-bounce' : 'text-emerald-400'}`} />
          <span className="text-xs font-mono tracking-widest text-slate-200 font-semibold uppercase">
            {isCardDrifting ? 'DRIFT DETECTED' : session.isDeferred ? 'DEFERRED LOCK' : 'ACCOUNTABILITY LOCK'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <span>STREAK:</span>
          <span className="text-emerald-400 font-bold">{session.streak} 🔥</span>
        </div>
      </div>

      {/* Main Countdown Display */}
      <div className="py-3 flex items-baseline justify-between">
        <div>
          <div className="text-3xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            {timeFormatted}
            {session.snoozeSecondsRemaining > 0 && (
              <span className="text-xs text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/80">
                SNOOZE {session.snoozeSecondsRemaining}s
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
            {session.intent ? `Target: ${session.intent}` : 'Focus: Unspecified deep work'}
          </div>
        </div>

        {/* Lock Pill (Prompt 11) */}
        <button
          id="focus-lock-tab-pill"
          onClick={handleLockClick}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            justLocked
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-105'
              : 'bg-slate-800 text-slate-200 border-slate-600 hover:border-emerald-400 hover:text-emerald-300'
          }`}
          title="Explicitly lock on this active tab"
        >
          <Lock className="w-3 h-3" />
          {justLocked ? 'LOCKED!' : 'LOCK THIS TAB'}
        </button>
      </div>

      {/* Deferred Lock Guidance (Prompt 10) */}
      {session.isDeferred && (
        <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 font-sans">
          <p className="font-medium">"Go to what you're working on and I'll lock on there."</p>
          <p className="text-amber-300/70 text-[10px] mt-0.5">Switch tabs to let Jarvis settle & lock target.</p>
        </div>
      )}

      {/* Active Callout Alert (Prompt 12) */}
      {session.currentCallout && (
        <div className="mb-2.5 p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 font-serif italic">
          "{session.currentCallout}"
        </div>
      )}

      {/* Controls Bar: Snooze, Excuse, Abort */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-white/10 text-xs">
        <button
          id="focus-snooze-btn"
          onClick={onSnooze}
          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-all text-center"
          title="Give me 15 seconds"
        >
          Snooze (15s)
        </button>

        <button
          id="focus-excuse-btn"
          onClick={onExcuse}
          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-all text-center"
          title="Excuse current detour as research"
        >
          Excuse
        </button>

        <button
          id="focus-abort-btn"
          onClick={onAbortSession}
          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition-all"
          title="End session & generate report card"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Drift Test Panel (Demonstrating Prompt 12: Name the Distraction) */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>TEST DRIFT:</span>
        <div className="flex items-center gap-1">
          {['Instagram', 'YouTube', 'Slack', 'Reddit'].map(site => (
            <button
              key={site}
              onClick={() => onSimulateDrift(site)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px]"
              title={`Simulate drift into ${site}`}
            >
              {site}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
