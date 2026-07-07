// ===== UNO 优诺牌 =====
import { el, clear, shuffle, modal, pick } from '../core/util.js';

// ---------- 样式（模块自带） ----------
const CSS = `
.uno-stage { position:absolute; inset:0; display:flex; flex-direction:column;
  background: radial-gradient(ellipse at 50% 30%, #24123f, #0d0a1c 75%); }
.uno-opps { display:flex; justify-content:space-evenly; padding: 84px 6px 6px; }
.uno-center { flex:1; display:flex; align-items:center; justify-content:center; gap:26px; position:relative; }
.ucard { width:58px; height:88px; border-radius:10px; position:relative; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 4px 10px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.4); border:3px solid #fff;
  font-weight:900; color:#fff; transition: transform .15s;
  transform: rotate(var(--rot, 0deg)); }
.ucard::before { content:''; position:absolute; inset:0; border-radius:7px; pointer-events:none; z-index:2;
  background: linear-gradient(115deg, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,.1) 100%); }
.ucard .uc-mid { font-size:30px; text-shadow:0 2px 4px rgba(0,0,0,.4); background:rgba(255,255,255,.18);
  width:44px; height:64px; border-radius:50% / 42%; display:flex; align-items:center; justify-content:center; transform:rotate(-12deg); }
.ucard .uc-tl,.ucard .uc-br { position:absolute; font-size:13px; text-shadow:0 1px 2px rgba(0,0,0,.5); }
.ucard .uc-tl { top:4px; left:6px; } .ucard .uc-br { bottom:4px; right:6px; }
.ucard.cr { background:linear-gradient(150deg,#ff4b4b,#c81e1e); }
.ucard.cg { background:linear-gradient(150deg,#4bd964,#1a9c37); }
.ucard.cb { background:linear-gradient(150deg,#3f8bff,#1d51c8); }
.ucard.cy { background:linear-gradient(150deg,#ffd24b,#e0a400); color:#4a3800; }
.ucard.cy .uc-mid { text-shadow:none; }
.ucard.cw { background:conic-gradient(#ff4b4b 0 25%, #ffd24b 0 50%, #4bd964 0 75%, #3f8bff 0); }
.ucard.cw .uc-mid { background:rgba(20,20,30,.75); font-size:20px; }
.ucard.back { background:linear-gradient(150deg,#1a1a2a,#000); }
.ucard.back .uc-mid { background:linear-gradient(120deg,#ff4b4b,#ffd24b,#4bd964,#3f8bff);
  -webkit-background-clip:text; background-clip:text; color:transparent; font-size:16px; transform:rotate(-18deg); }
.ucard.mini { width:40px; height:60px; border-width:2px; }
.ucard.mini .uc-mid { font-size:18px; width:30px; height:44px; }
.uno-hand { display:flex; overflow-x:auto; padding:18px 12px 14px; gap:-10px; min-height:126px; align-items:flex-end; }
.uno-hand .ucard { margin-right:-16px; }
.uno-hand .ucard.ok { transform:rotate(var(--rot,0deg)) translateY(-14px);
  box-shadow:0 0 18px rgba(255,255,255,.75), 0 8px 14px rgba(0,0,0,.5); z-index:2; }
.uno-hand .ucard.dim { filter:brightness(.45); }
.uno-pile { position:relative; }
.uno-top-glow { border-radius:14px; padding:6px; transition: box-shadow .4s; position:relative; }
.uno-top-glow::after { content:''; position:absolute; inset:-14px; border-radius:26px; z-index:-1;
  background: conic-gradient(#ff4b4b, #ffd24b, #4bd964, #3f8bff, #ff4b4b);
  filter: blur(16px); opacity:.4; animation: unospin 7s linear infinite; }
.uno-dir { position:absolute; font-size:40px; opacity:.5; animation: unospin 3s linear infinite; pointer-events:none; }
@keyframes unospin { to { transform:rotate(360deg); } }
.uno-dir.rev { animation-direction: reverse; }
.uno-color-dot { position:absolute; bottom:-26px; left:50%; transform:translateX(-50%); font-size:13px;
  padding:3px 12px; border-radius:12px; color:#fff; font-weight:700; white-space:nowrap; }
.uno-shout { position:absolute; left:50%; top:38%; transform:translate(-50%,-50%) rotate(-8deg);
  font-size:56px; font-weight:900; letter-spacing:4px; z-index:60; pointer-events:none;
  background:linear-gradient(120deg,#ff4b4b,#ffd24b,#4bd964,#3f8bff);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation: unoshout 1.6s ease-out forwards; text-shadow:none; }
@keyframes unoshout { 0%{transform:translate(-50%,-50%) scale(.3) rotate(-8deg);opacity:0}
  25%{transform:translate(-50%,-50%) scale(1.25) rotate(-8deg);opacity:1}
  75%{opacity:1} 100%{transform:translate(-50%,-70%) scale(1) rotate(-8deg);opacity:0} }
`;
let cssDone = false;
function ensureCss() { if (!cssDone && typeof document !== 'undefined') { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); cssDone = true; } }

