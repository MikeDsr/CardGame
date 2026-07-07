// ===== 三国杀（身份场·加强版） =====
import { el, clear, shuffle, toast, pick, suitText } from '../core/util.js';

// ---------- 样式 ----------
const CSS = `
.sgs-stage { position:absolute; inset:0; display:flex; flex-direction:column;
  background: radial-gradient(ellipse at 50% 0%, #3b2413, #140a04 75%); }
.sgs-stage::before { content:''; position:absolute; inset:0; pointer-events:none; opacity:.5;
  background: radial-gradient(ellipse 70% 30% at 50% 108%, rgba(255,160,60,.22), transparent); }
.sgs-seats { display:flex; gap:8px; overflow-x:auto; padding:84px 10px 6px; flex-shrink:0; }
.sgs-seat { min-width:98px; background:linear-gradient(160deg,#43301c,#241708); border:1.5px solid #6b4a26;
  border-radius:12px; padding:6px 8px; font-size:11px; position:relative; flex-shrink:0; transition:box-shadow .3s, border-color .3s; }
.sgs-seat.turn { border-color:#ffd76a; box-shadow:0 0 16px rgba(255,215,106,.5); }
.sgs-seat.dead { filter:grayscale(1) brightness(.5); }
.sgs-seat.pickable { border-color:#ff5c8a; box-shadow:0 0 16px rgba(255,92,138,.8); animation:glowpulse 1s infinite; --glow:#ff5c8a; cursor:pointer; }
.sgs-seat.picked-a { border-color:#5cd8ff; box-shadow:0 0 16px rgba(92,216,255,.8); }
.sgs-seat.hit { animation:sgshit .5s; }
@keyframes sgshit { 0%,100%{transform:translateX(0);filter:none} 20%{transform:translateX(-5px);filter:brightness(1.8) sepia(.6) hue-rotate(-40deg)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px);filter:brightness(1.6) sepia(.5) hue-rotate(-40deg)} 80%{transform:translateX(3px)} }
.sgs-seat .sg-name { font-weight:800; font-size:13px; color:#ffd8a8; }
.sgs-seat .sg-gen { color:#ffd76a; }
.sgs-seat .sg-hp { letter-spacing:1px; font-size:12px; }
.sgs-seat .sg-eq { color:#a8c8ff; font-size:10px; line-height:1.5; min-height:12px; }
.sgs-seat .sg-id { position:absolute; top:-7px; right:-4px; font-size:14px; }
.sgs-seat .sg-judge { position:absolute; top:-7px; left:-4px; font-size:13px; filter:drop-shadow(0 0 4px #a78bfa); }
.sgs-seat .sg-cnt { position:absolute; bottom:4px; right:6px; background:#4a58e8; border-radius:8px; padding:0 6px; font-size:10px; }
.sgs-seat .sg-dead-mark { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:26px; }
.sgs-seat .sg-float { position:absolute; left:50%; top:20%; transform:translateX(-50%); font-size:22px; font-weight:900;
  color:#ff4b4b; text-shadow:0 0 8px #000; animation:floatup 1.1s forwards; pointer-events:none; z-index:20; }
.sgs-mid { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; position:relative; overflow:hidden; }
.sgs-info { font-size:14px; color:#ffd76a; text-align:center; text-shadow:0 1px 4px #000; padding:0 16px; line-height:1.6; }
.sgs-lastcard { display:flex; gap:6px; animation:pop .3s; }
.sgs-me { padding:6px 10px calc(10px + env(safe-area-inset-bottom)); }
.sgs-me-status { display:flex; align-items:center; gap:10px; font-size:12px; margin-bottom:6px; flex-wrap:wrap; }
.sgs-me-status .sg-hp { font-size:14px; }
.sgs-hand { display:flex; overflow-x:auto; gap:6px; padding:14px 2px 6px; min-height:104px; }
.sgs-card { width:60px; height:84px; border-radius:8px; background:linear-gradient(160deg,#f9f3e0,#eadcc0 60%,#dfd0ae); color:#3a2a10;
  position:relative; flex-shrink:0; border:1.5px solid #b09a6a; transition:transform .15s, box-shadow .15s;
  display:flex; align-items:center; justify-content:center; text-align:center;
  box-shadow:0 3px 8px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.7); }
.sgs-card::after { content:''; position:absolute; inset:0; border-radius:6px; pointer-events:none;
  background:linear-gradient(115deg, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 30%, rgba(90,60,20,.08) 100%); }
.sgs-card.equip { border-color:#c9a227; box-shadow:0 3px 8px rgba(0,0,0,.5), inset 0 0 0 1px rgba(201,162,39,.5); }
.sgs-card .sc-name { font-weight:900; font-size:14px; line-height:1.2; padding:0 2px; }
.sgs-card .sc-corner { position:absolute; top:3px; left:4px; font-size:10px; line-height:1.1; font-weight:700; }
.sgs-card .sc-corner.red { color:#c22; }
.sgs-card .sc-type { position:absolute; bottom:3px; right:5px; font-size:9px; color:#8a6a3a; }
.sgs-card.sel { transform:translateY(-12px); box-shadow:0 0 14px rgba(255,215,106,.8); border-color:#ffd76a; }
.sgs-card.usable { box-shadow:0 0 10px rgba(120,255,150,.5); border-color:#7be08a; }
.sgs-card.dim { filter:grayscale(.6) brightness(.65); }
.sgs-card.basic { background:linear-gradient(160deg,#fdf2f2,#f3d9d1); }
.sgs-card.trick { background:linear-gradient(160deg,#eef4fd,#d3e0f3); }
.sgs-card.equip { background:linear-gradient(160deg,#f2fdef,#dcf3d1); }
.sgs-btns { display:flex; gap:8px; flex-wrap:wrap; }
.sgs-choose { position:absolute; inset:0; z-index:80; display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:14px; background:rgba(10,5,2,.88); backdrop-filter:blur(4px); padding:20px; }
.sgs-choose h3 { font-size:22px; letter-spacing:4px; color:#ffd76a; text-shadow:0 0 20px rgba(255,180,80,.5); }
.sgs-choose .sub { font-size:12px; color:#c9a06a; }
.sgs-gencards { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
.sgs-gencard { width:104px; border-radius:14px; padding:14px 8px; text-align:center; cursor:pointer;
  background:linear-gradient(165deg,#4a3520,#2a1a0c);
  border:2px solid #8a6a3a; transition:transform .15s, box-shadow .2s; animation:pop .4s both; }
.sgs-gencard:active { transform:scale(.94); }
.sgs-gencard:nth-child(2){ animation-delay:.08s } .sgs-gencard:nth-child(3){ animation-delay:.16s }
.sgs-gencard .gi { font-size:38px; filter:drop-shadow(0 4px 10px rgba(0,0,0,.6)); }
.sgs-gencard .gn { font-size:17px; font-weight:900; color:#ffd8a8; margin:6px 0 2px; letter-spacing:2px; }
.sgs-gencard .gh { font-size:11px; }
.sgs-gencard .gs { font-size:10.5px; color:#c9a06a; line-height:1.5; margin-top:4px; }
.sgs-gencard .gs b { color:#ffd76a; }
`;
let cssDone = false;
function ensureCss() { if (!cssDone && typeof document !== 'undefined') { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); cssDone = true; } }

