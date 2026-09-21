/**
 * Core Type Definitions for Jarvis Knowledge Galaxy & Autonomous Butler
 */

export interface NoteNode {
  id: number;
  label: string;
  filename: string;
  group: 'Strategy' | 'Engineering' | 'Operations' | 'Product' | 'Research' | 'Captures';
  date: string;
  excerpt: string;
  content: string;
  wikilinks: string[];
  tags: string[];
  // 3D coordinates for spatial persistence
  x?: number;
  y?: number;
  z?: number;
  color?: string;
  isNew?: boolean;
}

export interface GraphLink {
  source: number;
  target: number;
  weight?: number;
}

export interface KnowledgeGraph {
  nodes: NoteNode[];
  links: GraphLink[];
}

export type AssistantStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface SystemActionCommand {
  id: string;
  type: 'open_url' | 'search_web' | 'system_control';
  target: string;
  url?: string;
  label: string;
  category: 'youtube' | 'google' | 'spotify' | 'github' | 'ai' | 'social' | 'tool' | 'internal';
  voiceResponse: string;
  timestamp: string;
  autoOpened?: boolean;
  popupBlocked?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  nodesUsed?: number[];
  modelUsed?: string;
  isSmallTalk?: boolean;
  screenCaptured?: boolean;
}

export interface FocusSessionState {
  isActive: boolean;
  isDeferred: boolean;
  intent: string;
  targetApp: string | null;
  targetTabHost: string | null;
  plannedMinutes: number;
  secondsElapsed: number;
  secondsOnTarget: number;
  secondsAdrift: number;
  driftCount: number;
  currentDriftSeconds: number;
  isAdrift: boolean;
  settleTicks: number;
  lastCalloutTime: number;
  currentCallout: string | null;
  escalationTier: 1 | 2 | 3;
  isSnoozed: boolean;
  snoozeSecondsRemaining: number;
  isExcused: boolean;
  streak: number;
}

export interface FocusLedgerRecord {
  timestamp: string;
  plannedMinutes: number;
  activeMinutes: number;
  onTargetMinutes: number;
  drifts: number;
  secondsAdrift: number;
  percent: number;
  completed: boolean;
}

export interface FocusDiagStatus {
  frontmostAppReadable: boolean;
  isBrowser: boolean;
  tabReadStatus: string;
  isFrontTabJarvis: boolean;
  hashPresent: boolean;
  isLockDeferred: boolean;
  settleTicks: number;
  appTargetPresent: boolean;
  tabTargetPresent: boolean;
  onTargetRightNow: boolean;
  sessionOn: boolean;
  tickThreadAlive: boolean;
  lastPixelDiff: number;
  intentWindowOpen: boolean;
  cooldownActive: boolean;
}

export interface PreflightCheckResult {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}
