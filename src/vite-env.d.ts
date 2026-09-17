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
    applyProfile: (name: string) => Promise<{
      codexHome: string;
      hasCodexConfig: boolean;
      profiles: CodexProfile[];
    }>;
    openFolder: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
    minimizeWindow: () => void;
    toggleMaximizeWindow: () => Promise<boolean>;
    closeWindow: () => void;
    onStartupStatus: (callback: (message: string) => void) => () => void;
    onStateChanged: (callback: (state: {
      codexHome: string;
      hasCodexConfig: boolean;
      profiles: CodexProfile[];
    }) => void) => () => void;
  };
}
