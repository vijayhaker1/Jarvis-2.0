import React, { useEffect, useState } from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, Globe, Radio, X, Youtube, Music, Github, Bot, Compass, ArrowUpRight, ShieldAlert, Maximize2 } from 'lucide-react';
import { SystemActionCommand } from '../types';
import { launchSystemUrl } from '../utils/systemCommandParser';

interface SystemActionHUDProps {
  command: SystemActionCommand | null;
  onClose: () => void;
  onOpenCheatsheet: () => void;
}

export const SystemActionHUD: React.FC<SystemActionHUDProps> = ({
  command,
  onClose,
  onOpenCheatsheet
}) => {
  const [opened, setOpened] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    if (!command) {
      setOpened(false);
      setIsBlocked(false);
      return;
    }

    // Check if App.tsx already succeeded during synchronous submission
    if (command.autoOpened) {
      setOpened(true);
      setIsBlocked(false);
    } else if (command.url) {
      // Try direct launch
      const res = launchSystemUrl(command.url);
      if (res.opened) {
        setOpened(true);
        setIsBlocked(false);
      } else {
        setOpened(false);
        setIsBlocked(true);
      }
    }

    // Auto dismiss after 12 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 12000);

    return () => clearTimeout(timer);
  }, [command, onClose]);

  if (!command) return null;

  const getIcon = () => {
    switch (command.category) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-400" />;
      case 'spotify':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'github':
        return <Github className="w-5 h-5 text-slate-200" />;
      case 'ai':
        return <Bot className="w-5 h-5 text-cyan-400" />;
      default:
        return <Globe className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleManualNewTab = () => {
    if (command.url) {
      const res = launchSystemUrl(command.url);
      setOpened(true);
      setIsBlocked(false);
    }
  };

  const handleOpenCurrentTab = () => {
    if (command.url) {
      window.location.href = command.url;
    }
  };

  const handleOpenFullTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  const handleTriggerPermissionPrompt = () => {
    // A direct user click to open target prompts Chrome/Edge's pop-up prompt immediately
    if (command.url) {
      window.open(command.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id="jarvis-system-action-hud"
      className="fixed top-20 right-4 sm:right-8 z-50 w-80 sm:w-96 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="relative rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/50 p-4 shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col gap-3">
        {/* Glow Line */}
        <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30">
              {getIcon()}
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold flex items-center gap-1.5">
                <span>SYSTEM ACTION DISPATCH</span>
                <span className={`w-1.5 h-1.5 rounded-full ${opened ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
              </div>
              <div className="text-xs font-bold text-slate-100">{command.label}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Spoken Output */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 flex items-start gap-2 text-xs text-slate-300">
          <Radio className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0 animate-pulse" />
          <p className="leading-relaxed text-[11px] font-sans italic text-slate-200">
            "{command.voiceResponse}"
          </p>
        </div>

        {/* Auto Launch Status Notice */}
        {command.url && (
          <>
            {opened ? (
              <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-2.5 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-mono">Dispatched to new tab automatically, sir.</span>
              </div>
            ) : isBlocked ? (
              <div className="rounded-xl bg-amber-950/60 border border-amber-500/40 p-3 flex flex-col gap-2 text-xs text-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono font-semibold text-amber-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Browser Blocked Auto-Open</span>
                  </div>
                  <button
                    onClick={handleTriggerPermissionPrompt}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 transition-colors"
                  >
                    Click to Allow
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-100/90 font-sans">
                  Browsers protect against automated voice popups. To permanently grant permission:
                </p>
                <div className="text-[10px] font-mono text-cyan-200/95 bg-slate-900/95 rounded-lg p-2.5 border border-slate-800 space-y-1">
                  <div>1. Browser ke top URL bar me dekhein, <strong>🚫 Pop-up icon</strong> hoga.</div>
                  <div>2. Click karke select karein: <strong>"Always allow pop-ups and redirects"</strong>.</div>
                  <div>3. <strong>Done</strong> click karein. Phir voice bolte hi auto-open ho jayega!</div>
                </div>

                {isIframe && (
                  <button
                    onClick={handleOpenFullTab}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-cyan-900/50 hover:bg-cyan-900 text-cyan-300 text-[10px] font-mono border border-cyan-500/30 transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Open J.A.R.V.I.S. in Full Tab (Bypasses iframe)</span>
                  </button>
                )}
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualNewTab}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{opened ? 'OPEN AGAIN (NEW TAB)' : `OPEN ${command.target.toUpperCase()} NOW`}</span>
                </button>

                <button
                  onClick={onOpenCheatsheet}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono transition-colors"
                  title="View All Voice Commands"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Alternative: Open in Same Window (Bypasses all popup blockers) */}
              <button
                onClick={handleOpenCurrentTab}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 text-slate-300 hover:text-slate-100 font-mono text-[10px] transition-colors"
              >
                <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                <span>Navigate in this window instead (bypasses pop-up blocker)</span>
              </button>
            </div>
          </>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Protocol: Dispatched
          </span>
          <span className="text-slate-400 truncate max-w-[140px]">{command.target}</span>
        </div>
      </div>
    </div>
  );
};
