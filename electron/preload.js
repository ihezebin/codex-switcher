const { contextBridge, ipcRenderer } = require('electron');

let latestStartupStatus = '';
const startupStatusListeners = new Set();

ipcRenderer.on('codex:startup-status', (_, message) => {
  latestStartupStatus = message;
  startupStatusListeners.forEach((listener) => listener(message));
});

contextBridge.exposeInMainWorld('codexAPI', {
  platform: process.platform,
  getState: () => ipcRenderer.invoke('codex:state'),
  getProfile: (name) => ipcRenderer.invoke('codex:profile', name),
  saveProfile: (payload) => ipcRenderer.invoke('codex:save-profile', payload),
  createProfile: (payload) => ipcRenderer.invoke('codex:create-profile', payload),
  applyProfile: (name) => ipcRenderer.invoke('codex:apply-profile', name),
  openFolder: () => ipcRenderer.invoke('codex:open-folder'),
  openExternal: (url) => ipcRenderer.invoke('codex:open-external', url),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  onStartupStatus: (callback) => {
    startupStatusListeners.add(callback);
    if (latestStartupStatus) callback(latestStartupStatus);
    return () => startupStatusListeners.delete(callback);
  },
  onStateChanged: (callback) => {
    const listener = (_, state) => callback(state);
    ipcRenderer.on('codex:state-changed', listener);
    return () => ipcRenderer.removeListener('codex:state-changed', listener);
  },
});