const COLORS = { r: '红', g: '绿', b: '蓝', y: '黄' };
const KIND_TXT = { skip: '🚫', rev: '⇄', '+2': '+2', wild: '★', '+4': '+4' };

function buildDeck() {
  const deck = [];
  let id = 0;
  for (const c of ['r', 'g', 'b', 'y']) {
    deck.push({ id: id++, c, k: '0' });
    for (const k of ['1','2','3','4','5','6','7','8','9','skip','rev','+2']) {
      deck.push({ id: id++, c, k }); deck.push({ id: id++, c, k });
    }
  }
  for (let i = 0; i < 4; i++) { deck.push({ id: id++, c: 'w', k: 'wild' }); deck.push({ id: id++, c: 'w', k: '+4' }); }
  return shuffle(deck);
}

function matches(card, top, color) {
  if (card.c === 'w') return true;
  return card.c === color || card.k === top.k;
}

// ---------- 引擎 ----------
function createEngine(players, emit) {
  const P = players.map(p => ({ ...p }));
  const G = {
    hands: {}, draw: [], discard: [], color: 'r', dir: 1, turn: 0,
    phase: 'play', drawnId: null, log: [], over: null, sfx: null, shout: null, seq: 0,
  };
  const nameOf = pid => P.find(p => p.id === pid).name;
  const cur = () => P[G.turn];

  function log(s) { G.log.push(s); if (G.log.length > 40) G.log.shift(); }

  function refill() {
    if (G.draw.length === 0) {
      const top = G.discard.pop();
      G.draw = shuffle(G.discard);
      G.discard = [top];
      log('🔄 弃牌堆重新洗入摸牌堆');
    }
  }
  function drawCards(pid, n) {
    for (let i = 0; i < n; i++) { refill(); if (G.draw.length) G.hands[pid].push(G.draw.pop()); }
  }
  function advance(extra = 0) {
    for (let i = 0; i <= extra; i++) G.turn = (G.turn + G.dir + P.length) % P.length;
  }

  function viewFor(pid) {
    const me = G.hands[pid] || [];
    const top = G.discard[G.discard.length - 1];
    const myTurn = cur().id === pid && !G.over;
    const v = {
      game: 'uno',
      hand: me,
      top, color: G.color, dir: G.dir,
      turnPid: G.over ? null : cur().id,
      counts: P.map(p => ({ pid: p.id, n: G.hands[p.id].length })),
      playable: myTurn && G.phase === 'play' ? me.map((c, i) => matches(c, top, G.color) ? i : -1).filter(i => i >= 0) : [],
      canDraw: myTurn && G.phase === 'play',
      drawnChoice: myTurn && G.phase === 'drawn' ? me.findIndex(c => c.id === G.drawnId) : -1,
      log: G.log.slice(-5),
      sfx: G.sfx, shout: G.shout, seq: G.seq,
      result: G.over ? { ...G.over, win: G.over.winner === pid } : null,
    };
    return v;
  }
  function push(sfx = null, shout = null) {
    G.sfx = sfx; G.shout = shout; G.seq++;
    for (const p of P) emit(p.id, viewFor(p.id));
    G.sfx = null; G.shout = null;
  }

  function finish(winner) {
    const rank = [...P].sort((a, b) => G.hands[a.id].length - G.hands[b.id].length);
    G.over = {
      winner,
      title: '游戏结束',
      lines: rank.map((p, i) => `${i === 0 ? '🏆' : ['🥈','🥉','4️⃣','5️⃣','6️⃣'][i - 1] || ''} ${p.name} —— ${i === 0 ? '获胜！' : '剩 ' + G.hands[p.id].length + ' 张'}`),
    };
    log(`🏆 ${nameOf(winner)} 打完所有手牌，获胜！`);
    push('win');
  }

  function applyCard(pid, card, chosenColor) {
    G.discard.push(card);
    G.color = card.c === 'w' ? (chosenColor || 'r') : card.c;
    let sfx = 'card', extra = 0;
    log(`${nameOf(pid)} 打出 ${card.c === 'w' ? '' : COLORS[card.c]}【${KIND_TXT[card.k] || card.k}】` + (card.c === 'w' ? `，指定${COLORS[G.color]}色` : ''));
    if (card.k === 'skip') { const v = P[(G.turn + G.dir + P.length) % P.length]; log(`🚫 ${v.name} 被跳过`); extra = 1; sfx = 'warn'; }
    else if (card.k === 'rev') {
      G.dir *= -1; log('⇄ 出牌方向反转');
      if (P.length === 2) extra = 1;
    }
    else if (card.k === '+2') { const v = P[(G.turn + G.dir + P.length) % P.length]; drawCards(v.id, 2); log(`💥 ${v.name} 摸 2 张并被跳过`); extra = 1; sfx = 'warn'; }
    else if (card.k === '+4') { const v = P[(G.turn + G.dir + P.length) % P.length]; drawCards(v.id, 4); log(`💥💥 ${v.name} 摸 4 张并被跳过`); extra = 1; sfx = 'bomb'; }

    let shout = null;
    if (G.hands[pid].length === 1) { shout = { pid, txt: 'UNO!' }; log(`📢 ${nameOf(pid)} 大喊：UNO！`); sfx = 'uno'; }
    if (G.hands[pid].length === 0) { finish(pid); return; }
    G.phase = 'play'; G.drawnId = null;
    advance(extra);
    push(sfx, shout);
  }

  return {
    start() {
      G.draw = buildDeck();
      for (const p of P) { G.hands[p.id] = []; }
      for (const p of P) drawCards(p.id, 7);
      // 翻开首张（保证是数字牌）
      let first;
      do { refill(); first = G.draw.pop(); if (!/^\d$/.test(first.k)) G.draw.unshift(first); } while (!/^\d$/.test(first.k));
      G.discard = [first]; G.color = first.c;
      G.turn = Math.floor(Math.random() * P.length);
      log(`🎮 游戏开始！首张为 ${COLORS[first.c]}${first.k}，由 ${cur().name} 先出`);
      push('deal');
    },
    onAction(pid, a) {
      if (G.over || !a) return;
      if (cur().id !== pid) return;
      const hand = G.hands[pid];
      const top = G.discard[G.discard.length - 1];

      if (a.t === 'play' && G.phase === 'play') {
        const card = hand[a.i];
        if (!card || !matches(card, top, G.color)) return;
        hand.splice(a.i, 1);
        applyCard(pid, card, a.color);
      } else if (a.t === 'draw' && G.phase === 'play') {
        drawCards(pid, 1);
        const drawn = hand[hand.length - 1];
        log(`${nameOf(pid)} 摸了一张牌`);
        if (drawn && matches(drawn, top, G.color)) {
          G.phase = 'drawn'; G.drawnId = drawn.id;
          push('draw');
        } else {
          advance(); push('draw');
        }
      } else if (a.t === 'playDrawn' && G.phase === 'drawn') {
        const i = hand.findIndex(c => c.id === G.drawnId);
        if (i < 0) return;
        const card = hand[i];
        hand.splice(i, 1);
        applyCard(pid, card, a.color);
      } else if (a.t === 'keep' && G.phase === 'drawn') {
        G.phase = 'play'; G.drawnId = null;
        log(`${nameOf(pid)} 选择留下摸到的牌`);
        advance(); push('pass');
      }
    },
  };
}

