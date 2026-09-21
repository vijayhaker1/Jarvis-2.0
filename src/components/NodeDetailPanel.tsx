import React from 'react';
import { X, Sparkles, Compass, FileText, Calendar, Tag, ExternalLink } from 'lucide-react';
import { NoteNode } from '../types';

interface NodeDetailPanelProps {
  node: NoteNode | null;
  onClose: () => void;
  onSelectWikilink: (label: string) => void;
  onAskAboutNode: (note: NoteNode) => void;
}

const GROUP_COLORS: Record<string, string> = {
  Strategy: '#f59e0b',
  Engineering: '#06b6d4',
  Operations: '#10b981',
  Product: '#a855f7',
  Research: '#3b82f6',
  Captures: '#ec4899'
};

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  onClose,
  onSelectWikilink,
  onAskAboutNode
}) => {
  if (!node) return null;

  const color = GROUP_COLORS[node.group] || '#38bdf8';

  return (
    <div
      id="node-detail-panel"
      className="fixed top-20 right-6 z-30 w-96 max-h-[calc(100vh-160px)] flex flex-col rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right-4"
    >
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border"
              style={{
                color: color,
                backgroundColor: `${color}15`,
                borderColor: `${color}40`
              }}
            >
              {node.group} Sector
            </span>
            <span className="text-slate-400 text-xs font-mono">#{node.id}</span>
            {node.isNew && (
              <span className="px-1.5 py-0.5 rounded bg-pink-950/80 text-pink-400 border border-pink-700/60 text-[9px] font-mono">
                NEW CAPTURE
              </span>
            )}
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-100 tracking-tight leading-snug">
            {node.label}
          </h2>
        </div>

        <button
          id="close-node-panel-btn"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Close detail panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Excerpt Body */}
      <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-300 flex-1 leading-relaxed">
        {/* Date & Metadata */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 border-b border-slate-900 pb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{node.date}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{node.filename}</span>
          </div>
        </div>

        {/* Excerpt with Elegant Drop Cap Styling */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono tracking-widest text-slate-400 uppercase">Archive Excerpt</h3>
          <p className="text-slate-200 font-sans leading-relaxed text-sm bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
            {node.excerpt}
          </p>
        </div>

        {/* Wikilinks Constellation Jumps */}
        {node.wikilinks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono tracking-widest text-slate-400 uppercase">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gravitational Links ([[wikilinks]])</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.wikilinks.map((link) => (
                <button
                  key={link}
                  onClick={() => onSelectWikilink(link)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono transition-all flex items-center gap-1"
                >
                  <span>[[{link}]]</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {node.tags.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Sector Tags</div>
            <div className="flex flex-wrap gap-1">
              {node.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2">
        <button
          id="query-node-btn"
          onClick={() => onAskAboutNode(node)}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Consult Jarvis On This Note</span>
        </button>
      </div>
    </div>
  );
};
