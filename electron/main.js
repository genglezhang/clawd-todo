const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');

const isDev = !app.isPackaged;
const DATA_FILE     = path.join(app.getPath('userData'), 'study-tasks.json');
const SETTINGS_FILE = path.join(app.getPath('userData'), 'app-settings.json');
const HISTORY_FILE  = path.join(app.getPath('userData'), 'study-history.json');

let mainWindow;
let bubbleWin      = null;
let bubbleHideTimer = null;

// ── Settings helpers ──────────────────────────────────────────────────────────

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE))
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch (e) { console.error('read-settings:', e); }
  return {};
}

function writeSettings(patch) {
  try {
    const current = readSettings();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...current, ...patch }, null, 2), 'utf-8');
  } catch (e) { console.error('write-settings:', e); }
}

// ── Clawd position ────────────────────────────────────────────────────────────

const CLAWD_W = 160;
const BUBBLE_W = 230;
const BUBBLE_H = 90;

function readClawdWindowPos() {
  const candidates = [
    path.join(os.homedir(), 'AppData', 'Roaming', 'clawd-on-desk', 'clawd-prefs.json'),
    path.join(os.homedir(), '.clawd', 'prefs.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'Clawd on Desk', 'prefs.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'clawd-on-desk', 'prefs.json'),
  ];
  for (const p of candidates) {
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (typeof raw.windowX === 'number' && typeof raw.windowY === 'number')
        return { x: raw.windowX, y: raw.windowY };
      if (typeof raw.x === 'number' && typeof raw.y === 'number')
        return { x: raw.x, y: raw.y };
    } catch {}
  }
  return null;
}

function getCurrentClawdPos() {
  const auto = readClawdWindowPos();
  if (auto) return auto;
  const s = readSettings();
  if (s.clawdX != null) return { x: s.clawdX, y: s.clawdY };
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  return { x: sw - 200, y: sh - 520 };
}

// Bubble: centered directly above Clawd's head
function calcBubblePos(cp) {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  let bx = cp.x + Math.floor(CLAWD_W / 2) - Math.floor(BUBBLE_W / 2);
  let by = cp.y - BUBBLE_H + 24;
  return {
    x: Math.max(4, Math.min(bx, sw - BUBBLE_W - 4)),
    y: Math.max(4, Math.min(by, sh - BUBBLE_H - 4)),
  };
}

// ── Bubble window ─────────────────────────────────────────────────────────────