// ---------- AI ----------
function bestColor(hand) {
  const cnt = { r: 0, g: 0, b: 0, y: 0 };
  for (const c of hand) if (c.c !== 'w') cnt[c.c]++;
  return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
}

function ai(view, act) {
  if (!view || view.game !== 'uno' || view.result) return;
  if (view.drawnChoice >= 0) {
    const card = view.hand[view.drawnChoice];
    if (card.c === 'w') act({ t: 'playDrawn', color: bestColor(view.hand) });
    else act({ t: 'playDrawn' });
    return;
  }
  if (!view.canDraw) return;
  if (view.playable.length === 0) { act({ t: 'draw' }); return; }
  // 下家手牌少 → 优先攻击牌
  const nextIdx = view.counts.findIndex(c => c.pid === view.turnPid);
  const order = view.counts;
  const me = order.findIndex(c => c.pid === view.turnPid);
  const next = order[(me + view.dir + order.length) % order.length];
  const danger = next && next.n <= 2;
  const score = (i) => {
    const c = view.hand[i];
    let s = 0;
    if (c.k === '+4') s = danger ? 100 : 5;
    else if (c.k === '+2') s = danger ? 90 : 40;
    else if (c.k === 'skip' || c.k === 'rev') s = danger ? 80 : 35;
    else if (c.k === 'wild') s = danger ? 60 : 8;
    else s = 50 + parseInt(c.k, 10); // 先出大数字
    // 同色多 → 更愿意出该色
    if (c.c !== 'w') s += view.hand.filter(x => x.c === c.c).length * 2;
    return s;
  };
  const best = [...view.playable].sort((a, b) => score(b) - score(a))[0];
  const card = view.hand[best];
  if (card.c === 'w') act({ t: 'play', i: best, color: bestColor(view.hand.filter((_, j) => j !== best)) });
  else act({ t: 'play', i: best });
}

