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
  onUpdateResponseText: (callback) => {
    ipcRenderer.on("update-response-text", (_, data) => callback(data));
  },
  onUpdateUserInputText: (callback) => {
    ipcRenderer.on("update-user-input-text", (_, data) => callback(data));
  },
  // 新增事件侦听器
  onUserStop: (callback) => {
    ipcRenderer.on("userstop", (_, data) => callback(data));
  },
  onAgentStop: (callback) => {
    ipcRenderer.on("agentstop", (_, data) => callback(data));
  },
  
});
