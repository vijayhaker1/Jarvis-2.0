/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GalaxyVisualizer } from './components/GalaxyVisualizer';
import { HoloArcReactor } from './components/HoloArcReactor';
import { TopNavbar } from './components/TopNavbar';
import { BottomInputBar } from './components/BottomInputBar';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { FocusCountdownCard } from './components/FocusCountdownCard';
import { BrainSwapModal } from './components/BrainSwapModal';
import { DiagnosticsOverlay } from './components/DiagnosticsOverlay';
import { EyesOrganModal } from './components/EyesOrganModal';
import { RememberModal } from './components/RememberModal';
import { AnswerHUD } from './components/AnswerHUD';
import { SystemActionHUD } from './components/SystemActionHUD';
import { VoiceCommandModal } from './components/VoiceCommandModal';
import { NoteNode, GraphLink, AssistantStatus, ChatMessage, FocusSessionState, FocusLedgerRecord, SystemActionCommand } from './types';
import { INITIAL_NOTES } from './data/initialNotes';
import { parseSystemAction, launchSystemUrl } from './utils/systemCommandParser';
import { jarvisAudio } from './utils/audioEffects';
import { jarvisVoicePlayer } from './utils/naturalVoicePlayer';

export default function App() {
  // Graph State
  const [nodes, setNodes] = useState<NoteNode[]>(INITIAL_NOTES);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<NoteNode | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<number[]>([]);
  const [clusterMode, setClusterMode] = useState<boolean>(false);
  const [newBornNodeId, setNewBornNodeId] = useState<number | null>(null);

  // Butler Voice & Interaction State
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [bootGreetingTriggered, setBootGreetingTriggered] = useState<boolean>(false);
  const [currentModelName, setCurrentModelName] = useState<string>('GEMINI 3.8 FLASH');
  const [latestAnswer, setLatestAnswer] = useState<ChatMessage | null>(null);
  const [activeSystemAction, setActiveSystemAction] = useState<SystemActionCommand | null>(null);

  // View Mode: 'CORE' (Holographic Arc Reactor HUD), 'GALAXY' (3D Knowledge Cosmos), 'HYBRID'
  const [viewMode, setViewMode] = useState<'CORE' | 'GALAXY' | 'HYBRID'>('CORE');
  const [isContinuousLoop, setIsContinuousLoop] = useState<boolean>(true);
  const [currentVoiceTranscript, setCurrentVoiceTranscript] = useState<string>('');

  // Modals
  const [isBrainSwapOpen, setIsBrainSwapOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isEyesOrganOpen, setIsEyesOrganOpen] = useState(false);
  const [isRememberOpen, setIsRememberOpen] = useState(false);
  const [isCommandsModalOpen, setIsCommandsModalOpen] = useState(false);

  // Vision & Streaming
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  // Focus Session State (Prompt 09, 10, 11, 12, 16)
  const [focusSession, setFocusSession] = useState<FocusSessionState>({
    isActive: false,
    isDeferred: false,
    intent: '',
    targetApp: null,
    targetTabHost: null,
    plannedMinutes: 30,
    secondsElapsed: 0,
    secondsOnTarget: 0,
    secondsAdrift: 0,
    driftCount: 0,
    currentDriftSeconds: 0,
    isAdrift: false,
    settleTicks: 0,
    lastCalloutTime: 0,
    currentCallout: null,
    escalationTier: 1,
    isSnoozed: false,
    snoozeSecondsRemaining: 0,
    isExcused: false,
    streak: 3
  });

  const [ledger, setLedger] = useState<FocusLedgerRecord[]>([]);

  // Load Graph Data on Mount
  const fetchGraphData = useCallback(async () => {
    try {
      const res = await fetch('/api/graph');
      if (res.ok) {
        const data = await res.json();
        if (data.nodes && data.nodes.length > 0) {
          setNodes(data.nodes);
        }
        if (data.links) {
          setLinks(data.links);
        }
      }
    } catch (e) {
      console.warn('Using local initial notes fallback:', e);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch('/api/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchGraphData();
    fetchLedger();

    // Check ?focusdebug=1 URL parameter (Prompt 16)
    const params = new URLSearchParams(window.location.search);
    if (params.get('focusdebug') === '1' || params.get('focusprobe') === '1') {
      setIsDiagnosticsOpen(true);
    }
  }, [fetchGraphData, fetchLedger]);

  // Helper: Speak via Global Butler Synthesizer
  const speakButler = useCallback((text: string, onEnd?: () => void) => {
    if ((window as any).jarvisSpeak) {
      (window as any).jarvisSpeak(text, onEnd);
    }
  }, []);

  // Handle Node Selection in 3D Galaxy
  const handleSelectNode = useCallback((node: NoteNode) => {
    setSelectedNode(node);
    setClusterMode(false);

    // Find direct neighbors
    const neighborIds = links
      .filter(l => l.source === node.id || l.target === node.id)
      .map(l => (l.source === node.id ? l.target : l.source));

    setHighlightedNodeIds([node.id, ...neighborIds]);
  }, [links]);

  // Wikilink Click (fly to related node)
  const handleSelectWikilink = useCallback((label: string) => {
    const target = nodes.find(n => n.label.toLowerCase() === label.toLowerCase() || n.label.toLowerCase().includes(label.toLowerCase()));
    if (target) {
      handleSelectNode(target);
    }
  }, [nodes, handleSelectNode]);

  // Consult Jarvis directly about an inspected note
  const handleAskAboutNode = useCallback((node: NoteNode) => {
    const q = `Summarize key details from ${node.label}`;
    handleGeneralSubmit(q);
  }, []);

  // Handle Model Swapping (Prompt 08 & 15)
  const handleSwapModel = async (modelQuery: string): Promise<string> => {
    const res = await fetch('/api/model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelQuery })
    });

    const data = await res.json();
    if (!res.ok) {
      // Speak refusal in character
      speakButler(data.error);
      throw new Error(data.error);
    }

    setCurrentModelName(data.displayName);
    speakButler(data.introLine);

    setLatestAnswer({
      id: String(Date.now()),
      role: 'assistant',
      content: data.introLine,
      timestamp: new Date().toLocaleTimeString(),
      modelUsed: data.displayName
    });

    return data.displayName;
  };

  // Handle Quick Memory Capture (Prompt 05: Total Recall)
  const handleRememberText = async (text: string) => {
    setStatus('thinking');
    try {
      const res = await fetch('/api/remember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      if (res.ok && data.note) {
        setNodes(prev => [...prev, data.note]);
        setNewBornNodeId(data.note.id);
        setSelectedNode(data.note);
        setHighlightedNodeIds([data.note.id]);
        setClusterMode(false);

        speakButler(data.reply);
        setLatestAnswer({
          id: String(Date.now()),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString(),
          nodesUsed: [data.note.id],
          modelUsed: currentModelName
        });

        // Clear newborn pulse after 4s
        setTimeout(() => setNewBornNodeId(null), 4000);
        fetchGraphData();
      }
    } catch (err) {
      speakButler("I was unable to record that to the archives, sir.");
    } finally {
      setStatus('idle');
    }
  };

  // Start Focus Session (Prompt 09 & 10: Deferred Lock)
  const handleStartFocusSession = async (minutes: number = 30) => {
    try {
      const res = await fetch('/api/focus/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes })
      });
      const data = await res.json();

      setFocusSession(prev => ({
        ...prev,
        isActive: true,
        isDeferred: true,
        plannedMinutes: minutes,
        secondsElapsed: 0,
        secondsOnTarget: 0,
        secondsAdrift: 0,
        driftCount: 0,
        isAdrift: false,
        intent: '',
        targetApp: null,
        targetTabHost: null,
        currentCallout: null
      }));

      // Speak Prompt 10 start line:
      speakButler(data.spokenPrompt || "Go to what you're working on and I'll lock on there. And what are we focusing on, sir?");
    } catch (e) {
      console.warn('Focus start error:', e);
    }
  };

  // Lock Current Tab (Prompt 11: Lock This Tab)
  const handleLockCurrentTab = async () => {
    try {
      const res = await fetch('/api/focus/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName: 'Jarvis Sovereign Suite', tabHost: 'jarvis.internal' })
      });
      const data = await res.json();
      setFocusSession(prev => ({
        ...prev,
        isDeferred: false,
        targetApp: 'Jarvis Sovereign Suite',
        targetTabHost: 'jarvis.internal',
        isAdrift: false,
        currentCallout: null
      }));
      speakButler(data.spokenReply || "Locked on, sir.");
    } catch (e) {}
  };

  // Focus Snooze (Prompt 09)
  const handleSnoozeFocus = async () => {
    setFocusSession(prev => ({
      ...prev,
      snoozeSecondsRemaining: 15,
      isAdrift: false,
      currentCallout: null
    }));
    try {
      const res = await fetch('/api/focus/snooze', { method: 'POST' });
      const data = await res.json();
      speakButler(data.spokenReply || "Fifteen seconds granted, sir.");
    } catch (e) {}
  };

  // Focus Excuse (Prompt 09: "it's okay, I'm doing research")
  const handleExcuseFocus = async () => {
    setFocusSession(prev => ({
      ...prev,
      isExcused: true,
      isAdrift: false,
      currentCallout: null
    }));
    try {
      const res = await fetch('/api/focus/excuse', { method: 'POST' });
      const data = await res.json();
      speakButler(data.spokenReply || "Very good, sir. Excursion marked as research.");
    } catch (e) {}
  };

  // Stop Focus Session & Generate Report Card (Prompt 09)
  const handleStopFocus = async () => {
    try {
      const res = await fetch('/api/focus/stop', { method: 'POST' });
      const data = await res.json();
      setFocusSession(prev => ({
        ...prev,
        isActive: false,
        isDeferred: false,
        isAdrift: false,
        currentCallout: null,
        streak: prev.streak + 1
      }));
      if (data.report) {
        setLedger(prev => [data.report, ...prev]);
      }
      speakButler(data.spokenReport);
      setLatestAnswer({
        id: String(Date.now()),
        role: 'assistant',
        content: data.spokenReport,
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: currentModelName
      });
    } catch (e) {}
  };

  // Simulate Drift for Testing (Prompt 12: Name the Distraction)
  const handleSimulateDrift = async (domain: string) => {
    try {
      const nextTier = (focusSession.escalationTier === 3 ? 1 : (focusSession.escalationTier + 1)) as 1 | 2 | 3;
      const res = await fetch('/api/focus/drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distraction: domain, tier: nextTier })
      });
      const data = await res.json();

      setFocusSession(prev => ({
        ...prev,
        isAdrift: true,
        driftCount: prev.driftCount + 1,
        currentCallout: data.spokenCallout,
        escalationTier: nextTier
      }));

      speakButler(data.spokenCallout);
    } catch (e) {}
  };

  // Screen Sight: Start getDisplayMedia (Prompt 06 & 14)
  const handleStartScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' }
      });
      setScreenStream(stream);
      setIsScreenSharing(true);

      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
      };

      speakButler("Screen perception online, sir. I am watching your display.");
    } catch (err) {
      console.warn('Display media permission rejected:', err);
    }
  };

  const handleStopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
  };

  // Vision Query Handler (Prompt 06 & 13)
  const handleAskVision = async (imageBase64: string, question: string, endpoint: '/api/see' | '/api/look') => {
    setStatus('thinking');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, question })
      });
      const data = await res.json();

      speakButler(data.answer);
      setLatestAnswer({
        id: String(Date.now()),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: currentModelName,
        screenCaptured: true
      });
    } catch (e) {
      speakButler("I was unable to analyze that visual frame, sir.");
    } finally {
      setStatus('idle');
    }
  };

  // General Query & Voice Routing (Prompt 01, 02, 03, 05, 08, 09, 11 + System Controls)
  const handleGeneralSubmit = async (queryText: string) => {
    const qLower = queryText.toLowerCase().trim();

    // Route 0: System Action & Device/Web Control (e.g. "YouTube kholo", "Spotify chalao", "Screen dekho", "Open Google")
    const systemAction = parseSystemAction(queryText);
    if (systemAction) {
      jarvisAudio.playHudTick();
      speakButler(systemAction.voiceResponse);

      let autoOpened = false;
      let popupBlocked = false;

      // Direct synchronous launch attempts to open immediately
      if (systemAction.url) {
        const res = launchSystemUrl(systemAction.url);
        autoOpened = res.opened;
        popupBlocked = res.blockedByPopup;
      }

      setActiveSystemAction({
        ...systemAction,
        autoOpened,
        popupBlocked
      });

      setLatestAnswer({
        id: String(Date.now()),
        role: 'assistant',
        content: systemAction.voiceResponse,
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: 'JARVIS SYSTEM CORE',
        isSmallTalk: true
      });

      if (systemAction.type === 'system_control') {
        if (systemAction.target === 'SCREEN_VISION') {
          setIsEyesOrganOpen(true);
        } else if (systemAction.target === 'MUTE_AUDIO') {
          jarvisVoicePlayer.setMuted(true);
        } else if (systemAction.target === 'UNMUTE_AUDIO') {
          jarvisVoicePlayer.setMuted(false);
        } else if (systemAction.target === 'OPEN_DIAGNOSTICS') {
          setIsDiagnosticsOpen(true);
        } else if (systemAction.target === 'OPEN_BRAIN_SWAP') {
          setIsBrainSwapOpen(true);
        } else if (systemAction.target === 'VIEW_GALAXY') {
          setViewMode('GALAXY');
        } else if (systemAction.target === 'VIEW_CORE') {
          setViewMode('CORE');
        } else if (systemAction.target === 'VIEW_HYBRID') {
          setViewMode('HYBRID');
        }
      }
      return;
    }

    // Route 1: Remember Command ("remember that...", "note to self", "log this")
    if (
      qLower.startsWith('remember that') ||
      qLower.startsWith('note to self') ||
      qLower.startsWith('log this') ||
      qLower.startsWith("don't let me forget")
    ) {
      handleRememberText(queryText);
      return;
    }

    // Route 2: Model Swap Command ("switch to Astra", "try on Claude Fable 5.1", etc.)
    if (
      qLower.startsWith('switch to') ||
      qLower.startsWith('try on') ||
      qLower.startsWith('go back to normal brain') ||
      qLower.startsWith('change model to')
    ) {
      handleSwapModel(queryText);
      return;
    }

    // Route 3: Focus Commands
    if (qLower.includes('thirty minutes on this') || qLower.includes('start focus') || qLower === 'focus') {
      handleStartFocusSession(30);
      return;
    }
    if (
      qLower === 'lock this tab' ||
      qLower === 'lock on this tab' ||
      qLower === 'keep me in this tab' ||
      qLower === 'stay on this tab'
    ) {
      handleLockCurrentTab();
      return;
    }
    if (qLower.includes('give me fifteen seconds') || qLower === 'snooze') {
      handleSnoozeFocus();
      return;
    }
    if (qLower.includes("it's okay, i'm doing research") || qLower === 'excuse') {
      handleExcuseFocus();
      return;
    }

    // Route 4: Screen Inspection Command
    if (isScreenSharing && (qLower.includes('what do you think of this') || qLower.includes('what am i looking at') || qLower.includes('inspect this screen'))) {
      setIsEyesOrganOpen(true);
      return;
    }

    // Route 5: Main Cognitive Query (/api/chat)
    setStatus('thinking');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText })
      });

      const data = await res.json();
      const answer = data.answer || "Indeed, sir.";
      const nodesUsed: number[] = data.nodes || [];
      const isSmallTalk: boolean = data.isSmallTalk || false;

      // Speak answer
      speakButler(answer);

      // PROMPT 03: THE DEMO MOMENT RULES
      // 1. Small talk must not drag camera around
      if (isSmallTalk || nodesUsed.length === 0) {
        setClusterMode(false);
        setHighlightedNodeIds([]);
      }
      // 2. If 4 or more notes drew the answer, do NOT fly anywhere! Light the whole cluster!
      else if (nodesUsed.length >= 4) {
        setClusterMode(true);
        setHighlightedNodeIds(nodesUsed);
      }
      // 3. If 1 to 3 notes, fly camera to top source node, light it & neighbors, open side panel!
      else {
        setClusterMode(false);
        const topNodeId = nodesUsed[0];
        const targetNode = nodes.find(n => n.id === topNodeId);
        if (targetNode) {
          handleSelectNode(targetNode);
        }
      }

      setLatestAnswer({
        id: String(Date.now()),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString(),
        nodesUsed,
        modelUsed: data.modelUsed || currentModelName,
        isSmallTalk
      });
    } catch (err: any) {
      speakButler("My cognitive loop encountered an irregularity, sir.");
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#05070a] text-slate-100 overflow-hidden font-sans">
      {/* 1. Top Navbar: Crest, Voice HUD, Model Chip, Organs & Diagnostics */}
      <TopNavbar
        status={status}
        setStatus={setStatus}
        onTranscriptSubmitted={handleGeneralSubmit}
        onInterrupt={() => {
          setStatus('idle');
          window.speechSynthesis?.cancel();
        }}
        nodeCount={nodes.length}
        bootGreetingTriggered={bootGreetingTriggered}
        setBootGreetingTriggered={setBootGreetingTriggered}
        currentModelName={currentModelName}
        onOpenBrainSwap={() => setIsBrainSwapOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenEyesOrgan={() => setIsEyesOrganOpen(true)}
        isScreenSharing={isScreenSharing}
        isWebcamActive={isWebcamActive}
        onResetView={() => {
          setSelectedNode(null);
          setHighlightedNodeIds([]);
          setClusterMode(false);
        }}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        isContinuousLoop={isContinuousLoop}
        onToggleContinuousLoop={() => setIsContinuousLoop(!isContinuousLoop)}
        onTranscriptChange={setCurrentVoiceTranscript}
      />

      {/* 2. Main Stage: Core HUD, 3D Galaxy Canvas, or Hybrid */}
      <main className="relative w-full h-full pt-14 pb-20 overflow-hidden">
        {/* Galaxy Visualizer (renders in background for CORE/HYBRID, full for GALAXY) */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            viewMode === 'GALAXY'
              ? 'opacity-100 pointer-events-auto'
              : viewMode === 'HYBRID'
              ? 'opacity-40 pointer-events-auto'
              : 'opacity-20 pointer-events-none'
          }`}
        >
          <GalaxyVisualizer
            nodes={nodes}
            links={links}
            selectedNodeId={selectedNode ? selectedNode.id : null}
            highlightedNodeIds={highlightedNodeIds}
            clusterMode={clusterMode}
            onSelectNode={handleSelectNode}
            newBornNodeId={newBornNodeId}
          />
        </div>

        {/* Holo Arc Reactor HUD (renders prominently in CORE and HYBRID modes) */}
        {(viewMode === 'CORE' || viewMode === 'HYBRID') && (
          <div className="relative z-10 w-full h-full pointer-events-none">
            <HoloArcReactor
              status={status}
              currentModelName={currentModelName}
              isListening={status === 'listening'}
              onToggleMic={() => {
                if ((window as any).jarvisToggleMic) {
                  (window as any).jarvisToggleMic();
                }
              }}
              isContinuousLoop={isContinuousLoop}
              onToggleContinuousLoop={() => setIsContinuousLoop(!isContinuousLoop)}
              onExecuteCommand={(cmd) => handleGeneralSubmit(cmd)}
              currentTranscript={currentVoiceTranscript}
              nodeCount={nodes.length}
            />
          </div>
        )}
      </main>

      {/* 3. Node Detail Inspector Panel (Prompt 01 & 03) */}
      <NodeDetailPanel
        node={selectedNode}
        onClose={() => {
          setSelectedNode(null);
          setHighlightedNodeIds([]);
        }}
        onSelectWikilink={handleSelectWikilink}
        onAskAboutNode={handleAskAboutNode}
      />

      {/* 4. Desktop Countdown Card (Prompt 09, 10, 11, 12, 16) */}
      <FocusCountdownCard
        session={focusSession}
        setSession={setFocusSession}
        onLockCurrentTab={handleLockCurrentTab}
        onSnooze={handleSnoozeFocus}
        onExcuse={handleExcuseFocus}
        onAbortSession={handleStopFocus}
        onSimulateDrift={handleSimulateDrift}
        ledger={ledger}
      />

      {/* 5. Jarvis Spoken Answer Display HUD (Prompt 01 & 03) */}
      <AnswerHUD
        message={latestAnswer}
        onClose={() => setLatestAnswer(null)}
        nodes={nodes}
        onSelectNode={handleSelectNode}
        onReplayAudio={(text) => speakButler(text)}
      />

      {/* 5.1 Futuristic System Action Dispatch HUD */}
      <SystemActionHUD
        command={activeSystemAction}
        onClose={() => setActiveSystemAction(null)}
        onOpenCheatsheet={() => setIsCommandsModalOpen(true)}
      />

      {/* 6. Bottom Input Bar with Quick Prompts & Organ Toggles */}
      <BottomInputBar
        status={status}
        onSubmitQuestion={handleGeneralSubmit}
        onStartScreenShare={handleStartScreenShare}
        isScreenSharing={isScreenSharing}
        onToggleWebcam={() => setIsWebcamActive(!isWebcamActive)}
        isWebcamActive={isWebcamActive}
        onStartFocus={() => handleStartFocusSession(30)}
        isFocusActive={focusSession.isActive}
        onQuickRemember={() => setIsRememberOpen(true)}
        onOpenCommands={() => setIsCommandsModalOpen(true)}
      />

      {/* Modals */}
      <VoiceCommandModal
        isOpen={isCommandsModalOpen}
        onClose={() => setIsCommandsModalOpen(false)}
        onExecuteSample={handleGeneralSubmit}
      />

      <BrainSwapModal
        isOpen={isBrainSwapOpen}
        onClose={() => setIsBrainSwapOpen(false)}
        currentModelName={currentModelName}
        onSwapModel={handleSwapModel}
      />

      <DiagnosticsOverlay
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        ledger={ledger}
      />

      <EyesOrganModal
        isOpen={isEyesOrganOpen}
        onClose={() => setIsEyesOrganOpen(false)}
        isScreenSharing={isScreenSharing}
        screenStream={screenStream}
        onStartScreenShare={handleStartScreenShare}
        onStopScreenShare={handleStopScreenShare}
        isWebcamActive={isWebcamActive}
        onToggleWebcam={() => setIsWebcamActive(!isWebcamActive)}
        onAskVision={handleAskVision}
      />

      <RememberModal
        isOpen={isRememberOpen}
        onClose={() => setIsRememberOpen(false)}
        onSubmitRemember={handleRememberText}
      />
    </div>
  );
}
