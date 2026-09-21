import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Database, CheckCircle2, XCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { FocusDiagStatus, PreflightCheckResult, FocusLedgerRecord } from '../types';

interface DiagnosticsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: FocusLedgerRecord[];
}

export const DiagnosticsOverlay: React.FC<DiagnosticsOverlayProps> = ({
  isOpen,
  onClose,
  ledger
}) => {
  const [diag, setDiag] = useState<FocusDiagStatus | null>(null);
  const [preflightResults, setPreflightResults] = useState<{
    summary: string;
    checks: PreflightCheckResult[];
  } | null>(null);
  const [isRunningPreflight, setIsRunningPreflight] = useState(false);
  const [activeTab, setActiveTab] = useState<'diag' | 'ledger' | 'preflight'>('diag');

  const fetchDiag = async () => {
    try {
      const res = await fetch('/focus/diag');
      if (res.ok) {
        const data = await res.json();
        setDiag(data);
      }
    } catch (e) {
      console.warn('Diag fetch error:', e);
    }
  };

  const runPreflight = async () => {
    setIsRunningPreflight(true);
    try {
      const res = await fetch('/api/preflight');
      if (res.ok) {
        const data = await res.json();
        setPreflightResults({
          summary: data.summary,
          checks: data.checks
        });
      }
    } catch (e) {
      console.warn('Preflight fetch error:', e);
    } finally {
      setIsRunningPreflight(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiag();
      runPreflight();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="diagnostics-field-proof-modal"
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 flex flex-col gap-4 text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">Diagnostics & Field Tooling</h2>
              <p className="text-[11px] font-mono text-slate-400">Prompt 07 & 16: Zero Guessing, Real Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchDiag(); runPreflight(); }}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningPreflight ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('diag')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'diag'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>GET /focus/diag</span>
          </button>

          <button
            onClick={() => setActiveTab('preflight')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'preflight'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Preflight Harness</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Privacy Ledger</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
          {/* 1. Diag Tab (Prompt 16) */}
          {activeTab === 'diag' && diag && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-emerald-400 mb-2 font-bold uppercase">
                  Privacy Standard: Booleans & Statuses ONLY (Zero Identities)
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">frontmostAppReadable:</span>
                    <strong className="text-emerald-400">{String(diag.frontmostAppReadable)}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">isBrowser:</span>
                    <strong className="text-emerald-400">{String(diag.isBrowser)}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">tabReadStatus:</span>
                    <strong className="text-cyan-400">{diag.tabReadStatus}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">isFrontTabJarvis:</span>
                    <strong className="text-slate-200">{String(diag.isFrontTabJarvis)}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">hashPresent:</span>
                    <strong className="text-slate-200">{String(diag.hashPresent)}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">isLockDeferred:</span>
                    <strong className="text-amber-400">{String(diag.isLockDeferred)}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">settleTicks:</span>
                    <strong className="text-slate-200">{diag.settleTicks}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">onTargetRightNow:</span>
                    <strong className={diag.onTargetRightNow ? "text-emerald-400" : "text-rose-400"}>
                      {String(diag.onTargetRightNow)}
                    </strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">sessionOn:</span>
                    <strong className="text-slate-200">{String(diag.sessionOn)}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950/60 rounded border border-slate-900">
                    <span className="text-slate-400">tickThreadAlive:</span>
                    <strong className="text-emerald-400">{String(diag.tickThreadAlive)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Preflight Tab (Prompt 07 & 16) */}
          {activeTab === 'preflight' && preflightResults && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase">Preflight Battery Verdict:</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">{preflightResults.summary}</div>
                </div>
                <button
                  onClick={runPreflight}
                  disabled={isRunningPreflight}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Run Suite
                </button>
              </div>

              <div className="space-y-2">
                {preflightResults.checks.map((check) => (
                  <div
                    key={check.id}
                    className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5"
                  >
                    {check.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    {check.status === 'fail' && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                    {check.status === 'warn' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className="font-semibold text-slate-200">{check.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{check.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Ledger Tab (Prompt 16) */}
          {activeTab === 'ledger' && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-400">
                PROMPT 16 LAW: Aggregates-only records. Zero titles or history persisted.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                      <th className="py-1.5 px-2">Timestamp</th>
                      <th className="py-1.5 px-2">Planned</th>
                      <th className="py-1.5 px-2">Active</th>
                      <th className="py-1.5 px-2">On-Target</th>
                      <th className="py-1.5 px-2">Drifts</th>
                      <th className="py-1.5 px-2">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((rec, idx) => (
                      <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/40">
                        <td className="py-1.5 px-2 text-slate-400">{rec.timestamp.split('T')[0]}</td>
                        <td className="py-1.5 px-2">{rec.plannedMinutes}m</td>
                        <td className="py-1.5 px-2">{rec.activeMinutes}m</td>
                        <td className="py-1.5 px-2 text-emerald-400">{rec.onTargetMinutes}m</td>
                        <td className="py-1.5 px-2 text-rose-400">{rec.drifts}</td>
                        <td className="py-1.5 px-2 font-bold text-emerald-300">{rec.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
