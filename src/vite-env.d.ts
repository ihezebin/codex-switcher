/// <reference types="vite/client" />

interface CodexProfile {
  name: string;
  model: string;
  reviewModel: string;
  baseUrl: string;
  apiKey: string;
  providerId: string;
  source: string;
  custom: boolean;
  active?: boolean;
  error?: string;
}

interface CodexUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  forceUpdate: boolean;
  platformKey: string;
  downloadUrl: string;
  notes: string;
  releaseUrl: string;
  minimumVersion: string;
  proxyBaseUrl?: string;
  manifestUrl: string;
  downloadedPath?: string;
}

interface CodexUpdateProgress {
  percent: number;
  transferred: number;
  total: number;
}

interface CodexSessionSummary {
  id: string;
  file: string;
  title: string;
  cwd: string;
  createdAt: string;
  updatedAt: string;
  model: string;
  messageCount: number;
  segmentCount: number;
}

interface CodexSessionDetail extends CodexSessionSummary {
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
}

interface CodexUsageStatistics {
  range: "today" | "7d" | "30d";
  summary: { requests: number; tokens: number; cost: number; unpricedRequests: number };
  points: Array<{ label: string; requests: number; tokens: number; cost: number }>;
  models: Array<{ model: string; requests: number; tokens: number; cost: number }>;
  logs: Array<{
    id: string;
    timestamp: string;
    model: string;
    inputTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    priced: boolean;
    status: number | null;
    dataSource: "codex_session" | "proxy";
  }>;
}

interface Window {
  codexAPI: {
    platform: string;
    getState: () => Promise<{
      codexHome: string;
      hasCodexConfig: boolean;
      profiles: CodexProfile[];
    }>;
    getProfile: (name: string) => Promise<CodexProfile>;
    saveProfile: (payload: { name: string; model?: string; reviewModel?: string; baseUrl?: string; apiKey?: string; content?: string }) => Promise<CodexProfile>;
    createProfile: (payload: { name: string; model?: string; reviewModel?: string; baseUrl?: string; apiKey?: string }) => Promise<CodexProfile>;
    deleteProfile: (name: string) => Promise<{
      codexHome: string;
      hasCodexConfig: boolean;
      profiles: CodexProfile[];
    }>;
    renameProfile: (payload: { oldName: string; newName: string }) => Promise<{
      codexHome: string;
      hasCodexConfig: boolean;
      profiles: CodexProfile[];
    }>;
    applyProfile: (name: string) => Promise<{
      codexHome: string;
      hasCodexConfig: boolean;
      profiles: CodexProfile[];
    }>;
    loadModels: (payload: { baseUrl: string; apiKey: string }) => Promise<string[]>;
    testConnection: (payload: { baseUrl: string; apiKey: string; model: string }) => Promise<{ ok: boolean; status: number; endpoint: string; body: unknown }>;
    prepareSessions: () => Promise<boolean>;
    listSessions: (allowStale?: boolean) => Promise<CodexSessionSummary[]>;
    getSession: (file: string) => Promise<CodexSessionDetail>;
    deleteSession: (file: string) => Promise<boolean>;
    resumeSession: (file: string) => Promise<boolean>;
    getUsageStatistics: (range: "today" | "7d" | "30d") => Promise<CodexUsageStatistics>;
    setLanguage: (language: "zh" | "en") => void;
    checkUpdates: () => Promise<CodexUpdateInfo>;
    downloadUpdate: () => Promise<CodexUpdateInfo>;
    installUpdate: () => Promise<boolean>;
    openFolder: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
    minimizeWindow: () => void;
    toggleMaximizeWindow: () => Promise<boolean>;
    closeWindow: () => void;
    onStartupStatus: (callback: (message: string) => void) => () => void;
    onUpdateProgress: (callback: (progress: CodexUpdateProgress) => void) => () => void;
    onStateChanged: (callback: (state: {
      codexHome: string;
      hasCodexConfig: boolean;
      profiles: CodexProfile[];
    }) => void) => () => void;
  };
}