// ---------- 渲染 ----------
function ucardEl(card, mini = false) {
  const d = el('div', 'ucard c' + card.c + (mini ? ' mini' : ''));
  const txt = KIND_TXT[card.k] || card.k;
  d.appendChild(el('div', 'uc-tl', txt));
  d.appendChild(el('div', 'uc-mid', txt));
  d.appendChild(el('div', 'uc-br', txt));
  return d;
}
function ucardBack(mini = false) {
  const d = el('div', 'ucard back' + (mini ? ' mini' : ''));
  d.appendChild(el('div', 'uc-mid', 'UNO'));
  return d;
}
const GLOW = { r: '#ff4b4b', g: '#4bd964', b: '#3f8bff', y: '#ffd24b' };

function render(root, view, send, ctx) {
  ensureCss();
  clear(root);
  const stage = el('div', 'uno-stage');
  root.appendChild(stage);

  // 日志
  const logBox = el('div', 'game-log');
  view.log.forEach(l => logBox.appendChild(el('div', '', l)));
  stage.appendChild(logBox);

  // 对手区
  const opps = el('div', 'uno-opps');
  for (const c of view.counts) {
    if (c.pid === ctx.myId) continue;
    const pav = el('div', 'pav' + (view.turnPid === c.pid ? ' turn' : ''));
    const face = el('div', 'pav-face', ctx.avatarOf(c.pid));
    pav.appendChild(face);
    pav.appendChild(el('div', 'pav-name', ctx.nameOf(c.pid)));
    const cnt = el('div', 'pav-cnt', String(c.n));
    pav.appendChild(cnt);
    if (view.shout && view.shout.pid === c.pid) {
      const b = el('div', 'pav-bubble', 'UNO!');
      pav.appendChild(b);
    }
    opps.appendChild(pav);
  }
  stage.appendChild(opps);

  // 中央牌堆
  const center = el('div', 'uno-center');
  const dir = el('div', 'uno-dir' + (view.dir === -1 ? ' rev' : ''), '↻');
  center.appendChild(dir);

  const drawPile = el('div', 'uno-pile');
  const backC = ucardBack();
  drawPile.appendChild(backC);
  if (view.canDraw) {
    backC.style.boxShadow = '0 0 14px rgba(255,255,255,.55)';
    backC.onclick = () => { ctx.audio.play('click'); send({ t: 'draw' }); };
  }
  center.appendChild(drawPile);

  const topWrap = el('div', 'uno-pile uno-top-glow');
  topWrap.style.boxShadow = `0 0 26px ${GLOW[view.color]}`;
  topWrap.appendChild(ucardEl(view.top));
  const dot = el('div', 'uno-color-dot', '当前颜色：' + COLORS[view.color]);
  dot.style.background = GLOW[view.color];
  if (view.color === 'y') dot.style.color = '#4a3800';
  topWrap.appendChild(dot);
  center.appendChild(topWrap);
  stage.appendChild(center);

  // UNO 喊叫特效
  if (view.shout) {
    const sh = el('div', 'uno-shout', 'UNO!');
    stage.appendChild(sh);
    setTimeout(() => sh.remove(), 1700);
  }

  // 摸牌抉择按钮
  if (view.drawnChoice >= 0) {
    const bar = el('div', 'act-bar');
    bar.style.bottom = '138px';
    const card = view.hand[view.drawnChoice];
    const b1 = el('button', 'act-btn warm', '打出摸到的牌');
    b1.onclick = () => {
      if (card.c === 'w') pickColor(ctx, color => send({ t: 'playDrawn', color }));
      else send({ t: 'playDrawn' });
    };
    const b2 = el('button', 'act-btn plain', '留在手里');
    b2.onclick = () => send({ t: 'keep' });
    bar.appendChild(b1); bar.appendChild(b2);
    stage.appendChild(bar);
  } else if (view.turnPid === ctx.myId && !view.result) {
    const bar = el('div', 'act-bar');
    bar.style.bottom = '138px';
    const tip = el('div', '', view.playable.length ? '轮到你出牌 👇' : '没有能出的牌，点击牌堆摸一张');
    tip.style.cssText = 'color:#ffd76a;font-size:14px;text-shadow:0 1px 4px #000';
    bar.appendChild(tip);
    stage.appendChild(bar);
  }

  // 我的手牌
  const hand = el('div', 'uno-hand');
  const canPlay = new Set(view.playable);
  const midIdx = (view.hand.length - 1) / 2;
  view.hand.forEach((c, i) => {
    const cd = ucardEl(c);
    cd.style.setProperty('--rot', ((i - midIdx) * 1.4).toFixed(1) + 'deg');
    cd.style.marginTop = (Math.pow(Math.abs(i - midIdx), 1.3)).toFixed(1) + 'px';
    if (view.turnPid === ctx.myId && !view.result) {
      if (canPlay.has(i)) {
        cd.classList.add('ok');
        cd.onclick = () => {
          ctx.audio.play('select');
          if (c.c === 'w') pickColor(ctx, color => send({ t: 'play', i, color }));
          else send({ t: 'play', i });
        };
      } else if (view.playable.length || view.drawnChoice >= 0) cd.classList.add('dim');
    }
    hand.appendChild(cd);
  });
  stage.appendChild(hand);

  // 轮到我时提示音
  if (root._unoTurn !== view.seq && view.turnPid === ctx.myId) ctx.audio.play('turn');
  root._unoTurn = view.seq;
}

