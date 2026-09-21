import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Monitor, Eye, EyeOff, Sparkles, Clock, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface EyesOrganModalProps {
  isOpen: boolean;
  onClose: () => void;
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  isWebcamActive: boolean;
  onToggleWebcam: () => void;
  onAskVision: (imageBase64: string, question: string, endpoint: '/api/see' | '/api/look') => void;
}

export const EyesOrganModal: React.FC<EyesOrganModalProps> = ({
  isOpen,
  onClose,
  isScreenSharing,
  screenStream,
  onStartScreenShare,
  onStopScreenShare,
  isWebcamActive,
  onToggleWebcam,
  onAskVision
}) => {
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  const [questionInput, setQuestionInput] = useState('');
  const [reliefMinutesRemaining, setReliefMinutesRemaining] = useState(0);
  const [postureAlert, setPostureAlert] = useState<string | null>(null);
  const [stareSeconds, setStareSeconds] = useState(0);
  const [lastDiffPercent, setLastDiffPercent] = useState<number>(0);

  const lastFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Webcam Stream lifecycle
  useEffect(() => {
    if (isWebcamActive) {
      navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
          webcamStreamRef.current = stream;
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
          }
          // The Ear Law check (Prompt 13):
          // "If the eyes come on while the mic is off, the assistant must say so:
          // 'My ears are off, sir — tap the ear button and just talk.'"
          if ((window as any).jarvisSpeak) {
            (window as any).jarvisSpeak("My ears are off, sir — tap the ear button and just talk.");
          }
        })
        .catch((err) => {
          console.warn('Webcam permission warning:', err);
        });
    } else {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
        webcamStreamRef.current = null;
      }
    }

    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isWebcamActive]);

  // Screen Stream attach
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Screen Watch: Diffs screen every 5s for stillness detection (Prompt 14)
  useEffect(() => {
    if (!isScreenSharing || !screenStream) return;

    const diffInterval = setInterval(() => {
      if (!screenVideoRef.current || screenVideoRef.current.videoWidth === 0) return;

      const video = screenVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, 64, 64);
      const currentData = ctx.getImageData(0, 0, 64, 64).data;

      if (lastFrameCanvasRef.current) {
        const lastCtx = lastFrameCanvasRef.current.getContext('2d');
        if (lastCtx) {
          const lastData = lastCtx.getImageData(0, 0, 64, 64).data;
          let diffSum = 0;
          for (let i = 0; i < currentData.length; i += 4) {
            diffSum += Math.abs(currentData[i] - lastData[i]);
          }
          const avgDiff = (diffSum / (64 * 64 * 255)) * 100;
          setLastDiffPercent(Math.round(avgDiff * 10) / 10);

          if (avgDiff < 1.0) {
            setStareSeconds(prev => {
              const next = prev + 5;
              if (next === 60) {
                // Stare trigger! (Prompt 14)
                if ((window as any).jarvisSpeak) {
                  (window as any).jarvisSpeak("You have been staring at that exact view for a minute, sir. Might I offer an observation?");
                }
              }
              return next;
            });
          } else {
            setStareSeconds(0);
          }
        }
      }

      lastFrameCanvasRef.current = canvas;
    }, 5000);

    return () => clearInterval(diffInterval);
  }, [isScreenSharing, screenStream]);

  // Trigger Relief Valve (Prompt 13)
  const handleReliefValve = () => {
    setReliefMinutesRemaining(3);
    setPostureAlert(null);
    if ((window as any).jarvisSpeak) {
      (window as any).jarvisSpeak("Understood, sir. Nudges silenced for three minutes.");
    }
  };

  // Capture current screen frame as JPEG and query Jarvis (Prompt 06)
  const handleCaptureAndAskScreen = () => {
    if (!screenVideoRef.current || screenVideoRef.current.videoWidth === 0) return;
    const video = screenVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const q = questionInput.trim() || "What do you think of this screen, sir?";
    onAskVision(jpegDataUrl, q, '/api/see');
    setQuestionInput('');
    onClose();
  };

  // Capture current webcam frame as JPEG and query Jarvis (Prompt 13)
  const handleCaptureAndAskWebcam = () => {
    if (!webcamVideoRef.current || webcamVideoRef.current.videoWidth === 0) return;
    const video = webcamVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const q = questionInput.trim() || "What do you think of my posture and demeanor?";
    onAskVision(jpegDataUrl, q, '/api/look');
    setQuestionInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="eyes-organs-modal"
        className="w-full max-w-2xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 flex flex-col gap-4 text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">Visual Perception Organs</h2>
              <p className="text-[11px] font-mono text-slate-400">Prompt 06, 13 & 14: Screen Sight & Workstation Eyes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two Organ Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Organ 1: Screen Watch (Prompt 06 & 14) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-slate-200">SCREEN SIGHT (P06)</span>
              </div>
              <button
                onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                  isScreenSharing
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {isScreenSharing ? 'Active Share' : 'Share Screen'}
              </button>
            </div>

            {/* Video preview or placeholder */}
            <div className="relative aspect-video rounded-lg bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${isScreenSharing ? 'block' : 'hidden'}`}
              />
              {!isScreenSharing && (
                <div className="text-center p-3 text-slate-500 text-xs font-mono">
                  <Monitor className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <span>Click Share to inspect entire display</span>
                </div>
              )}
              {isScreenSharing && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/60 text-[9px] font-mono text-cyan-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>DIFF: {lastDiffPercent}% | STILL: {stareSeconds}s</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCaptureAndAskScreen}
              disabled={!isScreenSharing}
              className="w-full py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-40 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask: "What do you think of this screen?"</span>
            </button>
          </div>

          {/* Organ 2: Webcam Posture & Phone Organ (Prompt 13) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-slate-200">THE EYES (P13)</span>
              </div>
              <button
                onClick={onToggleWebcam}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                  isWebcamActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {isWebcamActive ? 'Webcam On' : 'Start Eyes'}
              </button>
            </div>

            {/* Video preview or placeholder */}
            <div className="relative aspect-video rounded-lg bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={webcamVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isWebcamActive ? 'block' : 'hidden'}`}
              />
              {!isWebcamActive && (
                <div className="text-center p-3 text-slate-500 text-xs font-mono">
                  <Camera className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <span>Local posture & phone supervision</span>
                </div>
              )}
              {isWebcamActive && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-[9px] font-mono text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>LOCAL ANALYSIS ONLY</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCaptureAndAskWebcam}
                disabled={!isWebcamActive}
                className="flex-1 py-2 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-medium transition-all text-center"
              >
                "Look at Me"
              </button>

              <button
                onClick={handleReliefValve}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700"
                title="Silence nudges for 3 minutes (Prompt 13)"
              >
                Relief Valve (3m)
              </button>
            </div>
          </div>
        </div>

        {/* Custom Vision Query Input */}
        <div className="pt-2 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Custom inquiry about screen or posture (e.g. 'What do you think of this slide layout?')..."
            className="flex-1 bg-slate-900 px-3 py-2 rounded-xl text-xs font-sans text-slate-200 border border-slate-800 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={isScreenSharing ? handleCaptureAndAskScreen : handleCaptureAndAskWebcam}
            disabled={!isScreenSharing && !isWebcamActive}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-mono font-bold text-slate-200 border border-slate-700"
          >
            Inspect
          </button>
        </div>
      </div>
    </div>
  );
};
