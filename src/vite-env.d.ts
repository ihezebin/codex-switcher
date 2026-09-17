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
    getState: () => Promise<{ codexHome: string; profiles: CodexProfile[] }>;
    getProfile: (name: string) => Promise<CodexProfile>;
    saveProfile: (payload: { name: string; model?: string; reviewModel?: string; baseUrl?: string; apiKey?: string; content?: string }) => Promise<CodexProfile>;
    createProfile: (payload: { name: string; model?: string; reviewModel?: string; baseUrl?: string; apiKey?: string }) => Promise<CodexProfile>;
    applyProfile: (name: string) => Promise<{ codexHome: string; profiles: CodexProfile[] }>;
    openFolder: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
    onStateChanged: (callback: (state: { codexHome: string; profiles: CodexProfile[] }) => void) => () => void;
  };
}
