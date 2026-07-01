"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(channel, listener) {
    electron.ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off(channel, ...omit) {
    electron.ipcRenderer.off(channel, ...omit);
  },
  send(channel, ...args) {
    electron.ipcRenderer.send(channel, ...args);
  },
  invoke(channel, ...args) {
    return electron.ipcRenderer.invoke(channel, ...args);
  }
});
electron.contextBridge.exposeInMainWorld("electronWindow", {
  minimize: () => electron.ipcRenderer.send("window-minimize"),
  maximize: () => electron.ipcRenderer.send("window-maximize"),
  close: () => electron.ipcRenderer.send("window-close"),
  isMaximized: () => electron.ipcRenderer.invoke("window-is-maximized")
});
