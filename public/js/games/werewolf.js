// ===== 狼人杀 =====
import { el, clear, pick, rndInt } from '../core/util.js';

// ---------- 样式 ----------
const CSS = `
.wolf-stage { position:absolute; inset:0; display:flex; flex-direction:column;
  transition: background 1.5s; overflow:hidden; }
.wolf-stage.night { background: radial-gradient(ellipse at 50% -10%, #1a2249, #05060f 80%); }
.wolf-stage.day { background: radial-gradient(ellipse at 50% -10%, #4a5a8a, #131a33 80%); }
.wolf-stage.night::before { content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 14%, #fff, transparent),
    radial-gradient(1px 1px at 32% 8%, #cdd6ff, transparent),
    radial-gradient(1.8px 1.8px at 55% 18%, #fff, transparent),
    radial-gradient(1px 1px at 72% 6%, #ffe9c9, transparent),
    radial-gradient(1.3px 1.3px at 88% 22%, #fff, transparent),
    radial-gradient(1px 1px at 20% 30%, #cdd6ff, transparent),
    radial-gradient(1.5px 1.5px at 65% 32%, #fff, transparent),
    radial-gradient(1px 1px at 42% 26%, #ffe9c9, transparent);
  animation: wolftwinkle 3.2s ease-in-out infinite alternate; }
@keyframes wolftwinkle { from { opacity:.35; } to { opacity:.95; } }
.wolf-stage.day::before { content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
  background: radial-gradient(ellipse 45% 22% at 82% 12%, rgba(255,230,150,.35), transparent); }
.wolf-banner { text-align:center; padding:86px 12px 4px; }
.wolf-banner .wb-main { font-size:21px; font-weight:800; letter-spacing:3px; text-shadow:0 0 20px rgba(140,160,255,.5); animation:pop .5s; }
.wolf-banner .wb-sub { font-size:12px; color:#9aa0b8; margin-top:4px; }
.wolf-moon { position:absolute; top:70px; right:24px; font-size:38px; filter:drop-shadow(0 0 18px rgba(200,210,255,.8)); animation:wolffloat 4s ease-in-out infinite; }
@keyframes wolffloat { 50% { transform:translateY(-8px); } }
.wolf-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px 4px; padding:10px 10px 4px; }
.wolf-seat { position:relative; cursor:pointer; }
.wolf-seat .pav-face { width:52px; height:52px; font-size:26px; margin:0 auto; }
.wolf-seat.pickable .pav-face { border-color:#ff5c8a; box-shadow:0 0 14px rgba(255,92,138,.7); animation:glowpulse 1s infinite; --glow:#ff5c8a; }
.wolf-seat .ws-no { position:absolute; top:-4px; left:8px; background:#4a58e8; font-size:10px; border-radius:8px; padding:1px 6px; z-index:2; }
.wolf-seat .ws-role { font-size:10px; color:#ffd76a; }
.wolf-seat .ws-dead { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:30px; z-index:3; }
.wolf-chat { flex:1; margin:8px 12px; background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.08);
  border-radius:14px; padding:10px; overflow-y:auto; font-size:13px; line-height:1.7; min-height:60px; }
.wolf-chat .wc-line b { color:#8fb4ff; }
.wolf-chat .wc-sys { color:#ffd76a; }
.wolf-chat .wc-night { color:#8a93b5; font-style:italic; }
.wolf-actions { padding:8px 12px calc(12px + env(safe-area-inset-bottom)); }
.wolf-say-row { display:flex; gap:8px; margin-bottom:8px; }
.wolf-say-row input { flex:1; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2);
  border-radius:20px; padding:10px 14px; color:#fff; font-size:14px; outline:none; min-width:0; }
.wolf-quick { display:flex; gap:6px; overflow-x:auto; margin-bottom:8px; padding-bottom:2px; }
.wolf-quick button { background:rgba(255,255,255,.1); color:#c9cde0; border-radius:14px; padding:6px 12px; font-size:12px; white-space:nowrap; flex-shrink:0; }
.wolf-rolecard { position:fixed; left:50%; top:42%; transform:translate(-50%,-50%); z-index:150;
  width:min(74vw,280px); border-radius:20px; padding:26px 18px; text-align:center;
  background:linear-gradient(160deg,#2a3057,#12152e); border:2px solid rgba(255,215,106,.5);
  box-shadow:0 20px 60px rgba(0,0,0,.7), 0 0 40px rgba(255,215,106,.15); animation:pop .6s cubic-bezier(.2,1.4,.4,1); }
.wolf-rolecard .wr-icon { font-size:64px; filter:drop-shadow(0 6px 14px rgba(0,0,0,.6)); }
.wolf-rolecard .wr-name { font-size:26px; font-weight:900; letter-spacing:4px; margin:10px 0 6px; color:#ffd76a; }
.wolf-rolecard .wr-desc { font-size:13px; color:#c9cde0; line-height:1.7; }
.wolf-flash { position:fixed; left:50%; top:36%; transform:translate(-50%,-50%); z-index:140; font-size:18px;
  background:rgba(20,24,48,.95); border:1px solid rgba(255,215,106,.5); padding:16px 26px; border-radius:16px;
  animation:pop .4s; text-align:center; line-height:1.8; box-shadow:0 12px 40px rgba(0,0,0,.7); }
.wolf-votetag { position:absolute; bottom:-4px; right:2px; font-size:12px; background:#ff5c8a; border-radius:8px; padding:0 5px; z-index:3; }
`;
let cssDone = false;
function ensureCss() { if (!cssDone && typeof document !== 'undefined') { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); cssDone = true; } }