// ---------- 数据 ----------
const GENERALS = {
  caocao:  { name: '曹操', icon: '🧠', hp: 4, skill: '奸雄', desc: '受到伤害时，获得造成伤害的牌' },
  liubei:  { name: '刘备', icon: '🤝', hp: 4, skill: '仁德', desc: '出牌阶段限一次，送手牌给他人，≥2张回复1点体力' },
  sunquan: { name: '孙权', icon: '⚖️', hp: 4, skill: '制衡', desc: '出牌阶段限一次，弃任意手牌并摸等量牌' },
  guanyu:  { name: '关羽', icon: '🗡️', hp: 4, skill: '武圣', desc: '红色手牌可当【杀】使用或打出' },
  zhangfei:{ name: '张飞', icon: '🐯', hp: 4, skill: '咆哮', desc: '出牌阶段可使用任意张【杀】' },
  zhaoyun: { name: '赵云', icon: '🐲', hp: 4, skill: '龙胆', desc: '【杀】可当【闪】，【闪】可当【杀】' },
  huatuo:  { name: '华佗', icon: '💊', hp: 3, skill: '急救', desc: '濒死求桃时，红色手牌可当【桃】' },
  lvbu:    { name: '吕布', icon: '🔱', hp: 4, skill: '无双', desc: '你的【杀】需要两张【闪】抵消' },
  simayi:  { name: '司马懿', icon: '🦉', hp: 3, skill: '反馈', desc: '受到伤害后，获得伤害来源的一张牌' },
  huanggai:{ name: '黄盖', icon: '🔥', hp: 4, skill: '苦肉', desc: '出牌阶段可失去1点体力，摸两张牌（可多次）' },
  guojia:  { name: '郭嘉', icon: '🍶', hp: 3, skill: '遗计', desc: '每受到1点伤害，摸两张牌' },
  diaochan:{ name: '貂蝉', icon: '🌙', hp: 3, skill: '离间', desc: '出牌阶段限一次，弃一张牌令两名角色决斗' },
};
const CARD_INFO = {
  sha:     { name: '杀', type: 'basic' },
  shan:    { name: '闪', type: 'basic' },
  tao:     { name: '桃', type: 'basic' },
  wuzhong: { name: '无中生有', type: 'trick' },
  guochai: { name: '过河拆桥', type: 'trick' },
  shunshou:{ name: '顺手牵羊', type: 'trick' },
  juedou:  { name: '决斗', type: 'trick' },
  nanman:  { name: '南蛮入侵', type: 'trick' },
  wanjian: { name: '万箭齐发', type: 'trick' },
  taoyuan: { name: '桃园结义', type: 'trick' },
  wuxie:   { name: '无懈可击', type: 'trick' },
  lebu:    { name: '乐不思蜀', type: 'trick' },
  liannu:  { name: '诸葛连弩', type: 'equip', slot: 'weapon', range: 1 },
  qinglong:{ name: '青龙偃月刀', type: 'equip', slot: 'weapon', range: 3 },
  huaji:   { name: '方天画戟', type: 'equip', slot: 'weapon', range: 4 },
  bagua:   { name: '八卦阵', type: 'equip', slot: 'armor' },
  jia1:    { name: '+1马', type: 'equip', slot: 'horseP' },
  jian1:   { name: '-1马', type: 'equip', slot: 'horseM' },
};
const ID_INFO = { zhu: { name: '主公', icon: '👑' }, zhong: { name: '忠臣', icon: '🛡️' }, fan: { name: '反贼', icon: '⚔️' }, nei: { name: '内奸', icon: '🎭' } };
function identitiesFor(n) {
  return {
    4: ['zhu', 'fan', 'fan', 'nei'],
    5: ['zhu', 'zhong', 'fan', 'fan', 'nei'],
    6: ['zhu', 'zhong', 'fan', 'fan', 'fan', 'nei'],
    7: ['zhu', 'zhong', 'zhong', 'fan', 'fan', 'fan', 'nei'],
    8: ['zhu', 'zhong', 'zhong', 'fan', 'fan', 'fan', 'fan', 'nei'],
  }[Math.max(4, Math.min(8, n))];
}
const isRed = c => c.s === 1 || c.s === 3;

function buildDeck() {
  const spec = [['sha', 24], ['shan', 15], ['tao', 8], ['wuzhong', 4], ['guochai', 4], ['shunshou', 3],
    ['juedou', 3], ['nanman', 2], ['wanjian', 1], ['taoyuan', 1], ['wuxie', 3], ['lebu', 3],
    ['liannu', 1], ['qinglong', 1], ['huaji', 1], ['bagua', 2], ['jia1', 2], ['jian1', 2]];
  const deck = [];
  for (const [n, cnt] of spec) for (let i = 0; i < cnt; i++) deck.push({ n, s: Math.floor(Math.random() * 4), r: 1 + Math.floor(Math.random() * 13) });
  return shuffle(deck);
}

