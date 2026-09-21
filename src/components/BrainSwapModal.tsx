import React, { useState } from 'react';
import { Cpu, Check, AlertTriangle, X } from 'lucide-react';

interface BrainSwapModalProps {
  currentModelName: string;
  onSwapModel: (modelKey: string) => Promise<string>;
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_BRAINS = [
  {
    id: 'gpt-6-astra',
    key: 'astra',
    displayName: 'GPT 6 ASTRA',
    badge: 'Standard Brain (Sept 2026)',
    desc: 'Deep multi-step reasoning, dense multimodal vision, and low token overhead.',
    quote: '"New brain fitted, sir — GPT-6 Astra. Do try to keep up."'
  },
  {
    id: 'claude-fable-5.1',
    key: 'fable 5.1',
    displayName: 'FABLE 5.1',
    badge: 'Philosophical Rigor',
    desc: 'Deepest reasoning index and uncompromising analytical integrity.',
    quote: '"Claude Fable 5.1 online, sir. Deep reasoning initialized."'
  },
  {
    id: 'gemini-3.8-flash',
    key: 'gemini',
    displayName: 'GEMINI 3.8 FLASH',
    badge: 'Sub-Second Latency',
    desc: 'High-throughput sovereign multimodal inference.',
    quote: '"Gemini 3.8 Flash engaged, sir. Faster than light, and considerably more polite."'
  },
  {
    id: 'grok-3',
    key: 'grok',
    displayName: 'GROK 3',
    badge: 'Uncensored Intellect',
    desc: 'Sharp, rebellious edge tempered with British butler decorum.',
    quote: '"Grok 3 connected, sir. Rebellious intellect calibrated."'
  }
];

export const BrainSwapModal: React.FC<BrainSwapModalProps> = ({
  currentModelName,
  onSwapModel,
  isOpen,
  onClose
}) => {
  const [testInput, setTestInput] = useState('');
  const [refusalMessage, setRefusalMessage] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  if (!isOpen) return null;

  const handleSelectModel = async (modelKey: string) => {
    setIsSwapping(true);
    setRefusalMessage(null);
    try {
      await onSwapModel(modelKey);
      onClose();
    } catch (err: any) {
      setRefusalMessage(err.message || 'Swap refused.');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    setIsSwapping(true);
    setRefusalMessage(null);
    try {
      await onSwapModel(testInput.trim());
      setTestInput('');
      onClose();
    } catch (err: any) {
      setRefusalMessage(err.message || 'Swap refused.');
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="brain-swap-dialog"
        className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">Swap Cognitive Core</h2>
              <p className="text-[11px] font-mono text-slate-400">Prompt 08 & 15: Runtime Neural Brain Selection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Brain */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">CURRENT BRAIN:</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
            {currentModelName}
          </span>
        </div>

        {/* Model Cards List */}
        <div className="space-y-2.5">
          {AVAILABLE_BRAINS.map((brain) => {
            const isCurrent = currentModelName === brain.displayName;
            return (
              <button
                key={brain.id}
                onClick={() => handleSelectModel(brain.key)}
                disabled={isSwapping}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-100">{brain.displayName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {brain.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{brain.desc}</p>
                  <p className="text-[11px] text-emerald-300/80 font-serif italic pt-0.5">{brain.quote}</p>
                </div>
                {isCurrent && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />}
              </button>
            );
          })}
        </div>

        {/* Refusal Test Input (Demonstrating Prompt 08: Refuse unknown models like "Opus 5") */}
        <form onSubmit={handleCustomSubmit} className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>TEST SPOKEN MODEL SWAP / REFUSAL RULE:</span>
            <span className="text-amber-400 text-[10px]">(e.g. "opus 5" to test refusal)</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="e.g. 'fable 5.1' or invalid 'opus 5'..."
              className="flex-1 bg-slate-900 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-200 border border-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSwapping || !testInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 font-semibold"
            >
              Test
            </button>
          </div>
        </form>

        {/* Refusal Warning Box (Prompt 08) */}
        {refusalMessage && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2 font-sans">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-mono uppercase font-bold text-rose-300">Prompt 08 Refusal Safe Guard:</strong>
              <p className="mt-0.5">{refusalMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
