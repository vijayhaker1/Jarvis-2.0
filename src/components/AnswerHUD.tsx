import React from 'react';
import { Volume2, Sparkles, X, ChevronRight, Layers } from 'lucide-react';
import { ChatMessage, NoteNode } from '../types';

interface AnswerHUDProps {
  message: ChatMessage | null;
  onClose: () => void;
  nodes: NoteNode[];
  onSelectNode: (node: NoteNode) => void;
  onReplayAudio: (text: string) => void;
}

export const AnswerHUD: React.FC<AnswerHUDProps> = ({
  message,
  onClose,
  nodes,
  onSelectNode,
  onReplayAudio
}) => {
  if (!message) return null;

  const sourceNodes = (message.nodesUsed || [])
    .map(id => nodes.find(n => n.id === id))
    .filter((n): n is NoteNode => n !== undefined);

  return (
    <div
      id="jarvis-answer-hud"
      className="fixed bottom-28 left-4 right-4 md:left-auto md:right-1/2 md:translate-x-1/2 md:w-[620px] z-30 animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.15)] p-5 text-slate-100 flex flex-col gap-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs font-bold text-slate-200 tracking-wider">
              JARVIS • {message.modelUsed || 'GEMINI 3.8 FLASH'}
            </span>
            {message.nodesUsed && message.nodesUsed.length >= 4 && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
                <Layers className="w-2.5 h-2.5" />
                Cluster Synthesis ({message.nodesUsed.length} notes)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onReplayAudio(message.content)}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-900 transition-colors"
              title="Replay spoken answer"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Spoken Answer Body */}
        <p className="text-slate-100 font-sans text-sm md:text-base leading-relaxed">
          {message.content}
        </p>

        {/* Source Nodes Pills (Prompt 03: Make it prove where the answer came from) */}
        {sourceNodes.length > 0 && (
          <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Sources:</span>
            {sourceNodes.map(node => (
              <button
                key={node.id}
                onClick={() => onSelectNode(node)}
                className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 transition-all flex items-center gap-1 text-[11px]"
              >
                <span>#{node.id} {node.label}</span>
                <ChevronRight className="w-2.5 h-2.5 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