// ---------- 引擎 ----------
function createEngine(players, emit) {
  const P = players.map(p => ({ ...p }));
  const N = P.length;
  const ids = shuffle(identitiesFor(N));
  const G = {
    ps: {}, deck: buildDeck(), discard: [],
    turn: 0, phase: 'chooseGen', turnSha: 0, usedSkill: {}, busy: false,
    pend: null, log: [], over: null, sfx: null, seq: 0, destroyed: false,
    lastPlayed: null, waitInfo: '', lastDmgAnim: null,
    genChoices: {}, chosen: {},
  };
  P.forEach((p, i) => {
    G.ps[p.id] = { gen: null, id: ids[i], hp: 0, maxHp: 0, hand: [], eq: {}, judge: null, alive: true };
  });
  // 选将：真人 3 选 1（人多时候选减少），AI 自动
  {
    const pool = shuffle(Object.keys(GENERALS));
    const humans = P.filter(p => !p.ai);
    const per = humans.length ? Math.max(1, Math.min(3, Math.floor(pool.length / Math.max(1, humans.length)))) : 0;
    let k = 0;
    for (const h of humans) { G.genChoices[h.id] = pool.slice(k, k + per); k += per; }
  }

  const st = pid => G.ps[pid];
  const nameOf = pid => {
    const i = P.findIndex(p => p.id === pid);
    const g = st(pid).gen;
    return `${g ? GENERALS[g].name : ''}(${P[i].name})`;
  };
  const aliveList = () => P.filter(p => st(p.id).alive).map(p => p.id);
  const cur = () => P[G.turn].id;

  function log(s) { G.log.push(s); if (G.log.length > 60) G.log.shift(); }
  function later(fn, ms) { setTimeout(() => { if (!G.destroyed && !G.over) fn(); }, ms); }

  function drawCard() {
    if (!G.deck.length) {
      if (!G.discard.length) return null;
      G.deck = shuffle(G.discard.splice(0));
      log('🔄 弃牌堆洗回牌堆');
    }
    return G.deck.pop();
  }
  function draw(pid, n) { for (let i = 0; i < n; i++) { const c = drawCard(); if (c) st(pid).hand.push(c); } }
  function toDiscard(cards) { for (const c of cards) if (c) G.discard.push(c); }

  function dist(a, b) {
    const order = P.filter(p => st(p.id).alive).map(p => p.id);
    const oa = order.indexOf(a), ob = order.indexOf(b);
    if (oa < 0 || ob < 0) return 99;
    const d0 = Math.min(Math.abs(oa - ob), order.length - Math.abs(oa - ob));
    return Math.max(1, d0 + (st(b).eq.horseP ? 1 : 0) - (st(a).eq.horseM ? 1 : 0));
  }
  const atkRange = pid => { const w = st(pid).eq.weapon; return w ? (CARD_INFO[w.n].range || 1) : 1; };
  const inShaRange = (a, b) => dist(a, b) <= atkRange(a);

  const canAsSha = (pid, c) => c.n === 'sha' || (st(pid).gen === 'zhaoyun' && c.n === 'shan') || (st(pid).gen === 'guanyu' && isRed(c));
  const canAsShan = (pid, c) => c.n === 'shan' || (st(pid).gen === 'zhaoyun' && c.n === 'sha');
  const canAsTao = (pid, c) => c.n === 'tao' || (st(pid).gen === 'huatuo' && isRed(c));

  // ---------- 视图 ----------
  function playPrompt(pid) {
    const s = st(pid);
    const shaLimit = (s.gen === 'zhangfei' || (s.eq.weapon && s.eq.weapon.n === 'liannu')) ? 99 : 1;
    const reachable = aliveList().filter(x => x !== pid && inShaRange(pid, x));
    const usable = [];
    s.hand.forEach((c, i) => {
      if (canAsSha(pid, c) && G.turnSha < shaLimit && reachable.length && c.n !== 'wuxie' && c.n !== 'lebu' && CARD_INFO[c.n].type !== 'equip') {
        usable.push({ i, as: c.n === 'sha' ? null : 'sha', targets: reachable });
      }
      if (c.n === 'tao' && s.hp < s.maxHp) usable.push({ i, targets: null });
      if (c.n === 'wuzhong' || c.n === 'nanman' || c.n === 'wanjian') usable.push({ i, targets: null });
      if (c.n === 'taoyuan' && aliveList().some(x => st(x).hp < st(x).maxHp)) usable.push({ i, targets: null });
      if (c.n === 'guochai') {
        const ts = aliveList().filter(x => x !== pid && (st(x).hand.length || Object.keys(st(x).eq).length));
        if (ts.length) usable.push({ i, targets: ts });
      }
      if (c.n === 'shunshou') {
        const ts = aliveList().filter(x => x !== pid && dist(pid, x) <= 1 && (st(x).hand.length || Object.keys(st(x).eq).length));
        if (ts.length) usable.push({ i, targets: ts });
      }
      if (c.n === 'juedou') {
        const ts = aliveList().filter(x => x !== pid);
        if (ts.length) usable.push({ i, targets: ts });
      }
      if (c.n === 'lebu') {
        const ts = aliveList().filter(x => x !== pid && !st(x).judge);
        if (ts.length) usable.push({ i, targets: ts });
      }
      if (CARD_INFO[c.n].type === 'equip') usable.push({ i, targets: null });
    });
    const skills = [];
    if (s.gen === 'liubei' && !G.usedSkill.rende && s.hand.length) skills.push('rende');
    if (s.gen === 'sunquan' && !G.usedSkill.zhiheng && s.hand.length) skills.push('zhiheng');
    if (s.gen === 'huanggai' && s.hp >= 2) skills.push('kurou');
    if (s.gen === 'diaochan' && !G.usedSkill.lijian && s.hand.length && aliveList().filter(x => x !== pid).length >= 2) skills.push('lijian');
    return { type: 'play', usable, skills, canEnd: true };
  }

  function viewFor(pid) {
    const s = st(pid);
    // —— 选将阶段 ——
    if (G.phase === 'chooseGen') {
      const v = {
        game: 'sgs', phase: 'chooseGen',
        players: P.map((p, i) => ({
          pid: p.id, no: i + 1, name: p.name,
          done: !!(p.ai || G.chosen[p.id]),
          identity: p.id === pid || st(p.id).id === 'zhu' ? st(p.id).id : null,
        })),
        myId: s.id, prompt: null, log: G.log.slice(-3), sfx: G.sfx, seq: G.seq, result: null,
      };
      if (!G.chosen[pid] && G.genChoices[pid]) {
        v.prompt = {
          type: 'chooseGen',
          options: G.genChoices[pid].map(k => ({ key: k, ...GENERALS[k] })),
        };
      }
      return v;
    }
    const iAmDead = !s.alive;
    const showId = (x) => x === pid || st(x).id === 'zhu' || !st(x).alive || G.over || iAmDead ? st(x).id : null;
    const v = {
      game: 'sgs',
      players: P.map((p, i) => {
        const ps = st(p.id);
        return {
          pid: p.id, no: i + 1, name: p.name,
          gen: ps.gen, genName: GENERALS[ps.gen].name, genIcon: GENERALS[ps.gen].icon,
          skill: GENERALS[ps.gen].skill, hp: ps.hp, maxHp: ps.maxHp,
          handCount: ps.hand.length,
          eq: Object.fromEntries(Object.entries(ps.eq).map(([k, c]) => [k, CARD_INFO[c.n].name])),
          judge: ps.judge ? CARD_INFO[ps.judge.n].name : null,
          identity: showId(p.id), alive: ps.alive, isTurn: !G.over && cur() === p.id,
        };
      }),
      myHand: s.hand, myGen: s.gen, myId: s.id,
      turnPid: G.over ? null : cur(),
      lastPlayed: G.lastPlayed, waitInfo: G.waitInfo,
      dmgAnim: G.lastDmgAnim,
      log: G.log.slice(-5),
      prompt: null, aiHints: null,
      sfx: G.sfx, seq: G.seq,
      result: G.over ? { ...G.over.base, win: G.over.winners.includes(pid) } : null,
    };
    if (!G.over && s.alive) {
      if (G.pend && G.pend.pid === pid) {
        const pd = G.pend;
        const filter = pd.kind === 'shan' ? canAsShan : pd.kind === 'sha' ? canAsSha : pd.kind === 'tao' ? canAsTao
          : pd.kind === 'wuxie' ? ((_, c) => c.n === 'wuxie') : null;
        v.prompt = {
          type: 'resp', kind: pd.kind, count: pd.count || 1, info: pd.info,
          usableIdx: filter ? s.hand.map((c, i) => filter(pid, c) ? i : -1).filter(i => i >= 0) : s.hand.map((_, i) => i),
        };
        v.aiHints = { action: aiRespond(pid, pd, v.prompt.usableIdx) };
      } else if (!G.pend && !G.busy && G.phase === 'play' && cur() === pid) {
        v.prompt = playPrompt(pid);
        v.aiHints = { action: aiPlay(pid, v.prompt) };
      }
    }
    return v;
  }
  function push(sfx = null) {
    G.sfx = sfx; G.seq++;
    for (const p of P) emit(p.id, viewFor(p.id));
    G.sfx = null; G.lastDmgAnim = null;
  }

  function ask(pid, kind, info, data, resolve) {
    G.pend = { pid, kind, info, ...data, resolve };
    G.waitInfo = `等待 ${nameOf(pid)} 响应…`;
    push();
  }

  // ---------- 选将 ----------
  function finishSetup() {
    const taken = new Set(Object.values(G.chosen));
    const pool = shuffle(Object.keys(GENERALS).filter(k => !taken.has(k)));
    for (const p of P) {
      const s = st(p.id);
      s.gen = G.chosen[p.id] || pool.pop() || pick(Object.keys(GENERALS));
      s.maxHp = GENERALS[s.gen].hp + (s.id === 'zhu' ? 1 : 0);
      s.hp = s.maxHp;
    }
    G.phase = 'ready'; // 过渡阶段：开场展示期间禁止任何出牌
    G.turn = P.findIndex(p => st(p.id).id === 'zhu');
    for (const p of P) draw(p.id, 4);
    const zhu = cur();
    log(`🏯 群雄集结！${N} 人身份场，${nameOf(zhu)} 是主公`);
    push('deal');
    later(startTurn, 1500);
  }

  // ---------- 胜负 ----------
  function checkWin() {
    const alive = aliveList();
    const zhu = P.map(p => p.id).find(x => st(x).id === 'zhu');
    let winners = null, title = '';
    if (!st(zhu).alive) {
      const onlyNei = alive.length >= 1 && alive.every(x => st(x).id === 'nei');
      if (onlyNei) { winners = alive; title = '🎭 内奸胜利'; }
      else { winners = P.map(p => p.id).filter(x => st(x).id === 'fan'); title = '⚔️ 反贼胜利'; }
    } else if (P.map(p => p.id).filter(x => (st(x).id === 'fan' || st(x).id === 'nei') && st(x).alive).length === 0) {
      winners = P.map(p => p.id).filter(x => st(x).id === 'zhu' || st(x).id === 'zhong');
      title = '👑 主公与忠臣胜利';
    }
    if (winners) {
      G.over = {
        winners,
        base: {
          title,
          lines: P.map(p => {
            const ps = st(p.id);
            return `${ID_INFO[ps.id].icon}${ID_INFO[ps.id].name} ${GENERALS[ps.gen].name}·${p.name}${ps.alive ? '' : '（阵亡）'}`;
          }),
        },
      };
      log(`🏁 ${title}！`);
      push('win');
      return true;
    }
    return false;
  }

  function death(pid, killer, cont) {
    const s = st(pid);
    s.alive = false;
    toDiscard(s.hand.splice(0));
    toDiscard(Object.values(s.eq)); s.eq = {};
    if (s.judge) { toDiscard([s.judge]); s.judge = null; }
    log(`☠️ ${nameOf(pid)} 阵亡！身份是【${ID_INFO[s.id].icon}${ID_INFO[s.id].name}】`);
    push('lose');
    if (checkWin()) return;
    if (killer && st(killer).alive) {
      if (s.id === 'fan') { draw(killer, 3); log(`🎁 ${nameOf(killer)} 击杀反贼，摸三张牌`); }
      if (s.id === 'zhong' && st(killer).id === 'zhu') { toDiscard(st(killer).hand.splice(0)); log(`⚠️ 主公误杀忠臣，弃置所有手牌`); }
    }
    later(cont, 900);
  }

  function dying(pid, killer, cont) {
    const order = [pid, ...aliveList().filter(x => x !== pid)];
    log(`🆘 ${nameOf(pid)} 进入濒死状态，求【桃】！`);
    const next = (i) => {
      if (G.over || G.destroyed) return;
      const s = st(pid);
      if (s.hp >= 1) { log(`💗 ${nameOf(pid)} 被救回`); push('heal'); later(cont, 500); return; }
      if (i >= order.length) { death(pid, killer, cont); return; }
      const helper = order[i];
      if (!st(helper).alive || !st(helper).hand.some(c => canAsTao(helper, c))) { next(i + 1); return; }
      ask(helper, 'tao', `${nameOf(pid)} 濒死（${s.hp} 血），是否使用【桃】救助？`, { dying: pid }, (ans) => {
        if (ans && ans.cards && ans.cards.length) {
          const c = st(helper).hand[ans.cards[0]];
          if (c && canAsTao(helper, c)) {
            st(helper).hand.splice(ans.cards[0], 1);
            toDiscard([c]);
            s.hp++;
            log(`🍑 ${nameOf(helper)} 对 ${nameOf(pid)} 使用【桃】`);
            push('heal');
            next(i);
            return;
          }
        }
        next(i + 1);
      });
    };
    next(0);
  }

  function grabRandomCard(taker, from) {
    const t = st(from);
    const pool = [];
    t.hand.forEach((c, i) => pool.push({ kind: 'hand', i }));
    for (const slot of Object.keys(t.eq)) pool.push({ kind: 'eq', slot });
    if (!pool.length) return false;
    const got = pick(pool);
    let card;
    if (got.kind === 'hand') card = t.hand.splice(got.i, 1)[0];
    else { card = t.eq[got.slot]; delete t.eq[got.slot]; }
    st(taker).hand.push(card);
    return true;
  }

  function damage(src, dst, n, cards, cont) {
    const s = st(dst);
    s.hp -= n;
    G.lastDmgAnim = { pid: dst, n };
    log(`💢 ${nameOf(dst)} 受到 ${n} 点伤害（${s.hp}/${s.maxHp}）`);
    // 奸雄
    if (s.gen === 'caocao' && cards && cards.length) {
      s.hand.push(...cards.splice(0));
      log(`🧠 曹操【奸雄】获得造成伤害的牌`);
    } else if (cards) toDiscard(cards.splice(0));
    // 反馈
    if (s.gen === 'simayi' && src && src !== dst && st(src).alive) {
      if (grabRandomCard(dst, src)) log(`🦉 司马懿【反馈】获得 ${nameOf(src)} 的一张牌`);
    }
    // 遗计
    if (s.gen === 'guojia') { draw(dst, 2 * n); log(`🍶 郭嘉【遗计】摸 ${2 * n} 张牌`); }
    push('hurt');
    if (s.hp <= 0) dying(dst, src, cont);
    else later(cont, 400);
  }

  function askShan(pid, count, from, viaWhat, cb) {
    const s = st(pid);
    let need = count;
    if (s.eq.armor && s.eq.armor.n === 'bagua') {
      const jc = drawCard();
      if (jc) {
        toDiscard([jc]);
        const ok = isRed(jc);
        log(`☯️ ${nameOf(pid)} 八卦阵判定：${suitText(jc.s)}${jc.r} → ${ok ? '红色，视为打出一张【闪】' : '黑色，判定失败'}`);
        if (ok) need--;
      }
    }
    if (need <= 0) { cb(true); return; }
    if (!s.hand.some(c => canAsShan(pid, c))) { cb(false); return; }
    ask(pid, 'shan', `${nameOf(from)} 对你使用${viaWhat}，需打出 ${need} 张【闪】`, { count: need, from }, (ans) => {
      if (ans && ans.cards && ans.cards.length >= need) {
        const idxs = [...new Set(ans.cards)].slice(0, need).sort((a, b) => b - a);
        const cs = idxs.map(i => s.hand[i]);
        if (cs.length === need && cs.every(c => c && canAsShan(pid, c))) {
          idxs.forEach(i => s.hand.splice(i, 1));
          toDiscard(cs);
          log(`🌀 ${nameOf(pid)} 打出【闪】`);
          push('card');
          cb(true);
          return;
        }
      }
      cb(false);
    });
  }

  function askSha(pid, info, cb) {
    const s = st(pid);
    if (!s.alive || !s.hand.some(c => canAsSha(pid, c))) { cb(false); return; }
    ask(pid, 'sha', info, {}, (ans) => {
      if (ans && ans.cards && ans.cards.length) {
        const c = s.hand[ans.cards[0]];
        if (c && canAsSha(pid, c)) {
          s.hand.splice(ans.cards[0], 1);
          toDiscard([c]);
          log(`⚔️ ${nameOf(pid)} 打出【杀】`);
          push('sword');
          cb(true);
          return;
        }
      }
      cb(false);
    });
  }

  function askWuxie(pid, what, cb) {
    const s = st(pid);
    if (!s.alive || !s.hand.some(c => c.n === 'wuxie')) { cb(false); return; }
    ask(pid, 'wuxie', `${what}指定你为目标，是否使用【无懈可击】抵消？`, {}, (ans) => {
      if (ans && ans.cards && ans.cards.length) {
        const c = s.hand[ans.cards[0]];
        if (c && c.n === 'wuxie') {
          s.hand.splice(ans.cards[0], 1);
          toDiscard([c]);
          log(`🛡️ ${nameOf(pid)} 使用【无懈可击】抵消了${what}`);
          push('card');
          cb(true);
          return;
        }
      }
      cb(false);
    });
  }

  function aoeChain(srcPid, targets, needKind, cardName, cont) {
    const next = (i) => {
      if (G.over || G.destroyed) return;
      if (i >= targets.length) { cont(); return; }
      const t = targets[i];
      if (!st(t).alive) { next(i + 1); return; }
      const after = (ok) => {
        if (ok) next(i + 1);
        else damage(srcPid, t, 1, null, () => next(i + 1));
      };
      if (needKind === 'sha') askSha(t, `${nameOf(srcPid)} 使用【${cardName}】，需打出一张【杀】`, after);
      else askShan(t, 1, srcPid, `【${cardName}】`, after);
    };
    next(0);
  }

  function duel(a, b, cont) {
    const round = (defender, attacker) => {
      if (G.over || G.destroyed) return;
      askSha(defender, `与 ${nameOf(attacker)} 决斗中，需打出一张【杀】`, (ok) => {
        if (ok) round(attacker, defender);
        else damage(attacker, defender, 1, null, cont);
      });
    };
    round(b, a);
  }

  function stealOrBreak(pid, target, steal, cont) {
    const t = st(target);
    const pool = [];
    t.hand.forEach((c, i) => pool.push({ kind: 'hand', i }));
    for (const slot of Object.keys(t.eq)) pool.push({ kind: 'eq', slot });
    if (!pool.length) { cont(); return; }
    const got = pick(pool);
    let card;
    if (got.kind === 'hand') card = t.hand.splice(got.i, 1)[0];
    else { card = t.eq[got.slot]; delete t.eq[got.slot]; }
    if (steal) {
      st(pid).hand.push(card);
      log(`🤏 ${nameOf(pid)} 顺走了 ${nameOf(target)} 的一张${got.kind === 'eq' ? '装备' : '手'}牌`);
    } else {
      toDiscard([card]);
      log(`🔨 ${nameOf(pid)} 拆掉了 ${nameOf(target)} 的【${got.kind === 'eq' ? CARD_INFO[card.n].name : '一张手牌'}】`);
    }
    cont();
  }

  // ---------- 回合 ----------
  function startTurn() {
    if (G.over || G.destroyed) return;
    if (!st(cur()).alive) { nextTurn(); return; }
    G.turnSha = 0; G.usedSkill = {}; G.phase = 'play'; G.pend = null; G.waitInfo = ''; G.busy = false;
    const s = st(cur());
    let skipPlay = false;
    // 判定阶段：乐不思蜀
    if (s.judge) {
      const jc = drawCard();
      const safe = jc && jc.s === 1;
      log(`⚖️ ${nameOf(cur())} 判定【乐不思蜀】：${jc ? suitText(jc.s) + jc.r : '?'} → ${safe ? '❤️ 红桃，判定通过！' : '判定失败，跳过出牌阶段'}`);
      toDiscard([s.judge, jc]); s.judge = null;
      if (!safe) skipPlay = true;
    }
    draw(cur(), 2);
    log(`— ${nameOf(cur())} 的回合，摸两张牌 —`);
    if (skipPlay) {
      G.phase = 'discard';
      push('draw');
      later(() => endPhase(cur()), 1000);
    } else push('draw');
  }
  function nextTurn() {
    if (G.over || G.destroyed) return;
    do { G.turn = (G.turn + 1) % N; } while (!st(cur()).alive);
    later(startTurn, 700);
  }
  function backToPlay() {
    if (G.over || G.destroyed) return;
    G.pend = null; G.waitInfo = ''; G.busy = false;
    if (!st(cur()).alive) { nextTurn(); return; }
    G.phase = 'play';
    push();
  }
  function endPhase(pid) {
    const s = st(pid);
    const need = s.hand.length - Math.max(0, s.hp);
    if (need > 0) {
      G.phase = 'discard';
      ask(pid, 'discard', `手牌超出体力上限，请弃置 ${need} 张牌`, { count: need }, (ans) => {
        const idxs = [...new Set(ans && ans.cards || [])].filter(i => i >= 0 && i < s.hand.length);
        const use = idxs.slice(0, need);
        while (use.length < need) {
          for (let i = s.hand.length - 1; i >= 0; i--) if (!use.includes(i)) { use.push(i); break; }
        }
        use.sort((a, b) => b - a).forEach(i => toDiscard([s.hand.splice(i, 1)[0]]));
        log(`${nameOf(pid)} 弃置 ${need} 张牌`);
        G.pend = null; G.waitInfo = '';
        push('card');
        nextTurn();
      });
    } else nextTurn();
  }

  // ---------- AI ----------
  function enemiesOf(pid) {
    const my = st(pid).id;
    const alive = aliveList().filter(x => x !== pid);
    const fans = alive.filter(x => st(x).id === 'fan');
    if (my === 'fan') return alive.filter(x => st(x).id === 'zhu' || st(x).id === 'zhong').length
      ? alive.filter(x => st(x).id === 'zhu' || st(x).id === 'zhong') : alive;
    if (my === 'nei') return fans.length ? fans : alive.filter(x => st(x).id === 'zhu' || st(x).id === 'zhong');
    return fans.length ? fans : alive.filter(x => st(x).id === 'nei');
  }
  const isAlly = (a, b) => !enemiesOf(a).includes(b) && a !== b;

  function cardValue(pid, c) {
    if (c.n === 'tao') return 5;
    if (c.n === 'shan') return 4;
    if (c.n === 'wuxie') return 4;
    if (CARD_INFO[c.n].type === 'equip') return 2;
    return 3;
  }

  function aiPlay(pid, prompt) {
    const s = st(pid);
    const enemies = enemiesOf(pid);
    const u = prompt.usable;
    const find = (cond) => u.find(x => cond(s.hand[x.i], x));
    if (s.hp <= Math.min(2, s.maxHp - 1)) {
      const t = find(c => c.n === 'tao');
      if (t) return { t: 'use', i: t.i };
    }
    const eqU = find(c => CARD_INFO[c.n].type === 'equip' && !s.eq[CARD_INFO[c.n].slot]);
    if (eqU) return { t: 'use', i: eqU.i };
    const wz = find(c => c.n === 'wuzhong');
    if (wz) return { t: 'use', i: wz.i };
    // 苦肉：血量健康时换牌
    if (prompt.skills.includes('kurou') && s.hp >= 3) return { t: 'skill', name: 'kurou' };
    // 乐不思蜀 铐住强敌
    const lb = u.find(x => s.hand[x.i].n === 'lebu' && x.targets && x.targets.some(t => enemies.includes(t)));
    if (lb) {
      const ts = lb.targets.filter(t => enemies.includes(t)).sort((a, b) => st(b).hand.length - st(a).hand.length);
      return { t: 'use', i: lb.i, targets: [ts[0]] };
    }
    const ty = find(c => c.n === 'taoyuan');
    if (ty && s.hp < s.maxHp) return { t: 'use', i: ty.i };
    const shaU = u.filter(x => (x.as === 'sha' || s.hand[x.i].n === 'sha') && x.targets && x.targets.some(t => enemies.includes(t)));
    if (shaU.length) {
      const x = shaU.find(x => s.hand[x.i].n === 'sha') || shaU[0];
      const ts = x.targets.filter(t => enemies.includes(t)).sort((a, b) => st(a).hp - st(b).hp);
      return { t: 'use', i: x.i, as: x.as, targets: [ts[0]] };
    }
    // 离间：挑两个敌人互斗
    if (prompt.skills.includes('lijian') && enemies.length >= 2) {
      const junk = s.hand.map((c, i) => ({ c, i })).sort((a, b) => cardValue(pid, a.c) - cardValue(pid, b.c))[0];
      const es = [...enemies].sort((a, b) => st(b).hp - st(a).hp);
      return { t: 'skill', name: 'lijian', i: [junk.i], a: es[0], b: es[1] };
    }
    const jd = find(c => c.n === 'juedou');
    if (jd) {
      const cand = (u.find(x => s.hand[x.i].n === 'juedou') || {}).targets || [];
      const t = cand.filter(t => enemies.includes(t) && st(t).hp <= 2 && st(t).hand.length <= 2)[0];
      const myShaCnt = s.hand.filter(c => canAsSha(pid, c)).length;
      if (t && myShaCnt >= 1) return { t: 'use', i: u.find(x => s.hand[x.i].n === 'juedou').i, targets: [t] };
    }
    for (const nm of ['shunshou', 'guochai']) {
      const x = u.find(x => s.hand[x.i].n === nm && x.targets && x.targets.some(t => enemies.includes(t)));
      if (x) return { t: 'use', i: x.i, targets: [x.targets.filter(t => enemies.includes(t))[0]] };
    }
    for (const nm of ['nanman', 'wanjian']) {
      const x = u.find(x => s.hand[x.i].n === nm);
      if (x) {
        const others = aliveList().filter(t => t !== pid);
        const foes = others.filter(t => enemies.includes(t)).length;
        if (foes > others.length - foes) return { t: 'use', i: x.i };
      }
    }
    if (prompt.skills.includes('rende') && s.hand.length > s.hp) {
      const allies = aliveList().filter(x => isAlly(pid, x));
      if (allies.length) {
        const idxs = s.hand.map((c, i) => ({ c, i })).sort((a, b) => cardValue(pid, a.c) - cardValue(pid, b.c)).slice(0, 2).map(x => x.i);
        return { t: 'skill', name: 'rende', i: idxs, target: allies[0] };
      }
    }
    if (prompt.skills.includes('zhiheng')) {
      const shanCnt = s.hand.filter(y => y.n === 'shan').length;
      if (shanCnt > 2) {
        const junk = s.hand.map((c, i) => ({ c, i })).filter(x => x.c.n === 'shan').slice(0, shanCnt - 2);
        if (junk.length) return { t: 'skill', name: 'zhiheng', i: junk.map(x => x.i) };
      }
    }
    return { t: 'end' };
  }

  function aiRespond(pid, pd, usableIdx) {
    const s = st(pid);
    if (pd.kind === 'discard') {
      const idxs = s.hand.map((c, i) => ({ c, i })).sort((a, b) => cardValue(pid, a.c) - cardValue(pid, b.c)).slice(0, pd.count).map(x => x.i);
      return { t: 'resp', cards: idxs };
    }
    if (pd.kind === 'tao') {
      const dyingPid = pd.dying;
      if (dyingPid === pid || isAlly(pid, dyingPid) || (st(pid).id === 'nei' && st(dyingPid).id === 'zhu' && aliveList().some(x => st(x).id === 'fan'))) {
        const real = usableIdx.find(i => s.hand[i].n === 'tao');
        return { t: 'resp', cards: [real !== undefined ? real : usableIdx[0]] };
      }
      return { t: 'resp', cards: [] };
    }
    if (pd.kind === 'shan') {
      if (usableIdx.length >= pd.count) {
        const real = usableIdx.filter(i => s.hand[i].n === 'shan');
        const chosen = [...real, ...usableIdx.filter(i => !real.includes(i))].slice(0, pd.count);
        return { t: 'resp', cards: chosen };
      }
      return { t: 'resp', cards: [] };
    }
    if (pd.kind === 'sha') {
      if (usableIdx.length) {
        const real = usableIdx.find(i => s.hand[i].n === 'sha');
        return { t: 'resp', cards: [real !== undefined ? real : usableIdx[0]] };
      }
      return { t: 'resp', cards: [] };
    }
    if (pd.kind === 'wuxie') {
      return { t: 'resp', cards: usableIdx.length ? [usableIdx[0]] : [] };
    }
    return { t: 'resp', cards: [] };
  }

  // ---------- 出牌 ----------
  function useCard(pid, i, targets, as) {
    const s = st(pid);
    const c = s.hand[i];
    if (!c) return;
    const info = CARD_INFO[c.n];
    const cont = () => backToPlay();
    // busy：结算链未完成前，封锁出牌阶段的新动作（防止 AI/玩家抢跑导致状态错乱）
    const spend = () => { s.hand.splice(i, 1); G.lastPlayed = { pid, card: c, as }; G.busy = true; };

    if (as === 'sha' || c.n === 'sha') {
      if (!canAsSha(pid, c)) return;
      const shaLimit = (s.gen === 'zhangfei' || (s.eq.weapon && s.eq.weapon.n === 'liannu')) ? 99 : 1;
      if (G.turnSha >= shaLimit) return;
      const t = targets && targets[0];
      if (!t || !st(t).alive || t === pid || !inShaRange(pid, t)) return;
      spend();
      G.turnSha++;
      log(`⚔️ ${nameOf(pid)} 对 ${nameOf(t)} 使用【杀】${as ? '（' + info.name + '转化）' : ''}`);
      push('sword');
      const dmgCards = [c];
      askShan(t, s.gen === 'lvbu' ? 2 : 1, pid, '【杀】', (ok) => {
        if (ok) { toDiscard(dmgCards); cont(); }
        else damage(pid, t, 1, dmgCards, cont);
      });
      return;
    }
    switch (c.n) {
      case 'tao':
        if (s.hp >= s.maxHp) return;
        spend(); toDiscard([c]);
        s.hp++;
        log(`🍑 ${nameOf(pid)} 使用【桃】回复 1 点体力（${s.hp}/${s.maxHp}）`);
        push('heal'); cont();
        return;
      case 'wuzhong':
        spend(); toDiscard([c]);
        draw(pid, 2);
        log(`✨ ${nameOf(pid)} 使用【无中生有】摸两张牌`);
        push('draw'); cont();
        return;
      case 'taoyuan': {
        spend(); toDiscard([c]);
        log(`🌸 ${nameOf(pid)} 使用【桃园结义】，所有人回复 1 点体力`);
        for (const x of aliveList()) { const xs = st(x); if (xs.hp < xs.maxHp) xs.hp++; }
        push('heal'); cont();
        return;
      }
      case 'guochai': case 'shunshou': {
        const t = targets && targets[0];
        if (!t || !st(t).alive || t === pid) return;
        if (c.n === 'shunshou' && dist(pid, t) > 1) return;
        spend(); toDiscard([c]);
        log(`📜 ${nameOf(pid)} 对 ${nameOf(t)} 使用【${info.name}】`);
        push('card');
        askWuxie(t, `【${info.name}】`, (blocked) => {
          if (blocked) { cont(); return; }
          stealOrBreak(pid, t, c.n === 'shunshou', cont);
        });
        return;
      }
      case 'juedou': {
        const t = targets && targets[0];
        if (!t || !st(t).alive || t === pid) return;
        spend(); toDiscard([c]);
        log(`🤺 ${nameOf(pid)} 与 ${nameOf(t)} 【决斗】！`);
        push('sword');
        askWuxie(t, '【决斗】', (blocked) => {
          if (blocked) { cont(); return; }
          duel(pid, t, cont);
        });
        return;
      }
      case 'lebu': {
        const t = targets && targets[0];
        if (!t || !st(t).alive || t === pid || st(t).judge) return;
        spend();
        log(`💤 ${nameOf(pid)} 对 ${nameOf(t)} 使用【乐不思蜀】`);
        push('card');
        askWuxie(t, '【乐不思蜀】', (blocked) => {
          if (blocked) { toDiscard([c]); cont(); return; }
          st(t).judge = c;
          cont();
        });
        return;
      }
      case 'nanman': case 'wanjian': {
        spend(); toDiscard([c]);
        log(`🌋 ${nameOf(pid)} 使用【${info.name}】！`);
        push('bomb');
        const others = aliveList().filter(x => x !== pid);
        aoeChain(pid, others, c.n === 'nanman' ? 'sha' : 'shan', info.name, cont);
        return;
      }
      default:
        if (info.type === 'equip') {
          spend();
          if (s.eq[info.slot]) toDiscard([s.eq[info.slot]]);
          s.eq[info.slot] = c;
          log(`🛡️ ${nameOf(pid)} 装备【${info.name}】`);
          push('card'); cont();
        }
    }
  }

  return {
    _debug() { return { phase: G.phase, busy: G.busy, turn: cur(), pend: G.pend ? { pid: G.pend.pid, kind: G.pend.kind } : null, turnSha: G.turnSha, hands: Object.fromEntries(P.map(p => [p.id, st(p.id).hand.map(c => c.n)])) }; },
    start() {
      log(`🏯 三国杀 ${N} 人局，请各位选择武将…`);
      // 全是 AI（或无真人候选）直接开局
      if (Object.keys(G.genChoices).length === 0) { finishSetup(); return; }
      push();
    },
    destroy() { G.destroyed = true; },
    onAction(pid, a) {
      if (G.over || !a) return;
      // 选将
      if (G.phase === 'chooseGen') {
        if (a.t === 'chooseGen' && G.genChoices[pid] && !G.chosen[pid] && G.genChoices[pid].includes(a.g)) {
          G.chosen[pid] = a.g;
          log(`✅ ${P.find(p => p.id === pid).name} 已选定武将`);
          const humans = Object.keys(G.genChoices);
          if (humans.every(h => G.chosen[h])) finishSetup();
          else push('click');
        }
        return;
      }
      if (G.pend && G.pend.pid === pid && a.t === 'resp') {
        const pd = G.pend;
        G.pend = null; G.waitInfo = '';
        pd.resolve(a);
        return;
      }
      if (!G.pend && !G.busy && G.phase === 'play' && cur() === pid) {
        const s = st(pid);
        if (a.t === 'end') { G.phase = 'discard'; endPhase(pid); return; }
        if (a.t === 'use') { useCard(pid, a.i, a.targets, a.as); return; }
        if (a.t === 'skill') {
          if (a.name === 'rende' && s.gen === 'liubei' && !G.usedSkill.rende) {
            const idxs = [...new Set(a.i || [])].filter(i => i >= 0 && i < s.hand.length);
            const target = a.target;
            if (!idxs.length || !target || target === pid || !st(target).alive) return;
            G.usedSkill.rende = true;
            const cards = idxs.sort((x, y) => y - x).map(i => s.hand.splice(i, 1)[0]);
            st(target).hand.push(...cards);
            log(`🤝 刘备【仁德】送给 ${nameOf(target)} ${cards.length} 张牌`);
            if (cards.length >= 2 && s.hp < s.maxHp) { s.hp++; log(`💗 刘备回复 1 点体力`); }
            push('heal');
            return;
          }
          if (a.name === 'zhiheng' && s.gen === 'sunquan' && !G.usedSkill.zhiheng) {
            const idxs = [...new Set(a.i || [])].filter(i => i >= 0 && i < s.hand.length);
            if (!idxs.length) return;
            G.usedSkill.zhiheng = true;
            const n = idxs.length;
            idxs.sort((x, y) => y - x).forEach(i => toDiscard([s.hand.splice(i, 1)[0]]));
            draw(pid, n);
            log(`⚖️ 孙权【制衡】弃 ${n} 张，摸 ${n} 张`);
            push('draw');
            return;
          }
          if (a.name === 'kurou' && s.gen === 'huanggai' && s.hp >= 2) {
            s.hp -= 1;
            draw(pid, 2);
            G.lastDmgAnim = { pid, n: 1 };
            log(`🔥 黄盖【苦肉】失去 1 点体力，摸两张牌（${s.hp}/${s.maxHp}）`);
            push('hurt');
            return;
          }
          if (a.name === 'lijian' && s.gen === 'diaochan' && !G.usedSkill.lijian) {
            const idxs = [...new Set(a.i || [])].filter(i => i >= 0 && i < s.hand.length);
            const A = a.a, B = a.b;
            if (idxs.length !== 1 || !A || !B || A === B || A === pid || B === pid) return;
            if (!st(A).alive || !st(B).alive) return;
            G.usedSkill.lijian = true;
            G.busy = true;
            toDiscard([s.hand.splice(idxs[0], 1)[0]]);
            log(`🌙 貂蝉【离间】！${nameOf(A)} 被迫与 ${nameOf(B)} 决斗`);
            push('sword');
            duel(A, B, () => backToPlay());
            return;
          }
        }
      }
    },
  };
}

