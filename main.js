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
let patWin         = null;
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
const CLAWD_H = 200;
const BUBBLE_W = 230;
const BUBBLE_H = 90;
const PAT_W = CLAWD_W;
const PAT_H = 44;

function readClawdWindowPos() {
  const candidates = [
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

// Pat capture: overlays Clawd's head area (same width, 44px tall, top-aligned)
function calcPatPos(cp) {
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
  return {
    x: Math.max(0, Math.min(cp.x, sw - PAT_W)),
    y: Math.max(0, cp.y),
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

// ── Pat capture window ────────────────────────────────────────────────────────

const PAT_PHRASES = [
  '嘿嘿好痒~',
  '再摸一下嘛(^▽^)',
  '今天的你超棒的',
  '咕嘟咕嘟~',
  '被宝贝摸到啦~',
  '嘿嘿嘿',
  '再来一次！',
  '你是我最爱的小主人~',
  '摸摸 power +1',
  '么么哒 💕',
  '今天也辛苦啦',
  '嘻嘻',
  '我喜欢你摸我',
  '再多摸一会儿嘛',
  '心情值 MAX！',
  '你最好啦~',
  '被宠爱的小螃蟹本蟹',
  '今天也要爱我哦',
  '哇~ 暖暖的',
  '我要被你宠坏啦',
  '你今天也很可爱哦~',
  '嗯嗯~感受到爱了！',
];

function ensurePatWindow() {
  if (patWin && !patWin.isDestroyed()) return;
  const { x, y } = calcPatPos(getCurrentClawdPos());
  patWin = new BrowserWindow({
    x, y, width: PAT_W, height: PAT_H,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, focusable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'pat-preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  patWin.loadFile(path.join(__dirname, 'pat.html'));
  patWin.setAlwaysOnTop(true, 'screen-saver');
  patWin.showInactive();
  patWin.on('closed', () => { patWin = null; });
}

ipcMain.on('pat-triggered', () => {
  const phrase = PAT_PHRASES[Math.floor(Math.random() * PAT_PHRASES.length)];
  doShowBubble(phrase, 3000);
  postClawdState({ state: 'attention', event: 'Stop', session_id: 'study-widget', agent_id: 'study-widget' });
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
      if (patWin && !patWin.isDestroyed()) {
        const { x, y } = calcPatPos(cp);
        patWin.setPosition(x, y);
      }
    } catch {}
  }, 500);
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const s = readSettings();
  let x = s.windowX ?? width - 336;
  let y = s.windowY ?? height - 676;
  if (x < 0 || x > width - 100)  x = width - 336;
  if (y < 0 || y > height - 100) y = height - 576;

  mainWindow = new BrowserWindow({
    width: 320, height: 660, x, y,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: false, skipTaskbar: false, backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });

  let moveTimer;
  mainWindow.on('moved', () => {
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      if (!mainWindow) return;
      const [wx, wy] = mainWindow.getPosition();
      writeSettings({ windowX: wx, windowY: wy });
    }, 500);
  });

  mainWindow.on('focus', () => mainWindow.webContents.focus());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  ensurePatWindow();
  startPositionTracking();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

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