const ROLE_INFO = {
  wolf:     { icon: '🐺', name: '狼人',   desc: '每晚与同伴袭击一名玩家。白天隐藏身份，把好人送出局。狼人数量不少于好人时获胜。' },
  villager: { icon: '👨‍🌾', name: '平民',   desc: '没有技能，靠推理和投票找出狼人。所有狼人出局则好人获胜。' },
  seer:     { icon: '🔮', name: '预言家', desc: '每晚查验一名玩家是好人还是狼人，是好人阵营的核心。' },
  witch:    { icon: '🧪', name: '女巫',   desc: '拥有一瓶解药和一瓶毒药（各一次）。每晚可救下被袭击者，或毒杀一人。' },
  hunter:   { icon: '🔫', name: '猎人',   desc: '被狼人杀害或被投票出局时，可以开枪带走场上任意一人。' },
};
const GOOD = ['villager', 'seer', 'witch', 'hunter'];

function rolesFor(n) {
  const t = {
    6: ['wolf','wolf','seer','witch','villager','villager'],
    7: ['wolf','wolf','seer','witch','villager','villager','villager'],
    8: ['wolf','wolf','seer','witch','hunter','villager','villager','villager'],
    9: ['wolf','wolf','wolf','seer','witch','hunter','villager','villager','villager'],
    10:['wolf','wolf','wolf','seer','witch','hunter','villager','villager','villager','villager'],
    11:['wolf','wolf','wolf','seer','witch','hunter','villager','villager','villager','villager','villager'],
    12:['wolf','wolf','wolf','wolf','seer','witch','hunter','villager','villager','villager','villager','villager'],
  };
  return t[Math.max(6, Math.min(12, n))];
}

// 稳定伪随机（同一局内 AI 判断一致）
function h01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