function pickColor(ctx, cb) {
  const body = el('div');
  body.style.cssText = 'display:flex;gap:12px;justify-content:center';
  for (const c of ['r', 'g', 'b', 'y']) {
    const b = el('button', '', COLORS[c]);
    b.style.cssText = `width:64px;height:64px;border-radius:16px;font-size:19px;font-weight:800;color:${c === 'y' ? '#4a3800' : '#fff'};background:${GLOW[c]};box-shadow:0 4px 12px ${GLOW[c]}66`;
    b.onclick = () => { close(); ctx.audio.play('click'); cb(c); };
    body.appendChild(b);
  }
  const close = modal({ title: '选择颜色', body, buttons: [], dismissable: false });
}

export default {
  id: 'uno', name: 'UNO', icon: '🌈',
  desc: '经典优诺牌！同色同数就能出，功能牌整蛊朋友，先清空手牌者获胜。',
  theme: 'linear-gradient(140deg, #b81e3c, #e0a400 130%)',
  minPlayers: 2, maxPlayers: 6, defaultPlayers: 4,
  help: `<b>目标</b>：最先打完手牌。<br><br>
· 出的牌须与顶牌<b>同颜色</b>或<b>同数字/符号</b>；<br>
· 🚫跳过：下家停一轮；⇄反转：改变方向；+2：下家摸两张并跳过；<br>
· ★变色：任选颜色；+4：变色并让下家摸四张；<br>
· 没牌可出时摸一张，能出可立即打出；<br>
· 剩一张牌时会自动大喊 <b>UNO!</b>`,
  createEngine, ai, render,
};
