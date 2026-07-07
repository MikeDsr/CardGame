// ===== 大富翁 =====
import { el, clear, pick, rndInt } from '../core/util.js';

// ---------- 样式 ----------
const CSS = `
.rich-stage { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center;
  background: radial-gradient(ellipse at 50% -20%, #2a4f80, #0a1628 70%); overflow-y:auto; }
.rich-stage::before { content:'🌆🏙️🌃🏙️🌇'; position:absolute; top:60px; left:0; right:0; text-align:center;
  font-size:30px; letter-spacing:16px; opacity:.16; pointer-events:none; filter:blur(.5px); }
.rich-board-wrap { position:relative; width:min(96vw, 62vh); margin-top:88px; flex-shrink:0;
  filter:drop-shadow(0 18px 30px rgba(0,0,0,.55)); }
.rich-board { display:grid; grid-template-columns:repeat(10,1fr); grid-template-rows:repeat(10,1fr);
  width:100%; aspect-ratio:1; gap:1px; background:rgba(255,215,106,.16); border-radius:14px; overflow:hidden;
  border:2px solid rgba(255,215,106,.5); box-shadow:0 0 46px rgba(60,120,220,.3), inset 0 0 70px rgba(0,0,0,.55); }
.rich-cell { background:#16213c; position:relative; font-size:8.5px; overflow:hidden;
  display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; line-height:1.15;
  transition:background .3s; }
.rich-cell .rc-band { position:absolute; top:0; left:0; right:0; height:4px; box-shadow:0 0 6px currentColor; }
.rich-cell .rc-name { font-weight:700; padding:0 1px; margin-top:2px; }
.rich-cell .rc-price { color:#8a93b5; font-size:7.5px; }
.rich-cell .rc-lv { font-size:7px; letter-spacing:1px; }
.rich-cell.corner { background:linear-gradient(160deg,#2a3a6a,#151f42); font-size:11px; }
.rich-cell.t-go { background:linear-gradient(120deg,#8a6d1a,#d4af37,#8a6d1a); background-size:220% 100%;
  animation:goshine 3.2s linear infinite; color:#fff; text-shadow:0 1px 3px rgba(0,0,0,.6); }
@keyframes goshine { to { background-position:220% 0; } }
.rich-cell.t-gojail { background:linear-gradient(160deg,#5a1a2a,#2a0d16); }
.rich-cell.owned-glow { box-shadow: inset 0 0 12px var(--oc); background:#1a2748; }
.rich-cell.landing { animation:cellblink .5s 2; }
@keyframes cellblink { 50% { background:#3a4f8a; } }
.rich-center { grid-row:2/10; grid-column:2/10; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:8px; padding:8px;
  background:radial-gradient(ellipse at 50% 30%, #14224a, #0b1330 80%); }
.rich-logo { font-size:19px; font-weight:900; letter-spacing:6px;
  background:linear-gradient(120deg,#ffd76a,#ff9a5c,#ffd76a); background-size:200% 100%;
  -webkit-background-clip:text; background-clip:text; color:transparent; animation:goshine 4s linear infinite; }
.rich-dice { display:flex; gap:12px; }
.rich-die { width:48px; height:48px; background:linear-gradient(160deg,#ffffff,#d8ddef); color:#1a1d2e; border-radius:12px;
  display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:900;
  box-shadow:0 6px 16px rgba(0,0,0,.55), inset 0 1px 0 #fff; }
.rich-die.rolling { animation: richroll .85s cubic-bezier(.2,.8,.3,1.15); }
@keyframes richroll {
  0% { transform:translateY(-46px) rotate(0deg) scale(.5); opacity:.2; }
  40% { transform:translateY(8px) rotate(230deg) scale(1.18); opacity:1; }
  65% { transform:translateY(-9px) rotate(320deg) scale(.96); }
  85% { transform:translateY(3px) rotate(352deg); }
  100% { transform:rotate(360deg); }
}
.rich-center .rc-info { font-size:12px; color:#c9cde0; text-align:center; line-height:1.5; }
.rich-center .rc-round { font-size:11px; color:#8a93b5; }
.rich-tokens { position:absolute; inset:0; pointer-events:none; z-index:5; }
.rich-token { position:absolute; font-size:17px; transition: left .16s ease-in-out, top .16s ease-in-out;
  text-shadow:0 3px 6px #000; transform:translate(-50%,-56%); z-index:6;
  filter:drop-shadow(0 0 7px rgba(255,255,255,.4)); }
.rich-token.active { font-size:23px; animation:tokbounce .9s ease-in-out infinite; z-index:7; }
@keyframes tokbounce { 50% { margin-top:-5px; } }
.rich-players { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; padding:12px 10px; }
.rich-pcard { position:relative; background:linear-gradient(160deg,rgba(255,255,255,.1),rgba(255,255,255,.04));
  border:1px solid rgba(255,255,255,.14); border-radius:12px;
  padding:6px 10px; font-size:12px; min-width:76px; text-align:center; }
.rich-pcard.turn { border-color:#ffd76a; box-shadow:0 0 14px rgba(255,215,106,.45); }
.rich-pcard.dead { opacity:.35; text-decoration:line-through; }
.rich-pcard b { display:block; font-size:13px; color:#ffd76a; }
.rich-fly { position:absolute; left:50%; transform:translateX(-50%); top:-8px; font-weight:900; font-size:15px;
  animation:floatup 1.5s forwards; pointer-events:none; z-index:30; text-shadow:0 1px 4px #000; white-space:nowrap; }
.rich-card-pop { position:fixed; left:50%; top:40%; transform:translate(-50%,-50%); z-index:150;
  background:linear-gradient(160deg,#fdf6e3,#f5e6c8); color:#4a3800; border-radius:18px; padding:22px 26px;
  width:min(78vw,300px); text-align:center; box-shadow:0 20px 60px rgba(0,0,0,.7), 0 0 30px rgba(255,215,106,.25);
  animation:cardflip .5s cubic-bezier(.2,1.4,.4,1); }
@keyframes cardflip { 0% { transform:translate(-50%,-50%) rotateY(90deg) scale(.7); opacity:0; }
  100% { transform:translate(-50%,-50%) rotateY(0) scale(1); opacity:1; } }
.rich-card-pop h4 { font-size:17px; margin-bottom:8px; }
.rich-card-pop p { font-size:14px; line-height:1.6; }
`;
let cssDone = false;
function ensureCss() { if (!cssDone && typeof document !== 'undefined') { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); cssDone = true; } }

