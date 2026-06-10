// ── Clawd state API ───────────────────────────────────────────────────────────

const SESSION_ID = 'study-widget';
const AGENT_ID   = 'study-widget';

const STATE_MAP = {
  happy:        { state: 'attention',    event: 'Stop' },
  typing:       { state: 'working',      event: 'PreToolUse' },
  notification: { state: 'notification', event: 'Notification' },
  error:        { state: 'error',        event: 'PostToolUseFailure' },
  sleeping:     { state: 'sleeping',     event: 'SessionEnd' },
  sweeping:     { state: 'sweeping',     event: 'PreCompact' },
  juggling:     { state: 'juggling',     event: 'SubagentStart' },
};

async function postEvent(body) {
  try { await window.electronAPI.sendClawdEvent(body); } catch {}
}

async function sendBuilding() {
  const sessions = ['sw-build-1', 'sw-build-2', 'sw-build-3'];
  await Promise.all(sessions.map(sid =>
    postEvent({ state: 'working', event: 'PreToolUse', session_id: sid, agent_id: AGENT_ID })
  ));
  setTimeout(() =>
    Promise.all(sessions.map(sid =>
      postEvent({ state: 'sleeping', event: 'SessionEnd', session_id: sid, agent_id: AGENT_ID })
    )), 6000
  );
}

export async function sendClawd(type) {
  if (type === 'building')       { await sendBuilding(); return; }
  if (type === 'pomodoro-start') {
    await postEvent({ state: 'juggling', event: 'SubagentStart', session_id: 'study-widget-pomo', agent_id: AGENT_ID });
    return;
  }
  if (type === 'pomodoro-stop') {
    await postEvent({ state: 'sleeping', event: 'SessionEnd', session_id: 'study-widget-pomo', agent_id: AGENT_ID });
    return;
  }
  const mapped = STATE_MAP[type];
  if (!mapped) return;
  await postEvent({ ...mapped, session_id: SESSION_ID, agent_id: AGENT_ID });
}

// ── Speech bubble ─────────────────────────────────────────────────────────────

export async function showBubble(text, duration = 3500) {
  try {
    await fetch('http://127.0.0.1:23333/bubble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, duration }),
    });
  } catch {}
}

export { showBubble as sendBubbleToClawd };

// ── Messages ──────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const MSGS = {
  happy:        ['🎉 太棒了！又完成一个任务！', '✨ 你简直是任务终结机器！', '👍 完成啦~加油！', '🌟 做到了！继续保持！'],
  allDone:      ['🎊 今天所有任务全部完成！你最棒！✨', '🚀 完美收官！今天干得漂亮！', '💯 全部搞定！超厉害！'],
  typing:       ['📝 新任务来了，加油吧~', '⚡ 又有新任务，你能行的！', '✏️ 新的挑战加入！'],
  notification: ['⏰ 已经30分钟没完成任务啦，来动起来吧！', '🌿 休息够了吗？来做一个任务吧~'],
  building:     ['🔥 连续完成3个任务！超厉害！', '💎 三连击！太强了！'],
  error:        ['😰 有任务过期了，快去处理一下吧~', '😥 有任务过期了…先解决一件事就好~'],
  sleeping:     ['🌙 都这么晚了，注意休息哦~', '🌛 好好睡一觉，明天再加油！'],
  sweeping:     ['🧹 已完成的任务清理干净啦！', '✨ 清爽！轻装上阵！'],
  juggling:     ['🤹 同时推进多个任务，效率超高！', '💫 多线程作战，你太强了！'],
};

export function pickMessage(type) {
  const variants = MSGS[type];
  if (!variants) return null;
  return pick(variants);
}

export async function trigger(type, overrideText = null) {
  await sendClawd(type);
  const msg = overrideText || pickMessage(type);
  if (msg) await showBubble(msg);
}

// ── Greetings ─────────────────────────────────────────────────────────────────

export function getTimeGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return '早安宝贝~ 今天也要加油哦！';
  if (h >= 12 && h < 17) return '下午也要继续努力呀~';
  if (h >= 17 && h < 21) return '傍晚啦~ 今天进展怎么样？';
  return '晚上来啦~ 注意休息哦~';
}

