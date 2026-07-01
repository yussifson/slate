import { ipcMain, app, BrowserWindow, Menu } from "electron";
import { autoUpdater } from "electron-updater";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "slate-logo.png"),
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    // Remove native OS title bar
    titleBarStyle: "hidden",
    // Mac: hides title bar but keeps native traffic lights
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });
  Menu.setApplicationMenu(null);
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.on("window-minimize", () => win == null ? void 0 : win.minimize());
ipcMain.on("window-maximize", () => {
  if (win == null ? void 0 : win.isMaximized()) {
    win.unmaximize();
  } else {
    win == null ? void 0 : win.maximize();
  }
});
ipcMain.on("window-close", () => win == null ? void 0 : win.close());
ipcMain.handle("window-is-maximized", () => (win == null ? void 0 : win.isMaximized()) ?? false);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  if (!VITE_DEV_SERVER_URL) {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error("Failed to check for updates:", err);
    });
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