// ---------- 棋盘数据 ----------
const GC = { pink: '#f272b6', blue: '#38bdf8', purple: '#a78bfa', green: '#34d399', yellow: '#fbbf24', orange: '#fb923c', red: '#f87171', rail: '#94a3b8', util: '#e2e8f0' };
function T(name, type, group = null, price = 0) { return { name, type, group, price, owner: null, level: 0 }; }
function makeTiles() {
  return [
    T('起点\n+2000', 'go'), T('哈尔滨', 'city', 'pink', 600), T('机会', 'chance'), T('兰州', 'city', 'pink', 600),
    T('所得税\n-1000', 'tax'), T('京沪\n高铁', 'rail', 'rail', 2000), T('青岛', 'city', 'blue', 1000), T('命运', 'fate'),
    T('郑州', 'city', 'blue', 1000), T('监狱\n(探视)', 'jail'),
    T('长沙', 'city', 'blue', 1200), T('电力\n公司', 'util', 'util', 1500), T('昆明', 'city', 'purple', 1400), T('大连', 'city', 'purple', 1400),
    T('广深\n高铁', 'rail', 'rail', 2000), T('厦门', 'city', 'purple', 1600), T('机会', 'chance'), T('苏州', 'city', 'green', 1800),
    T('免费\n停车', 'park'),
    T('南京', 'city', 'green', 1800), T('命运', 'fate'), T('西安', 'city', 'green', 2000), T('武汉', 'city', 'yellow', 2200),
    T('成渝\n高铁', 'rail', 'rail', 2000), T('重庆', 'city', 'yellow', 2200), T('自来\n水厂', 'util', 'util', 1500), T('成都', 'city', 'yellow', 2400),
    T('入狱！', 'gojail'),
    T('杭州', 'city', 'orange', 2600), T('深圳', 'city', 'orange', 2600), T('机会', 'chance'), T('广州', 'city', 'orange', 2800),
    T('京广\n高铁', 'rail', 'rail', 2000), T('命运', 'fate'), T('上海', 'city', 'red', 3200), T('北京', 'city', 'red', 3500),
  ];
}
const houseCost = t => Math.round(t.price * 0.5 / 100) * 100;
const baseRent = t => Math.max(50, Math.round(t.price * 0.12 / 50) * 50);
const TOKENS = ['🚗', '🐱', '🎩', '🚀', '🐶', '⛵'];
const JAIL_POS = 9, GO_BONUS = 2000, START_MONEY = 15000, MAX_ROUNDS = 20;

