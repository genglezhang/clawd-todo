'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

async function findClawdDir() {
  const candidates = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'clawd-on-desk'),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Clawd on Desk'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Clawd on Desk'),
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  try {
    const exePath = execSync(
      'powershell -Command "Get-Process \'Clawd*\' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Path"',
      { encoding: 'utf8', timeout: 5000 }
    ).trim();
    if (exePath && fs.existsSync(exePath)) return path.dirname(exePath);
  } catch (_) {}

  const dir = await askUser('请输入 Clawd 安装路径: ');
  if (dir && fs.existsSync(dir)) return dir;

  console.log('请先安装 Clawd：https://github.com/rullerzhou-afk/clawd-on-desk/releases');
  process.exit(1);
}

function askUser(prompt) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, answer => { rl.close(); resolve(answer.trim()); });
  });
}

function findHtmlWithCanvas(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findHtmlWithCanvas(full);
      if (found) return found;
    } else if (entry.name.endsWith('.html')) {
      const src = fs.readFileSync(full, 'utf8');
      if (src.includes('<canvas') || /pet/i.test(src)) return full;
    }
  }
  return null;
}

async function main() {
  const clawdDir = await findClawdDir();
  console.log(`找到 Clawd 目录：${clawdDir}`);

  const asarPath = path.join(clawdDir, 'resources', 'app.asar');
  if (!fs.existsSync(asarPath)) {
    console.error(`找不到 app.asar：${asarPath}`);
    process.exit(1);
  }

  // Backup
  const backupPath = asarPath + '.backup';
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(asarPath, backupPath);
    console.log('已备份 app.asar');
  } else {
    console.log('备份已存在，跳过');
  }

  // Unpack
  const asar = require('@electron/asar');
  const tempDir = path.join(os.tmpdir(), 'clawd-patch-temp');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  asar.extractAll(asarPath, tempDir);
  console.log('已解包 asar');

  // Patch server.js
  const serverPath = path.join(tempDir, 'src', 'server.js');
  if (!fs.existsSync(serverPath)) {
    console.error('找不到 src/server.js');
    process.exit(1);
  }
  let serverSrc = fs.readFileSync(serverPath, 'utf8');
  if (!serverSrc.includes('CLAWD_TODO_PATCH')) {
    const insert = `// CLAWD_TODO_PATCH
if (req.method === 'OPTIONS') {
  res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
  res.end(); return;
}
if (req.method === 'POST' && req.url === '/bubble') {
  res.setHeader('Access-Control-Allow-Origin','*');
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    try { const {text,duration=3000} = JSON.parse(body); const {BrowserWindow} = require('electron'); BrowserWindow.getAllWindows().forEach(w => w.webContents.send('show-bubble',{text,duration})); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true})); } catch(e) { res.writeHead(400); res.end(); }
  }); return;
}
`;
    const m = serverSrc.match(/if\s*\(req\.(method|url)/);
    if (!m) { console.error('找不到请求路由 if 语句'); process.exit(1); }
    const idx = serverSrc.indexOf(m[0]);
    serverSrc = serverSrc.slice(0, idx) + insert + serverSrc.slice(idx);
    fs.writeFileSync(serverPath, serverSrc, 'utf8');
    console.log('已修补 server.js');
  } else {
    console.log('server.js 已有补丁，跳过');
  }

  // Patch HTML
  const htmlPath = findHtmlWithCanvas(tempDir);
  if (!htmlPath) { console.error('找不到渲染 HTML 文件'); process.exit(1); }
  console.log(`找到渲染 HTML：${htmlPath}`);

  let htmlSrc = fs.readFileSync(htmlPath, 'utf8');
  if (!htmlSrc.includes('CLAWD_TODO_BUBBLE')) {
    const bubble = `<!-- CLAWD_TODO_BUBBLE -->
<style>
#clawd-bubble{display:none;position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:#fff;border:2px solid #000;border-radius:18px;padding:8px 14px;max-width:200px;font-size:14px;line-height:1.5;text-align:center;word-break:break-word;z-index:9999;pointer-events:none;transition:opacity .3s ease;}
#clawd-bubble::after{content:'';position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);border-width:10px 8px 0;border-style:solid;border-color:#000 transparent transparent;}
#clawd-bubble::before{content:'';position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);border-width:8px 6px 0;border-style:solid;border-color:#fff transparent transparent;z-index:1;}
</style>
<div id="clawd-bubble"></div>
<script>
(function(){
  var bubble=document.getElementById('clawd-bubble');
  var timer=null;
  var phrases=['嘿嘿好痒~','再摸一下嘛','今天的你超棒的','咕嘟咕嘟~','被宝贝摸到啦~','嘿嘿嘿','再来一次！','你是我最爱的小主人~','摸摸power+1','么么哒💕','今天也辛苦啦','嘻嘻','我喜欢你摸我','再多摸一会儿嘛','你最好啦~','被宠爱的小螃蟹本蟹','今天也要爱我哦','哇~暖暖的','我要被你宠坏啦','(◕ᴗ◕✿)','啊呜~','想你了','再多陪陪我嘛','最喜欢你了！','你超可爱的','我心动了(｡♡‿♡｡)','主人主人~','今天也元气满满','呼呼~好暖','想钻进你怀里','(づ｡◕‿‿◕｡)づ','么么么么么','再来啊~','你身上香香的','最棒的就是你','世界第一好','我会一直陪你','轻一点啦~','~(´▽`)~','啾咪✨'];
  function showBubble(text,duration){
    if(timer)clearTimeout(timer);
    bubble.textContent=text;
    bubble.style.display='block';
    bubble.style.opacity='1';
    timer=setTimeout(function(){bubble.style.opacity='0';setTimeout(function(){bubble.style.display='none';},300);},duration||3000);
  }
  document.addEventListener('click',function(e){
    var el=e.target;
    var hit=el.tagName==='CANVAS'||el.closest('[class*="pet"]')||el.closest('[id*="pet"]')||el.closest('[class*="crab"]')||el.closest('[id*="crab"]');
    if(hit)showBubble(phrases[Math.floor(Math.random()*phrases.length)],3000);
  });
  if(typeof require!=='undefined'){
    try{var ipc=require('electron').ipcRenderer;ipc.on('show-bubble',function(e,d){showBubble(d.text,d.duration);});}catch(e){}
  }
})();
</script>`;
    htmlSrc = htmlSrc.replace('</body>', bubble + '\n</body>');
    fs.writeFileSync(htmlPath, htmlSrc, 'utf8');
    console.log('已注入气泡 UI');
  } else {
    console.log('HTML 已有气泡注入，跳过');
  }

  // Repack
  await asar.createPackage(tempDir, asarPath);
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('已重新打包 asar，已清理临时目录');

  // Kill & restart if running
  try {
    const exePath = execSync(
      'powershell -Command "Get-Process \'Clawd*\' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Path"',
      { encoding: 'utf8', timeout: 5000 }
    ).trim();
    if (exePath) {
      execSync('powershell -Command "Get-Process \'Clawd*\' -ErrorAction SilentlyContinue | Stop-Process -Force"', { timeout: 5000 });
      console.log('已关闭 Clawd，正在重启…');
      setTimeout(() => {
        spawnSync('powershell', ['-Command', `Start-Process '${exePath}'`]);
        console.log('✅ 补丁安装成功！小螃蟹现在会说话啦 🦀');
      }, 1200);
      return;
    }
  } catch (_) {}

  console.log('✅ 补丁安装成功！小螃蟹现在会说话啦 🦀');
}

main().catch(err => {
  console.error('❌ 安装失败：', err.message);
  process.exit(1);
});
