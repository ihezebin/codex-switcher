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
    testConnection: (payload: { baseUrl: string; apiKey: string; model: string }) => Promise<{ ok: boolean }>;
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
