import React from 'react';
import { X, Terminal, Youtube, Music, Globe, Eye, VolumeX, Shield, Play, Layers } from 'lucide-react';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteSample: (cmd: string) => void;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({
  isOpen,
  onClose,
  onExecuteSample
}) => {
  if (!isOpen) return null;

  const categories = [
    {
      title: 'MEDIA & APPS',
      icon: <Youtube className="w-4 h-4 text-red-400" />,
      items: [
        { spoken: 'YouTube kholo', english: 'Open YouTube', action: 'Opens YouTube directly' },
        { spoken: 'YouTube par Arijit Singh ke gaane chalao', english: 'Play songs on YouTube', action: 'Direct search & play' },
        { spoken: 'Spotify kholo / Gaana chalao', english: 'Open Spotify', action: 'Launches Spotify music player' },
        { spoken: 'Netflix kholo', english: 'Open Netflix', action: 'Opens Netflix streaming' }
      ]
    },
    {
      title: 'SEARCH & BROWSING',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      items: [
        { spoken: 'Google kholo', english: 'Open Google', action: 'Launches Google search engine' },
        { spoken: 'Google par AI news search karo', english: 'Search Google for news', action: 'Opens instant search results' },
        { spoken: 'GitHub kholo', english: 'Open GitHub', action: 'Opens GitHub code repositories' },
        { spoken: 'ChatGPT kholo / Gemini kholo', english: 'Open AI Assistant', action: 'Opens AI model portal' }
      ]
    },
    {
      title: 'COMMUNICATION & TOOLS',
      icon: <Terminal className="w-4 h-4 text-emerald-400" />,
      items: [
        { spoken: 'WhatsApp kholo', english: 'Open WhatsApp Web', action: 'Opens messaging console' },
        { spoken: 'Gmail kholo / Mail check karo', english: 'Open Gmail', action: 'Opens Google Mail inbox' },
        { spoken: 'Calculator kholo', english: 'Open Calculator', action: 'Opens computational solver' },
        { spoken: 'Google Maps kholo', english: 'Open Maps', action: 'Opens satellite navigation' }
      ]
    },
    {
      title: 'J.A.R.V.I.S. SYSTEM CONTROLS',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      items: [
        { spoken: 'Screen dekho / Inspect screen', english: 'Look at my screen', action: 'Optical analysis of current display' },
        { spoken: 'Chup ho jao / Mute', english: 'Silence voice', action: 'Mutes butler vocal engine' },
        { spoken: 'Awaz chalu karo / Unmute', english: 'Restore voice', action: 'Restores butler voice' },
        { spoken: 'Galaxy dikhao / Reactor dikhao', english: 'Switch HUD mode', action: 'Toggles between 3D map & Arc Reactor' },
        { spoken: 'System check karo / Diagnostics kholo', english: 'Run diagnostics', action: 'Full telemetry verification' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-bold">
                COMMAND MATRIX • SYSTEM CONTROL
              </div>
              <div className="text-sm font-semibold text-slate-100">
                Voice & System Commands (Hindi, Hinglish & English)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Pop-up Permission Calibration Banner */}
          <div className="rounded-2xl bg-cyan-950/40 border border-cyan-500/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>HANDS-FREE AUTO-LAUNCH PERMISSION</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Voice se bina click kiye direct tab kholne ke liye browser me Pop-up permission allow karein:
              </p>
            </div>
            <button
              onClick={() => {
                window.open('https://www.google.com', '_blank');
              }}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              Test & Allow Pop-ups
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Aap J.A.R.V.I.S. ko mic ke through ya input box me likh kar direct Hindi/Hinglish me bol sakte hain. Tap any command below to test it instantly:
          </p>

          <div className="space-y-5">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-300">
                  {cat.icon}
                  <span>{cat.title}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.items.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        onExecuteSample(item.spoken.split('/')[0].trim());
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                          "{item.spoken}"
                        </span>
                        <Play className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        {item.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Mic On karein aur seedha bole: "YouTube Kholo"</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
