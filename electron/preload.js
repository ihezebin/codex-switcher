const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codexAPI', {
  getState: () => ipcRenderer.invoke('codex:state'),
  getProfile: (name) => ipcRenderer.invoke('codex:profile', name),
  saveProfile: (payload) => ipcRenderer.invoke('codex:save-profile', payload),
  createProfile: (payload) => ipcRenderer.invoke('codex:create-profile', payload),
  applyProfile: (name) => ipcRenderer.invoke('codex:apply-profile', name),
  openFolder: () => ipcRenderer.invoke('codex:open-folder'),
  openExternal: (url) => ipcRenderer.invoke('codex:open-external', url),
  onStateChanged: (callback) => {
    const listener = (_, state) => callback(state);
    ipcRenderer.on('codex:state-changed', listener);
    return () => ipcRenderer.removeListener('codex:state-changed', listener);
  },
});