const CHANCE = [
  { txt: '公司发年终奖，获得 2000 元', money: 2000 },
  { txt: '彩票中奖！获得 3000 元', money: 3000 },
  { txt: '直达起点，领取 2000 元', goto: 0 },
  { txt: '顺风顺水，前进 3 格', move: 3 },
  { txt: '涉嫌偷税漏税，立即入狱！', jail: true },
  { txt: '发红包啦！每位玩家给你 500 元', collect: 500 },
  { txt: '股票大涨，获得 1500 元', money: 1500 },
  { txt: '搭乘高铁，前往京沪高铁站', goto: 5 },
];
const FATE = [
  { txt: '缴纳物业费：每处房产 300 元', perProp: 300 },
  { txt: '感冒住院，支付医疗费 1000 元', money: -1000 },
  { txt: '小区修路，分摊 800 元', money: -800 },
  { txt: '收到退税 1000 元', money: 1000 },
  { txt: '手机被偷，损失 500 元', money: -500 },
  { txt: '倒霉透顶，立即入狱！', jail: true },
  { txt: '房屋检修：每级建筑 200 元', perLevel: 200 },
  { txt: '捡到钱包上交失主，获得酬谢 600 元', money: 600 },
];

// ---------- 引擎 ----------
function createEngine(players, emit) {
  const P = players.map((p, i) => ({ ...p, token: TOKENS[i % TOKENS.length] }));
  const G = {
    tiles: makeTiles(),
    ps: {}, turn: 0, round: 1, prompt: null, dice: null, card: null,
    doubles: 0, log: [], over: null, sfx: null, seq: 0, destroyed: false,
    lastMove: null,
  };
  for (const p of P) G.ps[p.id] = { money: START_MONEY, pos: 0, jail: 0, dead: false };
  const nameOf = pid => P.find(p => p.id === pid).name;
  const cur = () => P[G.turn];
  const alive = () => P.filter(p => !G.ps[p.id].dead);

  function log(s) { G.log.push(s); if (G.log.length > 50) G.log.shift(); }
  function later(fn, ms) { setTimeout(() => { if (!G.destroyed && !G.over) fn(); }, ms); }

  function viewFor(pid) {
    return {
      game: 'rich',
      tiles: G.tiles.map((t, i) => ({ ...t, i })),
      players: P.map(p => ({ pid: p.id, name: p.name, token: p.token, ...G.ps[p.id] })),
      turnPid: G.over ? null : cur().id,
      prompt: (!G.over && G.prompt && cur().id === pid) ? G.prompt : null,
      promptInfo: G.prompt ? G.prompt.info : '',
      dice: G.dice, card: G.card, round: G.round, maxRounds: MAX_ROUNDS,
      lastMove: G.lastMove,
      log: G.log.slice(-5), sfx: G.sfx, seq: G.seq,
      result: G.over ? { ...G.over.base, win: G.over.winner === pid } : null,
    };
  }
  function push(sfx = null) {
    G.sfx = sfx; G.seq++;
    for (const p of P) emit(p.id, viewFor(p.id));
    G.sfx = null; G.card = null;
  }

  function worth(pid) {
    let w = G.ps[pid].money;
    G.tiles.forEach(t => { if (t.owner === pid) w += t.price + t.level * houseCost(t); });
    return w;
  }

  function finish() {
    const rank = alive().sort((a, b) => worth(b.id) - worth(a.id));
    const winner = rank[0] ? rank[0].id : P[0].id;
    G.over = {
      winner,
      base: {
        title: nameOf(winner) + ' 富甲一方！',
        lines: P.map(p => `${p.token} ${p.name}：${G.ps[p.id].dead ? '💸 破产出局' : '资产 ' + worth(p.id) + ' 元'}`),
      },
    };
    log('🏁 游戏结束！');
    push('win');
  }

  // 变卖房产抵债，返回是否凑够
  function raise(pid, amount) {
    const st = G.ps[pid];
    while (st.money < amount) {
      const props = G.tiles.filter(t => t.owner === pid);
      if (!props.length) return false;
      props.sort((a, b) => (a.price + a.level * houseCost(a)) - (b.price + b.level * houseCost(b)));
      const t = props[0];
      const got = Math.round((t.price + t.level * houseCost(t)) / 2);
      st.money += got;
      log(`💔 ${nameOf(pid)} 变卖 ${t.name.replace('\n', '')} 换得 ${got} 元`);
      t.owner = null; t.level = 0;
    }
    return true;
  }

  function pay(pid, amount, toPid = null) {
    const st = G.ps[pid];
    if (!raise(pid, amount)) {
      const all = st.money;
      if (toPid) G.ps[toPid].money += all;
      st.money = 0; st.dead = true;
      G.tiles.forEach(t => { if (t.owner === pid) { t.owner = null; t.level = 0; } });
      log(`💸 ${nameOf(pid)} 破产出局！`);
      push('lose');
      return false;
    }
    st.money -= amount;
    if (toPid) G.ps[toPid].money += amount;
    return true;
  }

  function endTurn() {
    if (G.over) return;
    if (alive().length <= 1) return finish();
    // 双数再掷一次
    if (G.dice && G.dice.d1 === G.dice.d2 && !G.ps[cur().id].dead && G.ps[cur().id].jail === 0 && G.doubles < 3) {
      log(`🎲 ${cur().name} 掷出对子，再掷一次！`);
      G.prompt = { type: 'roll', info: `${cur().name} 掷出对子，再掷一次` };
      push();
      return;
    }
    G.doubles = 0;
    let i = G.turn;
    do { i = (i + 1) % P.length; } while (G.ps[P[i].id].dead);
    if (i <= G.turn) {
      G.round++;
      if (G.round > MAX_ROUNDS) return finish();
    }
    G.turn = i;
    const st = G.ps[cur().id];
    if (st.jail > 0) {
      G.prompt = { type: 'jail', info: `${cur().name} 在监狱中（第 ${st.jail} 轮）` };
    } else {
      G.prompt = { type: 'roll', info: `等待 ${cur().name} 掷骰子` };
    }
    push('turn');
  }

  function landOn(pid, recursed = false) {
    const st = G.ps[pid];
    const t = G.tiles[st.pos];
    const tn = t.name.replace('\n', '');
    if (t.type === 'go') { log(`🏁 ${nameOf(pid)} 停在起点`); return endTurn(); }
    if (t.type === 'park') { log(`🅿️ ${nameOf(pid)} 在免费停车场休息一轮`); return endTurn(); }
    if (t.type === 'jail') { log(`👀 ${nameOf(pid)} 探视监狱`); return endTurn(); }
    if (t.type === 'tax') {
      log(`🧾 ${nameOf(pid)} 缴纳所得税 1000 元`);
      if (pay(pid, 1000)) push('coin');
      return later(endTurn, 900);
    }
    if (t.type === 'gojail') {
      st.pos = JAIL_POS; st.jail = 1;
      log(`🚔 ${nameOf(pid)} 被抓进监狱！`);
      push('warn');
      return later(endTurn, 1000);
    }
    if (t.type === 'chance' || t.type === 'fate') {
      const card = pick(t.type === 'chance' ? CHANCE : FATE);
      G.card = { kind: t.type === 'chance' ? '机会' : '命运', txt: card.txt };
      log(`🃏 ${nameOf(pid)} 抽到${G.card.kind}卡：${card.txt}`);
      push('draw');
      return later(() => {
        if (card.money) {
          if (card.money > 0) st.money += card.money;
          else pay(pid, -card.money);
          push('coin'); return later(endTurn, 700);
        }
        if (card.collect) { for (const o of alive()) if (o.id !== pid) { if (pay(o.id, card.collect, pid)) {} } push('coin'); return later(endTurn, 700); }
        if (card.perProp) { const n = G.tiles.filter(x => x.owner === pid).length; if (pay(pid, n * card.perProp)) push('coin'); return later(endTurn, 700); }
        if (card.perLevel) { const n = G.tiles.reduce((s, x) => s + (x.owner === pid ? x.level : 0), 0); if (pay(pid, n * card.perLevel)) push('coin'); return later(endTurn, 700); }
        if (card.jail) { st.pos = JAIL_POS; st.jail = 1; push('warn'); return later(endTurn, 800); }
        if (card.goto !== undefined) {
          if (card.goto === 0 || card.goto < st.pos) { st.money += GO_BONUS; log(`💰 经过起点，领取 ${GO_BONUS} 元`); }
          G.lastMove = { pid, from: st.pos, steps: (card.goto - st.pos + 36) % 36, seq: G.seq + 1 };
          st.pos = card.goto;
          push('step');
          return later(() => landOn(pid, true), 400 + G.lastMove.steps * 180);
        }
        if (card.move) {
          G.lastMove = { pid, from: st.pos, steps: card.move, seq: G.seq + 1 };
          st.pos = (st.pos + card.move) % 36;
          push('step');
          return later(() => landOn(pid, true), 400 + card.move * 180);
        }
        endTurn();
      }, 1800);
    }
    // 地产 / 高铁 / 公用
    if (t.owner === null) {
      if (G.ps[pid].money >= t.price) {
        G.prompt = { type: 'buy', pos: st.pos, info: `${nameOf(pid)} 考虑是否购买 ${tn}` };
        push();
      } else {
        log(`${nameOf(pid)} 买不起 ${tn}`);
        endTurn();
      }
      return;
    }
    if (t.owner === pid) {
      if (t.type === 'city' && t.level < 3 && st.money >= houseCost(t)) {
        G.prompt = { type: 'up', pos: st.pos, info: `${nameOf(pid)} 考虑是否升级 ${tn}` };
        push();
      } else endTurn();
      return;
    }
    // 交租
    let rent = 0;
    if (t.type === 'city') {
      const groupAll = G.tiles.filter(x => x.group === t.group).every(x => x.owner === t.owner);
      rent = Math.round(baseRent(t) * [1, 4, 9, 16][t.level] * (groupAll ? 1.5 : 1));
    } else if (t.type === 'rail') {
      const n = G.tiles.filter(x => x.type === 'rail' && x.owner === t.owner).length;
      rent = 400 * Math.pow(2, n - 1);
    } else if (t.type === 'util') {
      const n = G.tiles.filter(x => x.type === 'util' && x.owner === t.owner).length;
      rent = (G.dice ? G.dice.d1 + G.dice.d2 : 7) * 100 * n;
    }
    log(`💰 ${nameOf(pid)} 向 ${nameOf(t.owner)} 支付租金 ${rent} 元`);
    if (pay(pid, rent, t.owner)) push('coin');
    later(endTurn, 900);
  }

  function doRoll(pid) {
    const d1 = rndInt(1, 6), d2 = rndInt(1, 6);
    G.dice = { d1, d2, seq: G.seq + 1 };
    if (d1 === d2) G.doubles++;
    const st = G.ps[pid];
    const from = st.pos;
    st.pos = (st.pos + d1 + d2) % 36;
    if (st.pos < from) { st.money += GO_BONUS; log(`💰 ${nameOf(pid)} 经过起点，领取 ${GO_BONUS} 元`); }
    log(`🎲 ${nameOf(pid)} 掷出 ${d1}+${d2}，前进 ${d1 + d2} 格`);
    G.prompt = null;
    G.lastMove = { pid, from, steps: d1 + d2, seq: G.seq + 1 };
    push('dice');
    later(() => landOn(pid), 900 + (d1 + d2) * 180);
  }

  return {
    start() {
      log('🎩 大富翁开始！每人 ' + START_MONEY + ' 元，' + MAX_ROUNDS + ' 轮后资产最多者获胜');
      G.prompt = { type: 'roll', info: `等待 ${cur().name} 掷骰子` };
      push('deal');
    },
    destroy() { G.destroyed = true; },
    onAction(pid, a) {
      if (G.over || !a || cur().id !== pid || !G.prompt) return;
      const st = G.ps[pid];
      const t = G.prompt.pos !== undefined ? G.tiles[G.prompt.pos] : null;

      if (G.prompt.type === 'roll' && a.t === 'roll') {
        doRoll(pid);
      } else if (G.prompt.type === 'jail') {
        if (a.t === 'jailPay' && st.money >= 1000) {
          st.money -= 1000; st.jail = 0;
          log(`💵 ${nameOf(pid)} 交 1000 元保释金出狱`);
          G.prompt = null; push('coin');
          later(() => doRoll(pid), 700);
        } else if (a.t === 'jailTry') {
          const d1 = rndInt(1, 6), d2 = rndInt(1, 6);
          G.dice = { d1, d2, seq: G.seq };
          if (d1 === d2) {
            st.jail = 0;
            log(`🎲 ${nameOf(pid)} 掷出对子 ${d1}+${d2}，越狱成功！`);
            G.prompt = null; push('dice');
            const from = st.pos;
            st.pos = (st.pos + d1 + d2) % 36;
            later(() => {
              G.lastMove = { pid, from, steps: d1 + d2, seq: G.seq + 1 };
              push('step');
              later(() => landOn(pid), 500 + (d1 + d2) * 180);
            }, 800);
          } else {
            st.jail++;
            log(`🎲 ${nameOf(pid)} 掷出 ${d1}+${d2}，越狱失败`);
            if (st.jail > 3) {
              st.jail = 0;
              log(`⛓️ ${nameOf(pid)} 关满三轮，交 1000 元获释`);
              if (!pay(pid, 1000)) return later(endTurn, 800);
              G.prompt = null; push('dice');
              later(() => doRoll(pid), 800);
            } else {
              G.prompt = null; push('dice');
              later(endTurn, 900);
            }
          }
        }
      } else if (G.prompt.type === 'buy' && t) {
        if (a.t === 'buy' && st.money >= t.price) {
          st.money -= t.price; t.owner = pid;
          log(`🏠 ${nameOf(pid)} 以 ${t.price} 元买下 ${t.name.replace('\n', '')}`);
          G.prompt = null; push('buy');
          later(endTurn, 600);
        } else if (a.t === 'skip') {
          log(`${nameOf(pid)} 放弃购买`);
          G.prompt = null; push();
          endTurn();
        }
      } else if (G.prompt.type === 'up' && t) {
        if (a.t === 'up' && st.money >= houseCost(t) && t.level < 3) {
          st.money -= houseCost(t); t.level++;
          log(`🏗️ ${nameOf(pid)} 将 ${t.name.replace('\n', '')} 升到 ${t.level} 级`);
          G.prompt = null; push('buy');
          later(endTurn, 600);
        } else if (a.t === 'noUp') {
          G.prompt = null; push();
          endTurn();
        }
      }
    },
  };
}

