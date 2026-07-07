// 聚会卡堂 主程序：大厅 / 房间 / 游戏运行时
import { $, el, clear, toast, modal, showResult, avatarOf, pick, rndInt } from './core/util.js';
import { audio } from './core/audio.js';
import { OnlineRoom, defaultServerUrl, saveServerUrl } from './core/net.js';
import werewolf from './games/werewolf.js';
import sanguosha from './games/sanguosha.js';
import uno from './games/uno.js';
import doudizhu from './games/doudizhu.js';
import monopoly from './games/monopoly.js';

const GAMES = [werewolf, sanguosha, uno, doudizhu, monopoly];
const BOT_NAMES = ['阿呆', '铁蛋', '翠花', '二狗', '喵酱', '大聪明', '小机灵', '木头', '皮蛋', '汤圆', '毛豆'];
const RAND_NAMES = ['快乐小狗', '月亮邮差', '柠檬气泡', '打盹的猫', '风一样的人', '干饭王', '夜色玩家', '扑克脸', '开心果', '锦鲤本鲤'];

// ---------------- 全局状态 ----------------
const S = {
  name: localStorage.getItem('jk_name') || pick(RAND_NAMES),
  room: null,          // OnlineRoom 或 null（单机）
  local: false,        // 是否单机
  gameMod: null,       // 当前游戏模块
  seats: [],           // [{id, name, ai}]
  myId: 'p1',
  engine: null,
  aiTimers: {},        // pid -> timeout id
  latestView: {},      // pid -> 最近视图（供 AI 接管）
  takenOver: new Set(),// 已由 AI 接管的人类座位
  resultShown: false,
};

// ---------------- 界面切换 ----------------
function show(name) {
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('active');
  $('#scr-' + name).classList.add('active');
}

// ---------------- 大厅 ----------------
function initLobby() {
  const inp = $('#inp-name');
  inp.value = S.name;
  inp.onchange = () => { S.name = inp.value.trim() || pick(RAND_NAMES); localStorage.setItem('jk_name', S.name); };
  $('#btn-dice-name').onclick = () => { audio.play('click'); inp.value = S.name = pick(RAND_NAMES); localStorage.setItem('jk_name', S.name); };

  const grid = $('#game-grid');
  clear(grid);
  GAMES.forEach((g, i) => {
    const card = el('div', 'game-card' + (i === 0 ? ' wide' : ''));
    card.style.background = g.theme;
    card.innerHTML = `<div class="gc-icon">${g.icon}</div>
      <div class="gc-name">${g.name}</div>
      <div class="gc-desc">${g.desc}</div>
      <div class="gc-players">👥 ${g.minPlayers === g.maxPlayers ? g.minPlayers + ' 人' : g.minPlayers + '-' + g.maxPlayers + ' 人'} · 支持单机 AI / 在线联机</div>`;
    card.onclick = () => { audio.play('click'); openModeModal(g); };
    grid.appendChild(card);
  });

  $('#btn-settings').onclick = openSettings;
  $('#btn-help').onclick = openHelpList;
}

