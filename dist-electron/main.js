import { ipcMain as t, app as i, BrowserWindow as s, Menu as c } from "electron";
import m from "electron-updater";
import { fileURLToPath as p } from "node:url";
import o from "node:path";
const { autoUpdater: f } = m, a = o.dirname(p(import.meta.url));
process.env.APP_ROOT = o.join(a, "..");
const n = process.env.VITE_DEV_SERVER_URL, E = o.join(process.env.APP_ROOT, "dist-electron"), r = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = n ? o.join(process.env.APP_ROOT, "public") : r;
let e;
function l() {
  e = new s({
    icon: o.join(process.env.VITE_PUBLIC, "slate-logo.ico"),
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: !1,
    // Remove native OS title bar
    titleBarStyle: "hidden",
    // Mac: hides title bar but keeps native traffic lights
    webPreferences: {
      preload: o.join(a, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
    }
  }), c.setApplicationMenu(null), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), n ? e.loadURL(n) : e.loadFile(o.join(r, "index.html"));
}
t.on("window-minimize", () => e == null ? void 0 : e.minimize());
t.on("window-maximize", () => {
  e != null && e.isMaximized() ? e.unmaximize() : e == null || e.maximize();
});
t.on("window-close", () => e == null ? void 0 : e.close());
t.handle("window-is-maximized", () => (e == null ? void 0 : e.isMaximized()) ?? !1);
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), e = null);
});
i.on("activate", () => {
  s.getAllWindows().length === 0 && l();
});
i.whenReady().then(() => {
  l(), n || f.checkForUpdatesAndNotify().catch((d) => {
    console.error("Failed to check for updates:", d);
  });
});
export {
  E as MAIN_DIST,
  r as RENDERER_DIST,
  n as VITE_DEV_SERVER_URL
};