// ---------- AI ----------
function ai(view, act) {
  if (!view || view.game !== 'sgs' || view.result) return;
  if (view.prompt && view.prompt.type === 'chooseGen') {
    act({ t: 'chooseGen', g: pick(view.prompt.options).key });
    return;
  }
  if (view.aiHints && view.aiHints.action) act(view.aiHints.action);
}

// ---------- 渲染 ----------
function sgsCardEl(c) {
  const info = CARD_INFO[c.n];
  const d = el('div', 'sgs-card ' + info.type);
  const corner = el('div', 'sc-corner' + (isRed(c) ? ' red' : ''));
  const rt = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  corner.innerHTML = suitText(c.s) + '<br>' + (rt[c.r] || c.r);
  d.appendChild(corner);
  d.appendChild(el('div', 'sc-name', info.name));
  d.appendChild(el('div', 'sc-type', { basic: '基本', trick: '锦囊', equip: '装备' }[info.type]));
  return d;
}
const hpBar = (hp, maxHp) => '❤️'.repeat(Math.max(0, hp)) + '🖤'.repeat(Math.max(0, maxHp - Math.max(0, hp)));

function render(root, view, send, ctx) {
  ensureCss();
  clear(root);
  const stage = el('div', 'sgs-stage');
  root.appendChild(stage);

  // —— 选将界面 ——
  if (view.phase === 'chooseGen') {
    const box = el('div', 'sgs-choose');
    box.appendChild(el('h3', '', '⚔️ 选择你的武将'));
    box.appendChild(el('div', 'sub', `我的身份：${ID_INFO[view.myId].icon}${ID_INFO[view.myId].name}`));
    if (view.prompt) {
      const cards = el('div', 'sgs-gencards');
      for (const g of view.prompt.options) {
        const gc = el('div', 'sgs-gencard');
        gc.appendChild(el('div', 'gi', g.icon));
        gc.appendChild(el('div', 'gn', g.name));
        gc.appendChild(el('div', 'gh', '❤️'.repeat(g.hp)));
        const gs = el('div', 'gs');
        gs.innerHTML = `<b>${g.skill}</b><br>${g.desc}`;
        gc.appendChild(gs);
        gc.onclick = () => { ctx.audio.play('select'); send({ t: 'chooseGen', g: g.key }); };
        cards.appendChild(gc);
      }
      box.appendChild(cards);
    } else {
      box.appendChild(el('div', 'sub', '✅ 已选定，等待其他玩家…'));
    }
    const waitTxt = view.players.filter(p => !p.done).map(p => p.name).join('、');
    if (waitTxt) box.appendChild(el('div', 'sub', '正在选将：' + waitTxt));
    stage.appendChild(box);
    return;
  }

  const logBox = el('div', 'game-log');
  view.log.forEach(l => logBox.appendChild(el('div', '', l)));
  stage.appendChild(logBox);

  let selCard = null;
  let skillMode = null;
  let lijianA = null;
  const selSet = new Set();
  let pickTargets = new Set();

  const pr = view.prompt;
  const seatEls = {};

  const seats = el('div', 'sgs-seats');
  for (const p of view.players) {
    const seat = el('div', 'sgs-seat' + (p.isTurn ? ' turn' : '') + (!p.alive ? ' dead' : ''));
    if (p.identity) seat.appendChild(el('div', 'sg-id', ID_INFO[p.identity].icon));
    if (p.judge) seat.appendChild(el('div', 'sg-judge', '💤'));
    seat.appendChild(el('div', 'sg-name', `${p.no}号 ${p.name}${p.pid === ctx.myId ? '(我)' : ''}`));
    seat.appendChild(el('div', 'sg-gen', `${p.genIcon}${p.genName}·${p.skill}`));
    seat.appendChild(el('div', 'sg-hp', hpBar(p.hp, p.maxHp)));
    const eqTxt = Object.values(p.eq).join(' ');
    seat.appendChild(el('div', 'sg-eq', eqTxt || '　'));
    seat.appendChild(el('div', 'sg-cnt', '🎴' + p.handCount));
    if (!p.alive) seat.appendChild(el('div', 'sg-dead-mark', '☠️'));
    seat.onclick = () => {
      if (!pickTargets.has(p.pid)) return;
      ctx.audio.play('select');
      if (skillMode === 'rende') {
        send({ t: 'skill', name: 'rende', i: [...selSet], target: p.pid });
        pickTargets = new Set();
      } else if (skillMode === 'lijian') {
        if (!lijianA) {
          lijianA = p.pid;
          seat.classList.add('picked-a');
          toast('已选定甲方，再点选决斗的另一方');
        } else if (lijianA !== p.pid) {
          send({ t: 'skill', name: 'lijian', i: [...selSet], a: lijianA, b: p.pid });
          pickTargets = new Set();
        }
      } else if (selCard) {
        send({ t: 'use', i: selCard.i, as: selCard.as, targets: [p.pid] });
        pickTargets = new Set();
      }
    };
    seatEls[p.pid] = seat;
    seats.appendChild(seat);
  }
  stage.appendChild(seats);

  // 受击特效
  if (view.dmgAnim && seatEls[view.dmgAnim.pid]) {
    const seat = seatEls[view.dmgAnim.pid];
    seat.classList.add('hit');
    const f = el('div', 'sg-float', '-' + view.dmgAnim.n);
    seat.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }

  const mid = el('div', 'sgs-mid');
  if (view.lastPlayed && view.lastPlayed.card) {
    const box = el('div', 'sgs-lastcard');
    box.appendChild(sgsCardEl(view.lastPlayed.card));
    mid.appendChild(box);
  }
  const infoTxt = pr
    ? (pr.type === 'resp' ? pr.info : '你的回合：点击发亮的牌使用，或结束回合')
    : (view.waitInfo || (view.turnPid ? `${ctx.nameOf(view.turnPid)} 的回合…` : ''));
  mid.appendChild(el('div', 'sgs-info', infoTxt || ''));
  stage.appendChild(mid);

  const meArea = el('div', 'sgs-me');
  const meP = view.players.find(p => p.pid === ctx.myId);
  const status = el('div', 'sgs-me-status');
  status.appendChild(el('span', 'sg-hp', hpBar(meP.hp, meP.maxHp)));
  status.appendChild(el('span', '', `${ID_INFO[view.myId].icon}${ID_INFO[view.myId].name}`));
  status.appendChild(el('span', '', `${GENERALS[view.myGen].icon}${GENERALS[view.myGen].name}【${GENERALS[view.myGen].skill}】${GENERALS[view.myGen].desc}`));
  meArea.appendChild(status);

  const btns = el('div', 'sgs-btns');
  const refreshSeats = () => {
    for (const p of view.players) {
      seatEls[p.pid].classList.toggle('pickable', pickTargets.has(p.pid));
      if (!pickTargets.has(p.pid) && p.pid !== lijianA) seatEls[p.pid].classList.remove('picked-a');
    }
  };

  if (pr && pr.type === 'play') {
    for (const sk of pr.skills) {
      const names = { rende: '🤝 仁德', zhiheng: '⚖️ 制衡', kurou: '🔥 苦肉', lijian: '🌙 离间' };
      const b = el('button', 'act-btn', names[sk]);
      b.onclick = () => {
        ctx.audio.play('click');
        if (sk === 'kurou') { send({ t: 'skill', name: 'kurou' }); return; }
        skillMode = skillMode === sk ? null : sk;
        selCard = null; selSet.clear(); lijianA = null; pickTargets = new Set();
        refreshHand(); refreshSeats();
        if (skillMode === 'rende') toast('选择要送出的手牌，再点目标头像');
        if (skillMode === 'zhiheng') { toast('选择要弃的手牌，然后点「确认制衡」'); bConfirm.style.display = ''; }
        if (skillMode === 'lijian') toast('先选要弃的一张牌，再依次点两名决斗者');
      };
      btns.appendChild(b);
    }
    const bConfirm = el('button', 'act-btn warm', '确认制衡');
    bConfirm.style.display = 'none';
    bConfirm.onclick = () => {
      if (skillMode === 'zhiheng' && selSet.size) send({ t: 'skill', name: 'zhiheng', i: [...selSet] });
    };
    btns.appendChild(bConfirm);
    const bEnd = el('button', 'act-btn plain', '⏹ 结束回合');
    bEnd.onclick = () => { ctx.audio.play('click'); send({ t: 'end' }); };
    btns.appendChild(bEnd);
  } else if (pr && pr.type === 'resp') {
    if (pr.kind === 'discard' || (pr.kind === 'shan' && pr.count > 1)) {
      const bOk = el('button', 'act-btn warm', pr.kind === 'discard' ? `确认弃牌(${pr.count})` : `打出${pr.count}张闪`);
      bOk.onclick = () => {
        if (selSet.size < pr.count) return toast(`需要选择 ${pr.count} 张牌`);
        send({ t: 'resp', cards: [...selSet] });
      };
      btns.appendChild(bOk);
    }
    if (pr.kind !== 'discard') {
      const bPass = el('button', 'act-btn plain', pr.kind === 'tao' ? '不救' : pr.kind === 'wuxie' ? '不使用' : '不出');
      bPass.onclick = () => send({ t: 'resp', cards: [] });
      btns.appendChild(bPass);
    }
  }
  meArea.appendChild(btns);

  const hand = el('div', 'sgs-hand');
  const cardEls = [];
  const usableMap = {};
  if (pr && pr.type === 'play') for (const u of pr.usable) if (!(u.i in usableMap) || !usableMap[u.i].as) usableMap[u.i] = u;
  const respUsable = pr && pr.type === 'resp' ? new Set(pr.usableIdx) : null;

  view.myHand.forEach((c, i) => {
    const cd = sgsCardEl(c);
    cardEls.push(cd);
    if (pr && pr.type === 'play') {
      if (skillMode) {
        cd.onclick = () => {
          if (skillMode === 'lijian') { selSet.clear(); selSet.add(i); }
          else if (selSet.has(i)) selSet.delete(i); else selSet.add(i);
          ctx.audio.play('select');
          refreshHand();
          if (skillMode === 'rende' || skillMode === 'lijian') {
            pickTargets = new Set(selSet.size ? view.players.filter(p => p.alive && p.pid !== ctx.myId).map(p => p.pid) : []);
            refreshSeats();
          }
        };
      } else if (usableMap[i]) {
        cd.classList.add('usable');
        cd.onclick = () => {
          ctx.audio.play('select');
          const u = usableMap[i];
          if (selCard && selCard.i === i) { selCard = null; pickTargets = new Set(); refreshHand(); refreshSeats(); return; }
          if (u.targets && u.targets.length) {
            selCard = u;
            pickTargets = new Set(u.targets);
            refreshHand(); refreshSeats();
            toast('点击发红光的目标头像');
          } else {
            send({ t: 'use', i: u.i, as: u.as });
          }
        };
      } else cd.classList.add('dim');
    } else if (respUsable) {
      if (respUsable.has(i) || pr.kind === 'discard') {
        if (pr.kind !== 'discard') cd.classList.add('usable');
        cd.onclick = () => {
          ctx.audio.play('select');
          if (pr.kind === 'discard' || (pr.kind === 'shan' && pr.count > 1)) {
            if (selSet.has(i)) selSet.delete(i); else if (selSet.size < pr.count) selSet.add(i);
            refreshHand();
          } else {
            send({ t: 'resp', cards: [i] });
          }
        };
      } else cd.classList.add('dim');
    }
    hand.appendChild(cd);
  });
  function refreshHand() {
    cardEls.forEach((cd, i) => {
      cd.classList.toggle('sel', selSet.has(i) || (selCard && selCard.i === i));
    });
  }
  meArea.appendChild(hand);
  stage.appendChild(meArea);

  if (root._sgsSeq !== view.seq && pr) ctx.audio.play('turn');
  root._sgsSeq = view.seq;
}

