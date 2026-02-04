const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('selectFolder'),
  runAutomation: (opts) => ipcRenderer.invoke('runAutomation', opts),
  onDownloadProgress: (cb) => {
    const handler = (_, pct) => cb(pct);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
});