// ---------- AI ----------
function ai(view, act) {
  if (!view || view.game !== 'rich' || view.result || !view.prompt) return;
  const p = view.prompt;
  const me = view.players.find(x => x.pid === view.turnPid);
  if (p.type === 'roll') act({ t: 'roll' });
  else if (p.type === 'jail') act(me.money > 3000 ? { t: 'jailPay' } : { t: 'jailTry' });
  else if (p.type === 'buy') {
    const t = view.tiles[p.pos];
    act(me.money - t.price > 2500 ? { t: 'buy' } : { t: 'skip' });
  } else if (p.type === 'up') {
    const t = view.tiles[p.pos];
    const cost = Math.round(t.price * 0.5 / 100) * 100;
    act(me.money - cost > 3500 ? { t: 'up' } : { t: 'noUp' });
  }
}

// ---------- 渲染 ----------
function cellRC(i) {
  if (i <= 9) return [10, 10 - i];
  if (i <= 18) return [10 - (i - 9), 1];
  if (i <= 27) return [1, 1 + (i - 18)];
  return [1 + (i - 27), 10];
}

function render(root, view, send, ctx) {
  ensureCss();
  clear(root);
  const stage = el('div', 'rich-stage');
  root.appendChild(stage);

  const logBox = el('div', 'game-log');
  view.log.forEach(l => logBox.appendChild(el('div', '', l)));
  stage.appendChild(logBox);

  const wrap = el('div', 'rich-board-wrap');
  const board = el('div', 'rich-board');
  const cellEls = [];
  for (const t of view.tiles) {
    const [r, c] = cellRC(t.i);
    const cell = el('div', 'rich-cell t-' + t.type + (['go','jail','park','gojail'].includes(t.type) ? ' corner' : ''));
    cell.style.gridRow = r; cell.style.gridColumn = c;
    if (t.group) {
      const band = el('div', 'rc-band');
      band.style.background = GC[t.group];
      band.style.color = GC[t.group];
      cell.appendChild(band);
    }
    const icon = { go: '🏁', jail: '👮', park: '🅿️', gojail: '🚔', chance: '❓', fate: '⚡', rail: '🚄', util: '🏭' }[t.type];
    if (icon) cell.appendChild(el('div', '', icon));
    cell.appendChild(el('div', 'rc-name', t.name.split('\n')[0]));
    if (t.price) {
      if (t.owner) {
        const ow = view.players.find(x => x.pid === t.owner);
        cell.appendChild(el('div', 'rc-price', ow ? ow.token : ''));
        cell.style.setProperty('--oc', GC[t.group] || '#fff');
        cell.classList.add('owned-glow');
      } else cell.appendChild(el('div', 'rc-price', String(t.price)));
      if (t.level) cell.appendChild(el('div', 'rc-lv', '🏠'.repeat(t.level)));
    }
    cellEls[t.i] = cell;
    board.appendChild(cell);
  }
  // 中央信息区
  const center = el('div', 'rich-center');
  center.style.gridRow = '2/10'; center.style.gridColumn = '2/10';
  center.appendChild(el('div', 'rich-logo', '大富翁'));
  const diceBox = el('div', 'rich-dice');
  const D = '⚀⚁⚂⚃⚄⚅';
  const newDice = view.dice && root._richDiceSeq !== view.dice.seq;
  if (view.dice) {
    for (const d of [view.dice.d1, view.dice.d2]) {
      diceBox.appendChild(el('div', 'rich-die' + (newDice ? ' rolling' : ''), D[d - 1]));
    }
    root._richDiceSeq = view.dice.seq;
  } else {
    diceBox.appendChild(el('div', 'rich-die', '🎲'));
  }
  center.appendChild(diceBox);
  center.appendChild(el('div', 'rc-info', view.promptInfo || (view.turnPid ? `${ctx.nameOf(view.turnPid)} 行动中…` : '')));
  center.appendChild(el('div', 'rc-round', `第 ${view.round} / ${view.maxRounds} 轮`));
  board.appendChild(center);
  wrap.appendChild(board);

  // 棋子层（逐格移动动画）
  const tokenLayer = el('div', 'rich-tokens');
  wrap.appendChild(tokenLayer);
  stage.appendChild(wrap);

  requestAnimationFrame(() => {
    const bw = board.clientWidth / 10, bh = board.clientHeight / 10;
    const OFFS = [[-9, -9], [9, -9], [-9, 9], [9, 9], [0, 0], [0, -15]];
    const place = (tok, pos, offs) => {
      const [r, c] = cellRC(pos);
      tok.style.left = ((c - 0.5) * bw + offs[0]) + 'px';
      tok.style.top = ((r - 0.5) * bh + offs[1]) + 'px';
    };
    view.players.forEach((p, i) => {
      if (p.dead) return;
      const tok = el('div', 'rich-token' + (view.turnPid === p.pid ? ' active' : ''), p.token);
      const offs = OFFS[i] || [0, 0];
      const mv = view.lastMove;
      if (mv && mv.pid === p.pid && mv.steps > 0 && root._richMoveSeq !== mv.seq) {
        root._richMoveSeq = mv.seq;
        place(tok, mv.from, offs);
        let step = 0;
        const stepper = () => {
          if (!tok.isConnected) return;
          step++;
          const pos = (mv.from + step) % 36;
          place(tok, pos, offs);
          ctx.audio.play('step');
          if (step < mv.steps) setTimeout(stepper, 170);
          else if (cellEls[pos]) cellEls[pos].classList.add('landing');
        };
        setTimeout(stepper, 250);
      } else place(tok, p.pos, offs);
      tokenLayer.appendChild(tok);
    });
  });

  // 玩家面板（含金钱变动飘字）
  const prevMoney = root._richMoney || {};
  const panel = el('div', 'rich-players');
  for (const p of view.players) {
    const pc = el('div', 'rich-pcard' + (view.turnPid === p.pid ? ' turn' : '') + (p.dead ? ' dead' : ''));
    pc.innerHTML = `${p.token} ${p.name}${p.pid === ctx.myId ? '（我）' : ''}${p.jail ? ' ⛓️' : ''}<b>💰 ${p.money}</b>`;
    const delta = prevMoney[p.pid] !== undefined ? p.money - prevMoney[p.pid] : 0;
    if (delta && !p.dead) {
      const f = el('div', 'rich-fly', (delta > 0 ? '+' : '') + delta);
      f.style.color = delta > 0 ? '#7be08a' : '#ff6b6b';
      pc.appendChild(f);
      setTimeout(() => f.remove(), 1600);
    }
    panel.appendChild(pc);
  }
  root._richMoney = Object.fromEntries(view.players.map(p => [p.pid, p.money]));
  stage.appendChild(panel);

  // 卡片弹出
  if (view.card) {
    const pop = el('div', 'rich-card-pop');
    pop.appendChild(el('h4', '', (view.card.kind === '机会' ? '❓ 机会' : '⚡ 命运')));
    pop.appendChild(el('p', '', view.card.txt));
    stage.appendChild(pop);
    setTimeout(() => pop.remove(), 2100);
  }

  // 操作按钮
  if (view.prompt) {
    const bar = el('div', 'act-bar');
    bar.style.bottom = '14px';
    const p = view.prompt;
    const mk = (txt, action, cls = 'act-btn') => {
      const b = el('button', cls, txt);
      b.onclick = () => { ctx.audio.play('click'); send(action); };
      bar.appendChild(b);
    };
    if (p.type === 'roll') mk('🎲 掷骰子', { t: 'roll' }, 'act-btn warm');
    else if (p.type === 'jail') { mk('💵 交1000元出狱', { t: 'jailPay' }, 'act-btn warm'); mk('🎲 尝试掷对子越狱', { t: 'jailTry' }); }
    else if (p.type === 'buy') {
      const t = view.tiles[p.pos];
      mk(`🏠 购买 ${t.name.split('\n')[0]}（${t.price}元）`, { t: 'buy' }, 'act-btn warm');
      mk('不买', { t: 'skip' }, 'act-btn plain');
    } else if (p.type === 'up') {
      const t = view.tiles[p.pos];
      const cost = Math.round(t.price * 0.5 / 100) * 100;
      mk(`🏗️ 升级（${cost}元）`, { t: 'up' }, 'act-btn warm');
      mk('不升级', { t: 'noUp' }, 'act-btn plain');
    }
    stage.appendChild(bar);
  }

  if (root._richSeq !== view.seq && view.prompt) ctx.audio.play('turn');
  root._richSeq = view.seq;
}

export default {
  id: 'rich', name: '大富翁', icon: '🎩',
  desc: '环游中国买地盖楼！机会命运翻转人生，把朋友收租到破产。',
  theme: 'linear-gradient(140deg, #1e3a8a, #0e7490 130%)',
  minPlayers: 2, maxPlayers: 6, defaultPlayers: 4,
  help: `<b>目标</b>：${'成为最富有的人！其他人破产或 20 轮后资产最多者获胜。'}<br><br>
· 掷骰子环游棋盘，经过起点领 2000 元；<br>
· 停在无主地产可购买；停在自己的城市可盖楼（最多 3 级）；<br>
· 停在别人的地要交租，同色系全收租金更高；<br>
· ❓机会 / ⚡命运 卡随机改变命运；掷出对子可再掷一次；<br>
· 现金不足会自动变卖房产，卖无可卖即破产出局。`,
  createEngine, ai, render,
};