function ensureBubbleWindow() {
  if (bubbleWin && !bubbleWin.isDestroyed()) return;
  const { x, y } = calcBubblePos(getCurrentClawdPos());
  bubbleWin = new BrowserWindow({
    x, y, width: BUBBLE_W, height: BUBBLE_H,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, focusable: false, show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'bubble-preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  bubbleWin.loadFile(path.join(__dirname, 'bubble.html'));
  bubbleWin.on('closed', () => { bubbleWin = null; });
}

ipcMain.on('bubble-size', (_, { w, h }) => {
  if (bubbleWin && !bubbleWin.isDestroyed())
    bubbleWin.setSize(Math.max(120, Math.min(w, 260)), Math.max(60, Math.min(h, 160)));
});

function doShowBubble(text, duration) {
  ensureBubbleWindow();
  if (!bubbleWin || bubbleWin.isDestroyed()) return;
  const { x, y } = calcBubblePos(getCurrentClawdPos());
  bubbleWin.setPosition(x, y);
  bubbleWin.webContents.send('bubble-show', text);
  bubbleWin.showInactive();
  bubbleWin.setAlwaysOnTop(true, 'screen-saver');
  if (bubbleHideTimer) clearTimeout(bubbleHideTimer);
  bubbleHideTimer = setTimeout(() => {
    if (bubbleWin && !bubbleWin.isDestroyed()) {
      bubbleWin.webContents.send('bubble-hide');
      setTimeout(() => {
        if (bubbleWin && !bubbleWin.isDestroyed()) bubbleWin.hide();
      }, 400);
    }
  }, Math.max(600, duration - 400));
}

ipcMain.handle('show-bubble', (_, { text, duration = 3500 }) => {
  doShowBubble(text, duration);
  return true;
});

// ── Position tracking (500 ms) ────────────────────────────────────────────────

function startPositionTracking() {
  setInterval(() => {
    const cp = getCurrentClawdPos();
    try {
      if (bubbleWin && !bubbleWin.isDestroyed() && bubbleWin.isVisible()) {
        const { x, y } = calcBubblePos(cp);
        bubbleWin.setPosition(x, y);
      }
    } catch {}
  }, 500);
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const s = readSettings();
  const savedW = s.windowW ?? 380;
  const savedH = s.windowH ?? 650;
  let x = s.windowX ?? (width  - savedW - 16);
  let y = s.windowY ?? (height - savedH - 26);
  if (x < 0 || x > width  - 100) x = width  - savedW - 16;
  if (y < 0 || y > height - 100) y = height - savedH - 26;

  mainWindow = new BrowserWindow({
    width: savedW, height: savedH, x, y,
    minWidth: 280, minHeight: 450,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: true, skipTaskbar: false, backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Apply saved opacity
  if (typeof s.opacity === 'number') {
    mainWindow.setOpacity(Math.max(0.1, Math.min(1, s.opacity)));
  }

  let moveTimer;
  mainWindow.on('moved', () => {
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      if (!mainWindow) return;
      const [wx, wy] = mainWindow.getPosition();
      writeSettings({ windowX: wx, windowY: wy });
    }, 500);
  });

  let resizeTimer;
  mainWindow.on('resized', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!mainWindow) return;
      const [ww, wh] = mainWindow.getSize();
      writeSettings({ windowW: ww, windowH: wh });
    }, 500);
  });

  mainWindow.on('focus', () => mainWindow.webContents.focus());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    startPositionTracking();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

// ── IPC: task data ────────────────────────────────────────────────────────────

ipcMain.handle('read-data', () => {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) { console.error('read-data:', e); }
  return { subjects: [] };
});

ipcMain.handle('write-data', (_, data) => {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8'); return true; }
  catch (e) { console.error('write-data:', e); return false; }
});

ipcMain.handle('read-settings',  ()         => readSettings());
ipcMain.handle('write-settings', (_, patch) => { writeSettings(patch); return true; });

ipcMain.handle('read-history', () => {
  try {
    if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch (e) { console.error('read-history:', e); }
  return [];
});

ipcMain.handle('write-history', (_, data) => {
  try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8'); return true; }
  catch (e) { console.error('write-history:', e); return false; }
});

ipcMain.handle('get-startup', () => app.getLoginItemSettings().openAtLogin);

ipcMain.handle('set-startup', (_, enable) => {
  app.setLoginItemSettings({ openAtLogin: Boolean(enable) });
  writeSettings({ launchAtStartup: Boolean(enable) });
  return true;
});

ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('close-window',    () => mainWindow?.close());

ipcMain.handle('set-opacity', (_, value) => {
  if (mainWindow) mainWindow.setOpacity(Math.max(0.1, Math.min(1, value)));
  writeSettings({ opacity: value });
  return true;
});

// ── Clawd state API ───────────────────────────────────────────────────────────

function readClawdPort() {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.clawd', 'runtime.json'), 'utf-8'));
    const port = Number(raw?.port);
    if (Number.isInteger(port) && port >= 23333 && port <= 23337) return port;
  } catch {}
  return 23333;
}

function postClawdState(body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const preferred = readClawdPort();
    const ports = [preferred, ...Array.from({ length: 5 }, (_, i) => 23333 + i).filter(p => p !== preferred)];
    function tryPort(idx) {
      if (idx >= ports.length) { resolve(false); return; }
      const req = http.request(
        { hostname: '127.0.0.1', port: ports[idx], path: '/state', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, timeout: 300 },
        (res) => { res.resume(); resolve(true); }
      );
      req.on('error', () => tryPort(idx + 1));
      req.on('timeout', () => { req.destroy(); tryPort(idx + 1); });
      req.end(payload);
    }
    tryPort(0);
  });
}

ipcMain.handle('clawd-event', (_, body) => postClawdState(body));
