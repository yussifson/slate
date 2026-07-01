import { ipcMain as n, app as i, BrowserWindow as s, Menu as d } from "electron";
import { fileURLToPath as m } from "node:url";
import o from "node:path";
const a = o.dirname(m(import.meta.url));
process.env.APP_ROOT = o.join(a, "..");
const t = process.env.VITE_DEV_SERVER_URL, R = o.join(process.env.APP_ROOT, "dist-electron"), l = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = t ? o.join(process.env.APP_ROOT, "public") : l;
let e;
function r() {
  e = new s({
    icon: o.join(process.env.VITE_PUBLIC, "slate-logo.png"),
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
      contextIsolation: !0
    }
  }), d.setApplicationMenu(null), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), t ? e.loadURL(t) : e.loadFile(o.join(l, "index.html"));
}
n.on("window-minimize", () => e == null ? void 0 : e.minimize());
n.on("window-maximize", () => {
  e != null && e.isMaximized() ? e.unmaximize() : e == null || e.maximize();
});
n.on("window-close", () => e == null ? void 0 : e.close());
n.handle("window-is-maximized", () => (e == null ? void 0 : e.isMaximized()) ?? !1);
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), e = null);
});
i.on("activate", () => {
  s.getAllWindows().length === 0 && r();
});
i.whenReady().then(r);
export {
  R as MAIN_DIST,
  l as RENDERER_DIST,
  t as VITE_DEV_SERVER_URL
};