export default {
  id: 'sgs', name: '三国杀', icon: '🏯',
  desc: '身份暗战！开局选将，十二武将技能对决，锦囊装备样样齐全。',
  theme: 'linear-gradient(140deg, #7c2d12, #b45309 130%)',
  minPlayers: 4, maxPlayers: 8, defaultPlayers: 5,
  help: `<b>身份</b>：👑主公+🛡️忠臣 VS ⚔️反贼 VS 🎭内奸（身份保密，主公公开）。<br>
· 反贼目标：杀死主公；主忠目标：清除反贼和内奸；内奸：先除反贼、最后单挑主公；<br><br>
<b>回合</b>：判定（乐不思蜀）→ 摸两张牌 → 出牌 → 弃牌（手牌上限=体力）。<br>
· 【杀】需在攻击范围内，每回合限一张（连弩/张飞除外），可用【闪】抵消；<br>
· 【桃】回血、濒死求桃；【无懈可击】抵消指向自己的锦囊；<br>
· 【乐不思蜀】判定非红桃则跳过出牌阶段；<br>
· 装备：武器加攻击距离、八卦阵自动挡杀、±1马影响距离；<br>
· 击杀反贼摸三张牌，主公误杀忠臣弃全部手牌；<br>
· 十二武将：曹操/刘备/孙权/关羽/张飞/赵云/华佗/吕布/司马懿/黄盖/郭嘉/貂蝉，开局三选一。`,
  createEngine, ai, render,
};