// ---------- 引擎 ----------
function createEngine(players, emit) {
  const P = players.map(p => ({ ...p }));
  const N = P.length;
  const seed = String(Date.now());
  const G = {
    roles: {}, alive: new Set(P.map(p => p.id)),
    day: 0, phase: 'reveal',
    wolfVotes: {}, seerDone: false, witchDone: false,
    witchPotion: { save: true, poison: true },
    nightKill: null, nightSaved: false, nightPoison: null,
    seerChecks: {},           // 真实预言家的记录 {pid: 'wolf'|'good'}
    claims: [],               // 公开的宣称 {pid, checks:[{target, verdict}], fake}
    chat: [], speechQueue: [], speaker: null,
    votes: {}, deadRoles: {}, deathCause: {},
    shootPid: null, shootAfter: null,
    over: null, sfx: null, seq: 0, destroyed: false, flash: {},
  };
  const roleList = [...rolesFor(N)].sort(() => Math.random() - .5);
  P.forEach((p, i) => { G.roles[p.id] = roleList[i]; });

  const nameOf = pid => { const i = P.findIndex(p => p.id === pid); return `${i + 1}号 ${P[i].name}`; };
  const seatNo = pid => P.findIndex(p => p.id === pid) + 1;
  const wolves = () => P.filter(p => G.roles[p.id] === 'wolf').map(p => p.id);
  const aliveList = () => P.filter(p => G.alive.has(p.id)).map(p => p.id);
  const aliveWolves = () => aliveList().filter(pid => G.roles[pid] === 'wolf');
  const findRole = (r) => P.map(p => p.id).find(pid => G.roles[pid] === r);

  function sys(txt, night = false) { G.chat.push({ sys: true, txt, night }); if (G.chat.length > 80) G.chat.shift(); }
  function later(fn, ms) { setTimeout(() => { if (!G.destroyed && !G.over) fn(); }, ms); }

  // ----- 视图 -----
  function viewFor(pid) {
    const myRole = G.roles[pid];
    const iAmDead = !G.alive.has(pid);
    const v = {
      game: 'wolf', phase: G.phase, day: G.day,
      players: P.map((p, i) => ({
        pid: p.id, no: i + 1, name: p.name,
        alive: G.alive.has(p.id),
        role: (G.deadRoles[p.id] || (iAmDead || G.over) && G.roles[p.id]) || (p.id === pid ? myRole : (myRole === 'wolf' && G.roles[p.id] === 'wolf' ? 'wolf' : null)),
        speaking: G.speaker === p.id,
      })),
      myRole, iAmDead,
      chat: G.chat.slice(-40),
      prompt: null, aiHints: null,
      flash: G.flash[pid] || null,
      voteProgress: G.phase === 'vote' ? Object.keys(G.votes).length + '/' + aliveList().length : null,
      sfx: G.sfx, seq: G.seq,
      result: G.over ? { ...G.over.base, win: G.over.winners.includes(pid) } : null,
    };
    if (myRole === 'seer') v.seerChecks = G.seerChecks;
    if (!G.over && G.alive.has(pid)) {
      if (G.phase === 'night-wolf' && myRole === 'wolf' && !(pid in G.wolfVotes)) {
        v.prompt = { type: 'wolfKill', options: aliveList().filter(x => G.roles[x] !== 'wolf'), canSkip: true,
          teammates: aliveWolves().map(w => ({ no: seatNo(w), voted: G.wolfVotes[w] !== undefined ? (G.wolfVotes[w] ? seatNo(G.wolfVotes[w]) : '空刀') : null })) };
        v.aiHints = { action: { t: 'kill', target: suggestWolfTarget() } };
      } else if (G.phase === 'night-seer' && myRole === 'seer' && !G.seerDone) {
        const opts = aliveList().filter(x => x !== pid && !(x in G.seerChecks));
        v.prompt = { type: 'seerCheck', options: opts.length ? opts : aliveList().filter(x => x !== pid) };
        v.aiHints = { action: { t: 'check', target: suggestSeerCheck(pid, v.prompt.options) } };
      } else if (G.phase === 'night-witch' && myRole === 'witch' && !G.witchDone) {
        v.prompt = {
          type: 'witch',
          victim: G.nightKill ? seatNo(G.nightKill) : null, victimPid: G.nightKill,
          canSave: G.witchPotion.save && !!G.nightKill,
          canPoison: G.witchPotion.poison,
          options: aliveList().filter(x => x !== pid),
        };
        v.aiHints = { action: suggestWitch(pid) };
      } else if (G.phase === 'speech' && G.speaker === pid) {
        v.prompt = { type: 'speech', canClaimSeer: myRole === 'seer' };
        v.aiHints = { speech: aiSpeech(pid) };
      } else if (G.phase === 'vote' && !(pid in G.votes)) {
        v.prompt = { type: 'vote', options: aliveList().filter(x => x !== pid) };
        v.aiHints = { action: { t: 'vote', target: suggestVote(pid) } };
      }
    }
    // 猎人开枪（此时猎人已死亡，不能走存活分支）
    if (!G.over && G.phase === 'shoot' && G.shootPid === pid) {
      v.prompt = { type: 'shoot', options: aliveList().filter(x => x !== pid) };
      v.aiHints = { action: { t: 'shoot', target: suggestShoot(pid) } };
    }
    // 死亡的发言者（遗言）
    if (!G.over && G.phase === 'speech' && G.speaker === pid && !G.alive.has(pid) && !v.prompt) {
      v.prompt = { type: 'speech', lastWords: true };
      v.aiHints = { speech: ['我的身份是' + ROLE_INFO[myRole].name + '，大家加油…安息了。'] };
    }
    return v;
  }
  function push(sfx = null) {
    G.sfx = sfx; G.seq++;
    for (const p of P) emit(p.id, viewFor(p.id));
    G.sfx = null; G.flash = {};
  }

  // ----- AI 建议（引擎持有全部信息） -----
  function claimedSeers() { return G.claims.filter(c => G.alive.has(c.pid)).map(c => c.pid); }
  function suggestWolfTarget() {
    const cs = claimedSeers().filter(pid => G.roles[pid] !== 'wolf');
    if (cs.length) return cs[0];
    const goods = aliveList().filter(x => G.roles[x] !== 'wolf');
    // 稍偏向神职
    const gods = goods.filter(x => G.roles[x] !== 'villager');
    if (gods.length && h01(seed + 'w' + G.day) < 0.55) return gods[Math.floor(h01(seed + 'wg' + G.day) * gods.length)];
    return goods[Math.floor(h01(seed + 'wt' + G.day) * goods.length)];
  }
  function suggestSeerCheck(pid, opts) {
    if (!opts.length) return null;
    return opts[Math.floor(h01(seed + 's' + G.day) * opts.length)];
  }
  function suggestWitch(pid) {
    if (G.nightKill && G.witchPotion.save) {
      if (G.nightKill === pid) return { t: 'save' };
      if (G.day === 1 && h01(seed + 'ws') < 0.75) return { t: 'save' };
      if (h01(seed + 'ws' + G.day) < 0.4) return { t: 'save' };
    }
    if (G.witchPotion.poison && G.day >= 2) {
      // 有查杀宣称时毒查杀目标
      for (const c of G.claims) {
        for (const ch of c.checks) {
          if (ch.verdict === 'wolf' && G.alive.has(ch.target) && ch.target !== pid && h01(seed + 'wp' + G.day) < 0.5)
            return { t: 'poison', target: ch.target };
        }
      }
    }
    return { t: 'pass' };
  }
  function suggestVote(pid) {
    const myRole = G.roles[pid];
    const alive = aliveList().filter(x => x !== pid);
    if (myRole === 'wolf') {
      const cs = claimedSeers().filter(x => G.roles[x] !== 'wolf');
      if (cs.length) return cs[0];
      const goods = alive.filter(x => G.roles[x] !== 'wolf');
      return goods.length ? goods[Math.floor(h01(seed + 'v' + G.day) * goods.length)] : alive[0];
    }
    // 好人：真预言家投查杀；其他人跟有效宣称
    if (myRole === 'seer') {
      const w = Object.keys(G.seerChecks).find(t => G.seerChecks[t] === 'wolf' && G.alive.has(t));
      if (w) return w;
    }
    for (const c of G.claims) {
      if (!G.alive.has(c.pid)) continue;
      for (const ch of c.checks) {
        if (ch.verdict === 'wolf' && G.alive.has(ch.target) && ch.target !== pid) {
          // 是否相信这个宣称（对跳时按个人随机数分边）
          if (h01(seed + 'trust' + pid + c.pid) < 0.72) return ch.target;
        }
      }
    }
    // 没线索：随机怀疑（避开宣称者）
    const pool = alive.filter(x => !claimedSeers().includes(x));
    const list = pool.length ? pool : alive;
    return list[Math.floor(h01(seed + 'rv' + pid + G.day) * list.length)];
  }
  function suggestShoot(pid) {
    const alive = aliveList().filter(x => x !== pid);
    if (G.roles[pid] !== 'wolf') {
      for (const c of G.claims) for (const ch of c.checks)
        if (ch.verdict === 'wolf' && G.alive.has(ch.target)) return ch.target;
    }
    const pool = alive.filter(x => G.roles[pid] === 'wolf' ? G.roles[x] !== 'wolf' : true);
    return (pool.length ? pool : alive)[Math.floor(h01(seed + 'sh' + G.day) * (pool.length ? pool.length : alive.length))];
  }
  function aiSpeech(pid) {
    const role = G.roles[pid];
    const lines = [];
    if (!G.alive.has(pid)) return ['我的遗言：相信好人，找出狼人！'];
    if (role === 'seer') {
      const entries = Object.entries(G.seerChecks);
      if (entries.length && !G.claims.some(c => c.pid === pid)) {
        // 真预言家跳出来报查验
        G.claims.push({ pid, fake: false, checks: entries.map(([t, vd]) => ({ target: t, verdict: vd })) });
        const last = entries[entries.length - 1];
        lines.push(`我是预言家！昨晚查验了 ${seatNo(last[0])} 号，${last[1] === 'wolf' ? '是查杀！他就是狼！' : '是金水，可以相信他。'}`);
        if (entries.length > 1) lines.push('之前的查验：' + entries.slice(0, -1).map(([t, vd]) => `${seatNo(t)}号${vd === 'wolf' ? '狼' : '好人'}`).join('，'));
      } else {
        const c = G.claims.find(c => c.pid === pid);
        const w = Object.entries(G.seerChecks).find(([t, vd]) => vd === 'wolf' && G.alive.has(t));
        lines.push(w ? `我坚持我的查验，${seatNo(w[0])} 号是狼，今天必须出他！` : '我的查验都是金水，狼在没验过的人里。');
      }
    } else if (role === 'wolf') {
      // 悍跳预言家（每局一狼、概率触发、且真预言家还没跳时更敢）
      const firstWolf = wolves()[0];
      if (pid === firstWolf && G.day >= 1 && !G.claims.some(c => c.pid === pid) && h01(seed + 'fake') < 0.4 && G.claims.filter(c => !c.fake).length <= 1) {
        const good = aliveList().filter(x => G.roles[x] !== 'wolf' && x !== pid);
        const victim = good[Math.floor(h01(seed + 'fkt' + G.day) * good.length)];
        G.claims.push({ pid, fake: true, checks: [{ target: victim, verdict: 'wolf' }] });
        lines.push(`我才是真预言家！昨晚验了 ${seatNo(victim)} 号，是查杀！对面跳预言家的是狼！`);
      } else {
        const t = suggestVote(pid);
        lines.push(pick([
          '我是平民，昨晚没信息，听神职的。',
          `我感觉 ${seatNo(t)} 号发言有点躲，重点怀疑他。`,
          '大家冷静分析，别被节奏带偏了。',
          `${seatNo(t)} 号一直不敢对视，我票他。`,
        ]));
      }
    } else if (role === 'witch') {
      lines.push(pick(['我有身份，先不亮，大家正常发言。', '昨晚的信息我记下了，关键时刻我会站出来。', '我是好人，今天先听预言家的。']));
    } else if (role === 'hunter') {
      lines.push(pick(['我是好人，谁冲我我带走谁。', '别惹我，我手里有关键身份。', '我是好人，票型给到位。']));
    } else {
      const t = suggestVote(pid);
      lines.push(pick([
        '我是平民，没什么信息，跟好人走。',
        `听下来 ${seatNo(t)} 号最可疑，我盯他。`,
        '预言家的话我信，按查杀投。',
        `${seatNo(t)} 号刚才的发言逻辑有问题。`,
        '这局狼藏得深啊，大家仔细品发言。',
      ]));
    }
    return lines;
  }

  // ----- 流程 -----
  function checkWin() {
    const alive = aliveList();
    const w = alive.filter(x => G.roles[x] === 'wolf').length;
    const g = alive.length - w;
    let winners = null, title = '';
    if (w === 0) { winners = P.filter(p => GOOD.includes(G.roles[p.id])).map(p => p.id); title = '好人胜利'; }
    else if (w >= g) { winners = wolves(); title = '狼人胜利'; }
    if (winners) {
      G.over = {
        winners,
        base: {
          title,
          lines: P.map((p, i) => `${i + 1}号 ${p.name} — ${ROLE_INFO[G.roles[p.id]].icon}${ROLE_INFO[G.roles[p.id]].name}${G.alive.has(p.id) ? '' : '（出局）'}`),
        },
      };
      sys(`🏁 ${title}！身份全部公开。`);
      push(title === '狼人胜利' ? 'wolf' : 'win');
      return true;
    }
    return false;
  }

  function kill(pid, cause) {
    if (!G.alive.has(pid)) return;
    G.alive.delete(pid);
    G.deadRoles[pid] = G.roles[pid];
    G.deathCause[pid] = cause;
  }

  function startNight() {
    G.day++;
    G.phase = 'night-wolf';
    G.wolfVotes = {}; G.seerDone = false; G.witchDone = false;
    G.nightKill = null; G.nightSaved = false; G.nightPoison = null;
    sys(`—— 第 ${G.day} 夜 · 天黑请闭眼 ——`, true);
    push('night');
  }

  function resolveWolfVotes() {
    const tally = {};
    for (const w of aliveWolves()) {
      const t = G.wolfVotes[w];
      if (t) tally[t] = (tally[t] || 0) + 1;
    }
    const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    G.nightKill = entries.length ? entries[0][0] : null;
    G.phase = 'night-seer';
    if (!findRole('seer') || !G.alive.has(findRole('seer'))) {
      later(() => witchPhase(), rndInt(1500, 3000));
      push();
    } else push('wolf');
  }

  function witchPhase() {
    G.phase = 'night-witch';
    const witch = findRole('witch');
    if (!witch || !G.alive.has(witch) || (!G.witchPotion.save && !G.witchPotion.poison)) {
      later(dawn, rndInt(1200, 2500));
      push();
    } else push();
  }

  function dawn() {
    G.phase = 'day';
    const deaths = [];
    if (G.nightKill && !G.nightSaved) { kill(G.nightKill, 'wolf'); deaths.push(G.nightKill); }
    if (G.nightPoison && G.alive.has(G.nightPoison)) { kill(G.nightPoison, 'poison'); deaths.push(G.nightPoison); }
    sys(`—— 第 ${G.day} 天 · 天亮了 ——`);
    if (deaths.length === 0) sys('☀️ 昨晚是平安夜，没有人死亡。');
    else for (const d of deaths) sys(`💀 昨晚 ${nameOf(d)} 死了，身份是【${ROLE_INFO[G.roles[d]].icon}${ROLE_INFO[G.roles[d]].name}】`);
    push('day');
    if (checkWin()) return;
    // 猎人夜死（狼刀）可开枪
    const hunterDead = deaths.find(d => G.roles[d] === 'hunter' && G.deathCause[d] === 'wolf');
    if (hunterDead) {
      G.phase = 'shoot'; G.shootPid = hunterDead; G.shootAfter = 'speech';
      sys(`🔫 猎人 ${nameOf(hunterDead)} 亮出猎枪，可以带走一人！`);
      G.speechDeaths = deaths;
      push('shoot');
      return;
    }
    later(() => beginSpeech(deaths), 2200);
  }

  function beginSpeech(newDead = []) {
    G.phase = 'speech';
    const alive = aliveList();
    G.speechQueue = [...newDead.filter(d => G.day === 1), ...alive];
    sys('🗣️ 进入发言阶段' + (newDead.length && G.day === 1 ? '（死者可留遗言）' : ''));
    nextSpeaker();
  }
  function nextSpeaker() {
    if (!G.speechQueue.length) {
      G.phase = 'vote'; G.votes = {};
      sys('🗳️ 发言结束，开始投票！');
      push('vote');
      return;
    }
    G.speaker = G.speechQueue.shift();
    sys(`👉 请 ${nameOf(G.speaker)} 发言`);
    push('turn');
  }

  function resolveVotes() {
    const tally = {};
    const detail = [];
    for (const [voter, t] of Object.entries(G.votes)) {
      if (t) { tally[t] = (tally[t] || 0) + 1; detail.push(`${seatNo(voter)}→${seatNo(t)}`); }
      else detail.push(`${seatNo(voter)}弃`);
    }
    sys('📊 票型：' + detail.join('，'));
    const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    if (!entries.length || (entries.length > 1 && entries[0][1] === entries[1][1])) {
      sys('⚖️ 平票，本轮无人出局。');
      push('pass');
      later(startNight, 2200);
      return;
    }
    const out = entries[0][0];
    kill(out, 'vote');
    sys(`🚪 ${nameOf(out)} 被投票出局，身份是【${ROLE_INFO[G.roles[out]].icon}${ROLE_INFO[G.roles[out]].name}】`);
    push('lose');
    if (checkWin()) return;
    if (G.roles[out] === 'hunter') {
      G.phase = 'shoot'; G.shootPid = out; G.shootAfter = 'night';
      sys(`🔫 猎人 ${nameOf(out)} 亮出猎枪，可以带走一人！`);
      push('shoot');
      return;
    }
    later(startNight, 2400);
  }

  return {
    start() {
      sys(`🌙 欢迎来到狼人杀！本局 ${N} 人：狼人×${rolesFor(N).filter(r => r === 'wolf').length}、预言家、女巫${rolesFor(N).includes('hunter') ? '、猎人' : ''}，其余为平民。`);
      sys('请查看你的身份牌…');
      push('night');
      later(startNight, 6000);
    },
    destroy() { G.destroyed = true; },
    onAction(pid, a) {
      if (G.over || !a) return;
      const role = G.roles[pid];

      if (G.phase === 'night-wolf' && role === 'wolf' && G.alive.has(pid) && a.t === 'kill') {
        if (pid in G.wolfVotes) return;
        const target = a.target && G.alive.has(a.target) && G.roles[a.target] !== 'wolf' ? a.target : null;
        G.wolfVotes[pid] = target;
        if (aliveWolves().every(w => w in G.wolfVotes)) resolveWolfVotes();
        else push();
      } else if (G.phase === 'night-seer' && role === 'seer' && G.alive.has(pid) && a.t === 'check' && !G.seerDone) {
        if (!a.target || !G.alive.has(a.target) || a.target === pid) return;
        G.seerDone = true;
        const verdict = G.roles[a.target] === 'wolf' ? 'wolf' : 'good';
        G.seerChecks[a.target] = verdict;
        G.flash[pid] = `🔮 查验结果：${nameOf(a.target)} 是 ${verdict === 'wolf' ? '🐺 狼人！' : '✅ 好人'}`;
        push();
        later(witchPhase, rndInt(1200, 2200));
      } else if (G.phase === 'night-witch' && role === 'witch' && G.alive.has(pid) && !G.witchDone) {
        if (a.t === 'save' && G.witchPotion.save && G.nightKill) {
          G.witchDone = true; G.witchPotion.save = false; G.nightSaved = true;
          G.flash[pid] = '🧪 你使用了解药，' + nameOf(G.nightKill) + ' 被救活';
        } else if (a.t === 'poison' && G.witchPotion.poison && a.target && G.alive.has(a.target)) {
          G.witchDone = true; G.witchPotion.poison = false; G.nightPoison = a.target;
          G.flash[pid] = '☠️ 你对 ' + nameOf(a.target) + ' 使用了毒药';
        } else if (a.t === 'pass') {
          G.witchDone = true;
        } else return;
        push();
        later(dawn, rndInt(1500, 2600));
      } else if (G.phase === 'speech' && G.speaker === pid) {
        if (a.t === 'say' && a.txt) {
          const txt = String(a.txt).slice(0, 100);
          G.chat.push({ pid, no: seatNo(pid), txt });
          push('click');
        } else if (a.t === 'claim' && role === 'seer') {
          // 真预言家一键公布查验
          if (!G.claims.some(c => c.pid === pid)) {
            G.claims.push({ pid, fake: false, checks: Object.entries(G.seerChecks).map(([t, vd]) => ({ target: t, verdict: vd })) });
          }
          const txt = '我是预言家！查验记录：' + (Object.entries(G.seerChecks).map(([t, vd]) => `${seatNo(t)}号=${vd === 'wolf' ? '查杀🐺' : '金水✅'}`).join('，') || '暂无');
          G.chat.push({ pid, no: seatNo(pid), txt });
          push('turn');
        } else if (a.t === 'done') {
          nextSpeaker();
        }
      } else if (G.phase === 'vote' && G.alive.has(pid) && a.t === 'vote' && !(pid in G.votes)) {
        const target = a.target && G.alive.has(a.target) && a.target !== pid ? a.target : null;
        G.votes[pid] = target;
        push('vote');
        if (aliveList().every(x => x in G.votes)) resolveVotes();
      } else if (G.phase === 'shoot' && G.shootPid === pid && a.t === 'shoot') {
        const target = a.target && G.alive.has(a.target) && a.target !== pid ? a.target : null;
        if (target) {
          kill(target, 'shoot');
          sys(`💥 猎人开枪带走了 ${nameOf(target)}，身份是【${ROLE_INFO[G.roles[target]].icon}${ROLE_INFO[G.roles[target]].name}】`);
        } else sys('猎人收起了猎枪，没有开枪。');
        push('shoot');
        if (checkWin()) return;
        const after = G.shootAfter;
        G.shootPid = null;
        if (after === 'speech') later(() => beginSpeech(G.speechDeaths || []), 2000);
        else later(startNight, 2200);
      }
    },
  };
}

