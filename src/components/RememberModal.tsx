import React, { useState } from 'react';
import { BookmarkPlus, Sparkles, X } from 'lucide-react';

interface RememberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRemember: (text: string) => void;
}

export const RememberModal: React.FC<RememberModalProps> = ({
  isOpen,
  onClose,
  onSubmitRemember
}) => {
  const [rememberText, setRememberText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rememberText.trim()) return;
    onSubmitRemember(rememberText.trim());
    setRememberText('');
    onClose();
  };

  const sampleTriggers = [
    "remember that the finish window should be 900 milliseconds",
    "note to self: schedule Series B observer board meeting for next Thursday",
    "log this: client requires air-gapped sovereign cluster deployment"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="remember-capture-modal"
        className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 flex flex-col gap-4 text-slate-100"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <BookmarkPlus className="w-5 h-5 text-pink-400" />
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">Total Recall Archive</h2>
              <p className="text-[11px] font-mono text-slate-400">Prompt 05: Grow the Brain Live Without Reload</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Enter statement or note:
            </label>
            <textarea
              value={rememberText}
              onChange={(e) => setRememberText(e.target.value)}
              rows={4}
              placeholder="e.g. remember that the finish window should be 900 milliseconds..."
              className="w-full bg-slate-900 p-3 rounded-xl text-sm font-sans text-slate-100 border border-slate-800 focus:outline-none focus:border-pink-500/80 resize-none leading-relaxed"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Quick Test Triggers:</div>
            <div className="space-y-1">
              {sampleTriggers.map((trig, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRememberText(trig)}
                  className="block w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-xs font-mono text-slate-300 hover:text-pink-300 border border-slate-800/80 truncate transition-colors"
                >
                  "{trig}"
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rememberText.trim()}
              className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instantiate Star</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
