// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("livekitAPI", {
  getConnectionDetails: async () => {
    return await ipcRenderer.invoke("generate-livekit-token");
  },
});


contextBridge.exposeInMainWorld("osc", {
  send: async (address, value) => {
    return await ipcRenderer.invoke("send-osc", address, value);
  },
});