// ---------- AI ----------
function ai(view, act) {
  if (!view || view.game !== 'wolf' || view.result) return;
  if (view.aiHints) {
    if (view.aiHints.speech) {
      for (const line of view.aiHints.speech) act({ t: 'say', txt: line });
      act({ t: 'done' });
      return;
    }
    if (view.aiHints.action) { act(view.aiHints.action); return; }
  }
  // 兜底：有 prompt 但无提示
  if (view.prompt) {
    const p = view.prompt;
    if (p.type === 'speech') { act({ t: 'done' }); }
    else if (p.options && p.options.length) {
      const t = pick(p.options);
      const map = { wolfKill: 'kill', seerCheck: 'check', vote: 'vote', shoot: 'shoot' };
      if (p.type === 'witch') act({ t: 'pass' });
      else act({ t: map[p.type], target: t });
    }
  }
}

// ---------- 渲染 ----------
const QUICK_PHRASES = ['我是平民', '我是好人', '昨晚平安夜说明狼在慌', '我觉得有人发言很飘', '听预言家的，跟查杀走', '我先过，后置位再看', '别投我，投我亏的'];

function render(root, view, send, ctx) {
  ensureCss();
  clear(root);
  const isNight = view.phase.startsWith('night') || view.phase === 'reveal';
  const stage = el('div', 'wolf-stage ' + (isNight ? 'night' : 'day'));
  root.appendChild(stage);

  stage.appendChild(el('div', 'wolf-moon', isNight ? '🌙' : '☀️'));

  // 顶部横幅
  const banner = el('div', 'wolf-banner');
  const phaseTxt = {
    'reveal': '身份分配中…',
    'night-wolf': `第 ${view.day} 夜 · 狼人正在行动`,
    'night-seer': `第 ${view.day} 夜 · 预言家正在查验`,
    'night-witch': `第 ${view.day} 夜 · 女巫正在用药`,
    'day': `第 ${view.day} 天 · 天亮了`,
    'speech': `第 ${view.day} 天 · 发言阶段`,
    'vote': `第 ${view.day} 天 · 投票阶段` + (view.voteProgress ? `（${view.voteProgress}）` : ''),
    'shoot': '🔫 猎人时刻',
  }[view.phase] || '';
  banner.appendChild(el('div', 'wb-main', phaseTxt));
  const me = view.players.find(p => p.pid === ctx.myId);
  banner.appendChild(el('div', 'wb-sub',
    `我的身份：${ROLE_INFO[view.myRole].icon} ${ROLE_INFO[view.myRole].name}` + (view.iAmDead ? '（已出局 · 上帝视角）' : '')));
  stage.appendChild(banner);

  // 座位区
  const pickTargets = view.prompt && view.prompt.options ? new Set(view.prompt.options) : null;
  const needPick = view.prompt && ['wolfKill', 'seerCheck', 'vote', 'shoot'].includes(view.prompt.type);
  const witchPick = view.prompt && view.prompt.type === 'witch';
  const grid = el('div', 'wolf-grid');
  for (const p of view.players) {
    const seat = el('div', 'wolf-seat pav' + (p.speaking ? ' turn' : '') + (!p.alive ? ' dead' : ''));
    seat.appendChild(el('div', 'ws-no', p.no + '号'));
    const face = el('div', 'pav-face', ctx.avatarOf(p.pid));
    seat.appendChild(face);
    seat.appendChild(el('div', 'pav-name', p.name + (p.pid === ctx.myId ? '(我)' : '')));
    if (p.role) seat.appendChild(el('div', 'ws-role', ROLE_INFO[p.role].icon + ROLE_INFO[p.role].name));
    if (!p.alive) seat.appendChild(el('div', 'ws-dead', '🪦'));
    if ((needPick || witchPick) && pickTargets && pickTargets.has(p.pid) && p.alive) {
      seat.classList.add('pickable');
      seat.onclick = () => {
        ctx.audio.play('select');
        const pt = view.prompt.type;
        if (pt === 'wolfKill') send({ t: 'kill', target: p.pid });
        else if (pt === 'seerCheck') send({ t: 'check', target: p.pid });
        else if (pt === 'vote') send({ t: 'vote', target: p.pid });
        else if (pt === 'shoot') send({ t: 'shoot', target: p.pid });
        else if (pt === 'witch' && view.prompt.canPoison) send({ t: 'poison', target: p.pid });
      };
    }
    // 狼队友投刀显示
    if (view.prompt && view.prompt.type === 'wolfKill') {
      const tm = view.prompt.teammates.find(x => x.no === p.no);
      if (tm && tm.voted) seat.appendChild(el('div', 'wolf-votetag', '刀' + tm.voted));
    }
    grid.appendChild(seat);
  }
  stage.appendChild(grid);

  // 聊天/日志
  const chatBox = el('div', 'wolf-chat');
  for (const c of view.chat) {
    if (c.sys) chatBox.appendChild(el('div', 'wc-line ' + (c.night ? 'wc-night' : 'wc-sys'), c.txt));
    else {
      const line = el('div', 'wc-line');
      line.innerHTML = `<b>${c.no}号：</b>${c.txt.replace(/</g, '&lt;')}`;
      chatBox.appendChild(line);
    }
  }
  stage.appendChild(chatBox);
  requestAnimationFrame(() => { chatBox.scrollTop = chatBox.scrollHeight; });

  // 操作区
  const actions = el('div', 'wolf-actions');
  const pr = view.prompt;
  if (pr) {
    if (pr.type === 'speech') {
      const quick = el('div', 'wolf-quick');
      for (const q of QUICK_PHRASES) {
        const b = el('button', '', q);
        b.onclick = () => { inp.value = q; };
        quick.appendChild(b);
      }
      actions.appendChild(quick);
      const row = el('div', 'wolf-say-row');
      const inp = el('input');
      inp.placeholder = pr.lastWords ? '留下你的遗言…' : '输入发言内容…';
      inp.maxLength = 100;
      const bSend = el('button', 'act-btn', '发送');
      bSend.onclick = () => { if (inp.value.trim()) { send({ t: 'say', txt: inp.value.trim() }); inp.value = ''; } };
      row.appendChild(inp); row.appendChild(bSend);
      actions.appendChild(row);
      const row2 = el('div', 'wolf-say-row');
      if (pr.canClaimSeer) {
        const bClaim = el('button', 'act-btn warm', '🔮 公布查验');
        bClaim.onclick = () => send({ t: 'claim' });
        row2.appendChild(bClaim);
      }
      const bDone = el('button', 'act-btn plain', pr.lastWords ? '说完了' : '结束发言');
      bDone.style.flex = '1';
      bDone.onclick = () => send({ t: 'done' });
      row2.appendChild(bDone);
      actions.appendChild(row2);
    } else if (pr.type === 'wolfKill') {
      const tip = el('div', '', '🐺 点击头像选择今晚的目标' + (pr.teammates.length > 1 ? '（狼队按多数决定）' : ''));
      tip.style.cssText = 'text-align:center;color:#ff8fae;font-size:13px;margin-bottom:8px';
      actions.appendChild(tip);
      const bSkip = el('button', 'act-btn plain', '空刀（今晚不杀人）');
      bSkip.style.cssText = 'display:block;margin:0 auto';
      bSkip.onclick = () => send({ t: 'kill', target: null });
      actions.appendChild(bSkip);
    } else if (pr.type === 'seerCheck') {
      const tip = el('div', '', '🔮 点击头像查验一名玩家的身份');
      tip.style.cssText = 'text-align:center;color:#8fb4ff;font-size:13px';
      actions.appendChild(tip);
    } else if (pr.type === 'witch') {
      const tip = el('div', '', pr.victim ? `☠️ 昨晚 ${pr.victim} 号被袭击了` : '☀️ 今晚没有人被袭击');
      tip.style.cssText = 'text-align:center;color:#c9a5ff;font-size:13px;margin-bottom:8px';
      actions.appendChild(tip);
      const row = el('div', 'wolf-say-row');
      if (pr.canSave) {
        const b = el('button', 'act-btn warm', '🧪 使用解药');
        b.style.flex = '1';
        b.onclick = () => send({ t: 'save' });
        row.appendChild(b);
      }
      if (pr.canPoison) {
        const info = el('button', 'act-btn', '☠️ 点头像下毒');
        info.style.flex = '1';
        info.disabled = true;
        row.appendChild(info);
      }
      const bPass = el('button', 'act-btn plain', '不用药');
      bPass.style.flex = '1';
      bPass.onclick = () => send({ t: 'pass' });
      row.appendChild(bPass);
      actions.appendChild(row);
    } else if (pr.type === 'vote') {
      const tip = el('div', '', '🗳️ 点击头像投出你的一票');
      tip.style.cssText = 'text-align:center;color:#ffd76a;font-size:13px;margin-bottom:8px';
      actions.appendChild(tip);
      const bAbstain = el('button', 'act-btn plain', '弃票');
      bAbstain.style.cssText = 'display:block;margin:0 auto';
      bAbstain.onclick = () => send({ t: 'vote', target: null });
      actions.appendChild(bAbstain);
    } else if (pr.type === 'shoot') {
      const tip = el('div', '', '🔫 点击头像开枪带走一人');
      tip.style.cssText = 'text-align:center;color:#ff8fae;font-size:13px;margin-bottom:8px';
      actions.appendChild(tip);
      const bNo = el('button', 'act-btn plain', '不开枪');
      bNo.style.cssText = 'display:block;margin:0 auto';
      bNo.onclick = () => send({ t: 'shoot', target: null });
      actions.appendChild(bNo);
    }
  } else if (!view.result) {
    const wait = el('div', '', isNight ? '🌙 夜深了，等待行动结束…' : '等待其他玩家…');
    wait.style.cssText = 'text-align:center;color:#8a93b5;font-size:13px;padding:6px';
    actions.appendChild(wait);
  }
  stage.appendChild(actions);

  // 身份牌（开局展示）
  if (view.phase === 'reveal') {
    const rc = el('div', 'wolf-rolecard');
    const info = ROLE_INFO[view.myRole];
    rc.appendChild(el('div', 'wr-icon', info.icon));
    rc.appendChild(el('div', 'wr-name', info.name));
    rc.appendChild(el('div', 'wr-desc', info.desc));
    stage.appendChild(rc);
  }
  // 私密结果闪示（查验结果 / 用药反馈）
  if (view.flash) {
    const f = el('div', 'wolf-flash', view.flash);
    stage.appendChild(f);
    setTimeout(() => f.remove(), 2800);
  }

  if (root._wolfSeq !== view.seq && view.prompt) ctx.audio.play('turn');
  root._wolfSeq = view.seq;
}

export default {
  id: 'wolf', name: '狼人杀', icon: '🐺',
  desc: '月黑风高，谁是披着羊皮的狼？发言、推理、投票，心理博弈之王。',
  theme: 'linear-gradient(140deg, #1e1b4b, #7c3aed 140%)',
  minPlayers: 6, maxPlayers: 12, defaultPlayers: 8,
  help: `<b>阵营</b>：狼人 VS 好人（平民+神职）。<br><br>
· 🌙 夜晚：狼人袭击一人 → 预言家查验一人 → 女巫用药（解药/毒药各一瓶）；<br>
· ☀️ 白天：公布死讯 → 依次发言 → 投票放逐一人（平票无人出局）；<br>
· 🔫 猎人被狼杀或被投出局时可开枪带人；被毒死不能开枪；<br>
· 狼人全部出局 → 好人胜；狼人数 ≥ 好人数 → 狼人胜；<br>
· 出局后进入上帝视角，可观战到结束。`,
  createEngine, ai, render,
};