function openModeModal(g) {
  const body = el('div', 'm-body');
  body.innerHTML = `<p style="text-align:center;margin-bottom:6px">${g.icon} ${g.desc}</p>`;
  let count = g.defaultPlayers;
  if (g.minPlayers !== g.maxPlayers) {
    const row = el('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:center;margin:10px 0;flex-wrap:wrap';
    row.appendChild(el('span', '', '单机人数：'));
    const btns = [];
    for (let n = g.minPlayers; n <= g.maxPlayers; n++) {
      const b = el('button', 'sec-btn', n + '人');
      b.style.padding = '6px 12px';
      if (n === count) b.style.background = 'rgba(255,215,106,.3)';
      b.onclick = () => { count = n; btns.forEach(x => x.style.background = ''); b.style.background = 'rgba(255,215,106,.3)'; audio.play('select'); };
      btns.push(b); row.appendChild(b);
    }
    body.appendChild(row);
  }
  modal({
    title: g.icon + ' ' + g.name,
    body,
    buttons: [
      { text: '🤖 单机开玩', cls: 'act-btn warm', cb: () => startLocal(g, count) },
      { text: '🌐 创建房间', cls: 'act-btn', cb: () => createRoom(g) },
      { text: '🔑 加入房间', cls: 'act-btn plain', cb: () => joinRoomDialog() },
      { text: '📖 玩法', cls: 'ghost-btn', cb: () => modal({ title: g.name + ' 玩法', body: g.help, buttons: [{ text: '知道了' }] }) },
    ],
  });
}

function openSettings() {
  const body = el('div', 'm-body');
  body.innerHTML = `<p>联机服务器地址（WebSocket）：</p>`;
  const inp = el('input', 'modal-input');
  inp.style.cssText = 'letter-spacing:0;font-size:15px;text-align:left';
  inp.value = defaultServerUrl();
  body.appendChild(inp);
  body.innerHTML += `<p style="font-size:12px;color:#9aa0b8;margin-top:8px">
  💡 默认连接当前网页所在的服务器，通常无需修改。<br>
  ① <b>局域网</b>：一位玩家电脑运行 <code>npm start</code>（或双击一键开服），其他人连同一 WiFi 访问其 IP:3000；<br>
  ② <b>Cloudflare / 云服务器</b>：部署后直接用该网址开房即可。<br>
  ⚠️ HTTPS 页面只能连 <code>wss://</code> 地址，HTTP 页面用 <code>ws://</code>。</p>`;
  body.insertBefore(inp, body.children[1]);
  modal({
    title: '⚙️ 联机设置', body,
    buttons: [{ text: '保存', cb: () => { saveServerUrl(inp.value.trim()); toast('已保存联机地址'); } }, { text: '取消', cls: 'act-btn plain' }],
  });
}

function openHelpList() {
  const body = el('div', 'm-body');
  GAMES.forEach(g => {
    const b = el('button', 'sec-btn', g.icon + ' ' + g.name);
    b.style.cssText = 'display:block;width:100%;margin:6px 0';
    b.onclick = () => modal({ title: g.name + ' 玩法', body: g.help, buttons: [{ text: '知道了' }] });
    body.appendChild(b);
  });
  modal({ title: '📖 玩法帮助', body, buttons: [{ text: '关闭', cls: 'act-btn plain' }] });
}

// ---------------- 单机 ----------------
function startLocal(g, count) {
  S.local = true; S.room = null; S.gameMod = g; S.myId = 'p1';
  const seats = [{ id: 'p1', name: S.name, ai: false }];
  const names = [...BOT_NAMES].sort(() => Math.random() - .5);
  for (let i = 1; i < count; i++) seats.push({ id: 'b' + i, name: names[i % names.length], ai: true });
  S.seats = seats;
  beginGame();
}

// ---------------- 在线房间 ----------------
let roomBots = []; // 房主侧管理的机器人

async function createRoom(g) {
  try {
    toast('正在连接服务器…');
    const room = new OnlineRoom();
    await room.connect({ create: true, name: S.name });
    S.room = room; S.local = false; S.gameMod = g; S.myId = room.myId;
    roomBots = [];
    bindRoom(room);
    renderRoom();
    show('room');
  } catch (e) { toast('❌ ' + e.message, 3000); }
}

function joinRoomDialog() {
  const inp = el('input', 'modal-input');
  inp.placeholder = '房间号'; inp.maxLength = 4; inp.inputMode = 'numeric';
  modal({
    title: '🔑 加入房间', body: inp,
    buttons: [{
      text: '加入', cb: async () => {
        const code = inp.value.trim();
        if (!/^\d{4}$/.test(code)) return toast('请输入 4 位房间号');
        try {
          toast('正在连接服务器…');
          const room = new OnlineRoom();
          await room.connect({ join: code, name: S.name });
          S.room = room; S.local = false; S.myId = room.myId; S.gameMod = null;
          bindRoom(room);
          renderRoom();
          show('room');
        } catch (e) { toast('❌ ' + e.message, 3000); }
      }
    }, { text: '取消', cls: 'act-btn plain' }],
  });
  setTimeout(() => inp.focus(), 100);
}

function bindRoom(room) {
  room.onHumans = () => {
    if (room.isHost) syncSeats();
    renderRoom();
    // 游戏中有人离开 → AI 接管
    if (room.isHost && S.engine) {
      const alive = new Set(room.humans.map(h => h.id));
      for (const s of S.seats) {
        if (!s.ai && s.id !== S.myId && !alive.has(s.id) && !S.takenOver.has(s.id)) {
          S.takenOver.add(s.id);
          toast(`${s.name} 已离线，由 AI 接管`);
          if (S.latestView[s.id]) scheduleAI(s.id, S.latestView[s.id]);
        }
      }
    }
  };
  room.onClosed = (msg) => {
    toast(msg, 3000);
    cleanupGame();
    S.room = null;
    show('lobby');
  };
  room.onData = (from, d) => {
    if (d.t === 'seats') { S.seats = d.seats; if (d.game) S.gameMod = GAMES.find(g => g.id === d.game); renderRoom(); }
    else if (d.t === 'start') {
      S.seats = d.seats; S.gameMod = GAMES.find(g => g.id === d.game);
      beginGame(true); // 非房主：只切界面等视图
    }
    else if (d.t === 'view') renderView(d.v);
    else if (d.t === 'act' && S.engine && room.isHost) S.engine.onAction(from, d.a);
  };
}

function syncSeats() {
  const room = S.room;
  S.seats = [
    ...room.humans.map(h => ({ id: h.id, name: h.name, ai: false })),
    ...roomBots,
  ];
  room.broadcast({ t: 'seats', seats: S.seats, game: S.gameMod ? S.gameMod.id : null });
}

function renderRoom() {
  const room = S.room;
  if (!room) return;
  $('#room-title').textContent = (S.gameMod ? S.gameMod.icon + ' ' + S.gameMod.name : '🎲 等待房主选择') + ' · 房间';
  $('#room-code').textContent = room.code || '----';
  const list = $('#seat-list');
  clear(list);
  for (const s of S.seats) {
    const seat = el('div', 'seat' + (s.id === room.hostId ? ' host' : ''));
    seat.appendChild(el('div', 's-avatar', s.ai ? '🤖' : avatarOf(s.id)));
    seat.appendChild(el('div', 's-name', s.name + (s.id === S.myId ? '（我）' : '')));
    list.appendChild(seat);
  }
  const isHost = room.isHost;
  $('#btn-add-bot').style.display = isHost ? '' : 'none';
  $('#btn-del-bot').style.display = isHost ? '' : 'none';
  $('#btn-start').style.display = isHost ? '' : 'none';
  $('#room-tip').textContent = isHost
    ? '把房间号告诉好友；人数不足可以加机器人陪玩'
    : '等待房主开始游戏…';
}

function initRoomButtons() {
  $('#btn-copy-code').onclick = async () => {
    try { await navigator.clipboard.writeText($('#room-code').textContent); toast('房间号已复制'); }
    catch { toast('房间号：' + $('#room-code').textContent); }
  };
  $('#btn-add-bot').onclick = () => {
    const g = S.gameMod;
    if (!g) return;
    if (S.seats.length >= g.maxPlayers) return toast('人数已达上限');
    const used = new Set(roomBots.map(b => b.name));
    const name = BOT_NAMES.find(n => !used.has(n)) || ('机器人' + (roomBots.length + 1));
    roomBots.push({ id: 'b' + Date.now() % 100000 + '_' + roomBots.length, name, ai: true });
    audio.play('click'); syncSeats(); renderRoom();
  };
  $('#btn-del-bot').onclick = () => {
    if (roomBots.length) { roomBots.pop(); audio.play('click'); syncSeats(); renderRoom(); }
  };
  $('#btn-start').onclick = () => {
    const g = S.gameMod, room = S.room;
    if (!g || !room) return;
    let seats = [...room.humans.map(h => ({ id: h.id, name: h.name, ai: false })), ...roomBots];
    if (seats.length > g.maxPlayers) return toast(`${g.name} 最多 ${g.maxPlayers} 人，请移除多余机器人`);
    // 人数不足自动补机器人
    let n = 0;
    while (seats.length < g.minPlayers) {
      seats.push({ id: 'bf' + n, name: BOT_NAMES[(roomBots.length + n) % BOT_NAMES.length] + '·补', ai: true });
      n++;
    }
    if (n > 0) toast(`已自动补入 ${n} 个机器人`);
    S.seats = seats;
    room.lock(true);
    room.broadcast({ t: 'start', game: g.id, seats });
    beginGame();
  };
  $('#btn-leave-room').onclick = () => {
    if (S.room) { S.room.leave(); S.room = null; }
    cleanupGame();
    show('lobby');
  };
}

// ---------------- 游戏运行时 ----------------
function beginGame(asClient = false) {
  const g = S.gameMod;
  cleanupGame(false);
  $('#game-title').textContent = g.icon + ' ' + g.name;
  clear($('#game-root'));
  S.resultShown = false;
  S.latestView = {};
  S.takenOver = new Set();
  show('game');
  audio.play('turn');

  const amHost = S.local || (S.room && S.room.isHost);
  if (amHost && !asClient) {
    const emit = (target, view) => {
      const deliver = (pid) => {
        S.latestView[pid] = view;
        const seat = S.seats.find(x => x.id === pid);
        if (!seat) return;
        if (pid === S.myId) renderView(view);
        else if (seat.ai || S.takenOver.has(pid)) scheduleAI(pid, view);
        else if (S.room) S.room.sendTo(pid, { t: 'view', v: view });
      };
      if (target === 'all') S.seats.forEach(s => deliver(s.id));
      else deliver(target);
    };
    S.engine = g.createEngine(S.seats.map(s => ({ id: s.id, name: s.name, ai: !!s.ai })), emit);
    S.engine.start();
  }
}

function scheduleAI(pid, view) {
  S.latestView[pid] = view;
  if (S.aiTimers[pid]) return; // 已有待执行的思考
  S.aiTimers[pid] = setTimeout(() => {
    delete S.aiTimers[pid];
    if (!S.engine) return;
    const v = S.latestView[pid];
    try {
      S.gameMod.ai(v, (action) => { if (S.engine) S.engine.onAction(pid, action); });
    } catch (e) { console.error('AI 出错', pid, e); }
  }, rndInt(1300, 2800)); // 拟真思考节奏，单机不催促
}

function sendAction(a) {
  if (S.engine) S.engine.onAction(S.myId, a);           // 房主/单机
  else if (S.room) S.room.sendTo(S.room.hostId, { t: 'act', a }); // 客户端
}

function renderView(view) {
  const root = $('#game-root');
  const ctx = {
    myId: S.myId,
    seats: S.seats,
    audio,
    nameOf: (pid) => { const s = S.seats.find(x => x.id === pid); return s ? s.name : pid; },
    avatarOf: (pid) => { const s = S.seats.find(x => x.id === pid); return (s && s.ai) ? '🤖' : avatarOf(pid); },
    isMe: (pid) => pid === S.myId,
  };
  try { S.gameMod.render(root, view, sendAction, ctx); }
  catch (e) { console.error('渲染出错', e); }
  if (view.sfx) {
    audio.play(view.sfx);
    // 重击类音效附带震屏
    if (['bomb', 'hurt', 'shoot'].includes(view.sfx)) {
      root.classList.remove('screen-shake');
      void root.offsetWidth;
      root.classList.add('screen-shake');
    }
  }

  // 统一的对局结束遮罩
  const old = root.querySelector('.result-layer');
  if (view.result && !S.resultShown) {
    S.resultShown = true;
    audio.play(view.result.win ? 'win' : 'lose');
    const btns = [];
    const amHost = S.local || (S.room && S.room.isHost);
    if (amHost) btns.push({ text: '🔄 再来一局', cls: 'act-btn warm', cb: () => rematch() });
    btns.push({ text: S.local ? '🏠 返回大厅' : '🚪 返回房间', cls: 'act-btn plain', cb: () => exitToBase() });
    showResult(root, view.result, btns);
  } else if (!view.result && old) { old.remove(); S.resultShown = false; }
}

function rematch() {
  if (S.local || (S.room && S.room.isHost)) {
    if (S.room) S.room.broadcast({ t: 'start', game: S.gameMod.id, seats: S.seats });
    beginGame();
  }
}

function exitToBase() {
  cleanupGame();
  if (S.local || !S.room) { S.local = false; show('lobby'); }
  else {
    if (S.room.isHost) { S.room.lock(false); syncSeats(); }
    renderRoom();
    show('room');
  }
}

function cleanupGame(full = true) {
  for (const k in S.aiTimers) clearTimeout(S.aiTimers[k]);
  S.aiTimers = {};
  if (S.engine && S.engine.destroy) try { S.engine.destroy(); } catch {}
  S.engine = null;
  if (full) clear($('#game-root'));
}

// ---------------- 顶栏 ----------------
function initTopBar() {
  $('#btn-exit-game').onclick = () => {
    modal({
      title: '退出对局？',
      body: S.local ? '<p style="text-align:center">当前进度将丢失</p>' : '<p style="text-align:center">你离开后将由 AI 接管你的位置</p>',
      buttons: [
        { text: '确认退出', cls: 'act-btn warm', cb: () => exitToBase() },
        { text: '继续游戏', cls: 'act-btn plain' },
      ],
    });
  };
  $('#btn-sound').onclick = () => {
    const on = audio.toggle();
    $('#btn-sound').textContent = on ? '🔊' : '🔇';
    if (on) audio.play('click');
  };
  $('#btn-sound').textContent = audio.enabled ? '🔊' : '🔇';
  $('#game-title').onclick = () => {
    if (S.gameMod) modal({ title: S.gameMod.name + ' 玩法', body: S.gameMod.help, buttons: [{ text: '知道了' }] });
  };
}

// ---------------- 启动 ----------------
initLobby();
initRoomButtons();
initTopBar();
