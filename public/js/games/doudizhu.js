// ===== 斗地主 =====
import { el, clear, shuffle, toast, pokerCard } from '../core/util.js';

// ---------- 样式 ----------
const CSS = `
.ddz-stage { position:absolute; inset:0; display:flex; flex-direction:column;
  background: radial-gradient(ellipse at 50% 20%, #14532d, #052012 75%); }
.ddz-stage::before { content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse 65% 42% at 50% 42%, rgba(255,235,150,.09), transparent 70%),
    repeating-linear-gradient(45deg, transparent 0 14px, rgba(255,255,255,.012) 14px 28px);
  box-shadow: inset 0 0 90px rgba(0,0,0,.65); }
.ddz-opps { display:flex; justify-content:space-between; padding:88px 18px 0; }
.ddz-mid { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; position:relative; }
.ddz-bottom3 { position:absolute; top:6px; left:50%; transform:translateX(-50%); display:flex; gap:4px; align-items:center; }
.ddz-bottom3 .pcard { width:34px; height:48px; }
.ddz-bottom3 .pcard .pc-corner { font-size:11px; }
.ddz-bottom3 .pcard .pc-suit-big { font-size:13px; }
.ddz-mult { position:absolute; top:58px; left:50%; transform:translateX(-50%); font-size:12px; color:#ffd76a; }
.ddz-played { display:flex; flex-wrap:wrap; justify-content:center; gap:0; max-width:88vw; min-height:76px; align-items:center; }
.ddz-played .pcard { margin-right:-26px; animation:pop .25s; }
.ddz-played .pcard:last-child { margin-right:0; }
.ddz-ptag { font-size:13px; color:#ffd76a; text-shadow:0 1px 3px #000; }
.ddz-sidemove { position:absolute; top:64px; font-size:12px; max-width:120px; display:flex; flex-wrap:wrap; }
.ddz-sidemove .pcard { width:30px; height:42px; margin-right:-14px; }
.ddz-sidemove .pcard .pc-corner { font-size:10px; }
.ddz-sidemove .pcard .pc-suit-big { display:none; }
.ddz-hand-wrap { padding:4px 8px 12px; }
.ddz-hand { display:flex; min-height:96px; align-items:flex-end;
  overflow-x:auto; padding:20px 12px 4px; }
.ddz-hand .pcard { margin-right:-30px; }
/* auto-margin：牌少时居中，牌多时两端都能滚动到（justify-content:center 会裁掉两边） */
.ddz-hand .pcard:first-child { margin-left:auto; }
.ddz-hand .pcard:last-child { margin-right:auto; }
.ddz-pass-bubble { background:#fff; color:#333; border-radius:14px; padding:4px 12px; font-size:13px; animation:pop .25s; }
`;
let cssDone = false;
function ensureCss() { if (!cssDone && typeof document !== 'undefined') { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); cssDone = true; } }

// ---------- 牌型 ----------
export const TYPE_NAMES = {
  single: '单张', pair: '对子', trio: '三张', trio1: '三带一', trio2: '三带二',
  straight: '顺子', pairseq: '连对', plane: '飞机', plane1: '飞机带单', plane2: '飞机带对',
  four2: '四带二', four2p: '四带两对', bomb: '炸弹', rocket: '王炸',
};

const isConsec = (a) => a.every((r, i) => i === 0 || r === a[i - 1] + 1);

export function parse(cards) {
  const n = cards.length;
  if (!n) return null;
  const cnt = {};
  for (const c of cards) cnt[c.r] = (cnt[c.r] || 0) + 1;
  const ranks = Object.keys(cnt).map(Number).sort((a, b) => a - b);
  const by = { 1: [], 2: [], 3: [], 4: [] };
  for (const r of ranks) by[cnt[r]].push(r);

  if (n === 1) return { type: 'single', len: 1, key: cards[0].r };
  if (n === 2) {
    if (ranks.length === 2 && ranks[0] >= 16) return { type: 'rocket', len: 2, key: 99 };
    if (by[2].length === 1) return { type: 'pair', len: 1, key: ranks[0] };
    return null;
  }
  if (n === 3 && by[3].length === 1) return { type: 'trio', len: 1, key: ranks[0] };
  if (n === 4) {
    if (by[4].length === 1) return { type: 'bomb', len: 1, key: ranks[0] };
    if (by[3].length === 1) return { type: 'trio1', len: 1, key: by[3][0] };
    return null;
  }
  if (n === 5 && by[3].length === 1 && by[2].length === 1) return { type: 'trio2', len: 1, key: by[3][0] };
  if (n >= 5 && ranks.length === n && isConsec(ranks) && ranks[n - 1] <= 14) return { type: 'straight', len: n, key: ranks[n - 1] };
  if (n >= 6 && n % 2 === 0 && by[2].length === n / 2 && ranks.length === n / 2 && isConsec(ranks) && ranks[ranks.length - 1] <= 14)
    return { type: 'pairseq', len: n / 2, key: ranks[ranks.length - 1] };
  if (n === 6 && by[4].length === 1) return { type: 'four2', len: 1, key: by[4][0] };
  if (n === 8 && by[4].length === 1 && by[2].length === 2) return { type: 'four2p', len: 1, key: by[4][0] };

  // 飞机族：m 个连续三张
  const tryPlane = (m, wingsPer, typeName) => {
    if (m < 2) return null;
    const trioRanks = ranks.filter(r => cnt[r] >= 3 && r <= 14);
    // 从大到小找长度为 m 的连续段
    for (let end = trioRanks.length - 1; end >= m - 1; end--) {
      const seg = trioRanks.slice(end - m + 1, end + 1);
      if (seg.length !== m || !isConsec(seg)) continue;
      const rest = { ...cnt };
      for (const r of seg) rest[r] -= 3;
      const restCards = Object.entries(rest).filter(([, v]) => v > 0);
      const restTotal = restCards.reduce((s, [, v]) => s + v, 0);
      if (wingsPer === 0 && restTotal === 0) return { type: typeName, len: m, key: seg[m - 1] };
      if (wingsPer === 1 && restTotal === m) return { type: typeName, len: m, key: seg[m - 1] };
      if (wingsPer === 2 && restTotal === 2 * m && restCards.every(([r, v]) => v % 2 === 0 && Number(r) < 16))
        return { type: typeName, len: m, key: seg[m - 1] };
    }
    return null;
  };
  if (n % 3 === 0) { const p = tryPlane(n / 3, 0, 'plane'); if (p) return p; }
  if (n % 4 === 0) { const p = tryPlane(n / 4, 1, 'plane1'); if (p) return p; }
  if (n % 5 === 0) { const p = tryPlane(n / 5, 2, 'plane2'); if (p) return p; }
  return null;
}

export function beats(a, b) {
  if (!b) return true;
  if (a.type === 'rocket') return true;
  if (b.type === 'rocket') return false;
  if (a.type === 'bomb') return b.type !== 'bomb' || a.key > b.key;
  if (b.type === 'bomb') return false;
  return a.type === b.type && a.len === b.len && a.key > b.key;
}

// ---------- 找牌（AI + 提示共用） ----------
function counts(hand) {
  const cnt = {};
  for (const c of hand) cnt[c.r] = (cnt[c.r] || 0) + 1;
  return cnt;
}
const take = (hand, r, k) => hand.filter(c => c.r === r).slice(0, k);

// 找出所有能压过 target 的候选（从小到大），target 为 null 时返回空
export function findBeats(hand, target) {
  if (!target) return [];
  const cnt = counts(hand);
  const ranks = Object.keys(cnt).map(Number).sort((a, b) => a - b);
  const res = [];
  const t = target;
  // 尽量不拆的排序权重
  const waste = r => (cnt[r] > 1 ? cnt[r] : 0);

  const smallestExtras = (excl, need, per) => {
    // 取 need 组、每组 per 张的最小翼牌
    const out = [];
    const pool = ranks.filter(r => !excl.includes(r) && cnt[r] >= per)
      .sort((a, b) => (cnt[a] === per ? 0 : 1) - (cnt[b] === per ? 0 : 1) || a - b);
    for (const r of pool) { if (out.length >= need) break; out.push(...take(hand, r, per)); }
    return out.length === need * per ? out : null;
  };

  if (t.type !== 'bomb' && t.type !== 'rocket') {
    if (t.type === 'single') {
      const cand = ranks.filter(r => r > t.key).sort((a, b) => waste(a) - waste(b) || a - b);
      for (const r of cand) res.push(take(hand, r, 1));
    } else if (t.type === 'pair') {
      const cand = ranks.filter(r => r > t.key && cnt[r] >= 2 && r < 16).sort((a, b) => waste(a) - waste(b) || a - b);
      for (const r of cand) res.push(take(hand, r, 2));
    } else if (t.type === 'trio' || t.type === 'trio1' || t.type === 'trio2') {
      for (const r of ranks.filter(r => r > t.key && cnt[r] >= 3)) {
        const trio = take(hand, r, 3);
        if (t.type === 'trio') res.push(trio);
        else {
          const per = t.type === 'trio1' ? 1 : 2;
          const w = smallestExtras([r], 1, per);
          if (w) res.push([...trio, ...w]);
        }
      }
    } else if (t.type === 'straight' || t.type === 'pairseq') {
      const per = t.type === 'straight' ? 1 : 2;
      for (let top = t.key + 1; top <= 14; top++) {
        let ok = true;
        for (let r = top - t.len + 1; r <= top; r++) if (!cnt[r] || cnt[r] < per) { ok = false; break; }
        if (ok) {
          const cards = [];
          for (let r = top - t.len + 1; r <= top; r++) cards.push(...take(hand, r, per));
          res.push(cards);
        }
      }
    } else if (t.type.startsWith('plane')) {
      const per = t.type === 'plane' ? 0 : (t.type === 'plane1' ? 1 : 2);
      for (let top = t.key + 1; top <= 14; top++) {
        let ok = true;
        const seg = [];
        for (let r = top - t.len + 1; r <= top; r++) { seg.push(r); if (!cnt[r] || cnt[r] < 3) { ok = false; break; } }
        if (!ok) continue;
        const cards = [];
        for (const r of seg) cards.push(...take(hand, r, 3));
        if (per === 0) { res.push(cards); continue; }
        const w = smallestExtras(seg, t.len, per);
        if (w) res.push([...cards, ...w]);
      }
    } else if (t.type === 'four2' || t.type === 'four2p') {
      for (const r of ranks.filter(r => r > t.key && cnt[r] === 4)) {
        const per = t.type === 'four2' ? 1 : 2;
        const w = smallestExtras([r], 2, per);
        if (w) res.push([...take(hand, r, 4), ...w]);
      }
    }
  }
  // 炸弹、王炸兜底
  for (const r of ranks) {
    if (cnt[r] === 4) {
      if (t.type === 'rocket') continue;
      if (t.type === 'bomb' && r <= t.key) continue;
      res.push(take(hand, r, 4));
    }
  }
  if (cnt[16] && cnt[17] && t.type !== 'rocket') res.push([...take(hand, 16, 1), ...take(hand, 17, 1)]);
  return res;
}

// 主动出牌选择（提示 / AI 共用）
export function chooseLead(hand, dangerSingle = false) {
  if (parse(hand)) return [...hand]; // 一手打完
  const cnt = counts(hand);
  const ranks = Object.keys(cnt).map(Number).sort((a, b) => a - b);
  // 顺子（手牌多时优先甩）
  if (hand.length >= 9) {
    let run = [];
    let best = null;
    for (let r = 3; r <= 14; r++) {
      if (cnt[r]) { run.push(r); if (run.length >= 5 && (!best || run.length > best.length)) best = [...run]; }
      else run = [];
    }
    if (best) {
      const cards = [];
      for (const r of best) cards.push(...take(hand, r, 1));
      return cards;
    }
  }
  // 三带一 / 三带二
  const trioR = ranks.find(r => cnt[r] === 3);
  if (trioR !== undefined) {
    const trio = take(hand, trioR, 3);
    const pairR = ranks.find(r => r !== trioR && cnt[r] === 2);
    const singleR = ranks.find(r => r !== trioR && cnt[r] === 1 && r < 16);
    if (singleR !== undefined) return [...trio, ...take(hand, singleR, 1)];
    if (pairR !== undefined) return [...trio, ...take(hand, pairR, 2)];
    return trio;
  }
  const pairR = ranks.find(r => cnt[r] === 2);
  const singles = ranks.filter(r => cnt[r] === 1);
  if (dangerSingle) {
    // 对手只剩一两张：先出对子或大单
    if (pairR !== undefined) return take(hand, pairR, 2);
    if (singles.length) return take(hand, singles[singles.length - 1], 1);
  }
  if (singles.length) return take(hand, singles[0], 1);
  if (pairR !== undefined) return take(hand, pairR, 2);
  return take(hand, ranks[0], 1);
}

// ---------- 引擎 ----------
function createEngine(players, emit) {
  const P = players.map(p => ({ ...p }));
  let G;
  const nameOf = pid => P.find(p => p.id === pid).name;

  function deal() {
    const deck = [];
    for (let r = 3; r <= 15; r++) for (let s = 0; s < 4; s++) deck.push({ r, s });
    deck.push({ r: 16, s: 0 }); deck.push({ r: 17, s: 0 });
    shuffle(deck);
    G = {
      phase: 'bid', hands: {}, bottom: deck.slice(51),
      bid: 0, bidPid: null, bidActed: 0, bidTurn: Math.floor(Math.random() * 3),
      landlord: null, turn: 0, lastPlay: null, passCount: 0,
      lastMoves: {}, multiplier: 1, plays: {}, log: [], over: null, sfx: null, seq: 0,
    };
    P.forEach((p, i) => {
      G.hands[p.id] = deck.slice(i * 17, i * 17 + 17).sort((a, b) => b.r - a.r || b.s - a.s);
      G.plays[p.id] = 0;
    });
    log(`🎴 发牌完毕，请 ${P[G.bidTurn].name} 叫地主`);
  }
  function log(s) { G.log.push(s); if (G.log.length > 40) G.log.shift(); }

  function viewFor(pid) {
    const myTurn = !G.over && P[G.phase === 'bid' ? G.bidTurn : G.turn].id === pid;
    return {
      game: 'ddz',
      phase: G.phase,
      hand: G.hands[pid],
      counts: P.map(p => ({ pid: p.id, n: G.hands[p.id].length })),
      order: P.map(p => p.id),
      turnPid: G.over ? null : P[G.phase === 'bid' ? G.bidTurn : G.turn].id,
      myTurn,
      bid: G.bid,
      landlord: G.landlord,
      bottom: G.landlord ? G.bottom : null,
      lastPlay: G.lastPlay ? { pid: G.lastPlay.pid, cards: G.lastPlay.cards, combo: G.lastPlay.combo } : null,
      leading: !G.lastPlay || (G.lastPlay && G.lastPlay.pid === pid),
      lastMoves: G.lastMoves,
      multiplier: G.multiplier,
      log: G.log.slice(-5),
      sfx: G.sfx, seq: G.seq,
      result: G.over ? { ...G.over.base, win: G.over.winners.includes(pid) } : null,
    };
  }
  function push(sfx = null) {
    G.sfx = sfx; G.seq++;
    for (const p of P) emit(p.id, viewFor(p.id));
    G.sfx = null;
  }

  function finish(winnerPid) {
    const landlordWon = winnerPid === G.landlord;
    const peasants = P.filter(p => p.id !== G.landlord);
    // 春天判定
    if (landlordWon && peasants.every(p => G.plays[p.id] === 0)) { G.multiplier *= 2; log('🌸 春天！倍数×2'); }
    if (!landlordWon && G.plays[G.landlord] <= 1) { G.multiplier *= 2; log('❄️ 反春！倍数×2'); }
    const total = G.bid * G.multiplier;
    const winners = landlordWon ? [G.landlord] : peasants.map(p => p.id);
    const lines = P.map(p => {
      const isL = p.id === G.landlord;
      const win = winners.includes(p.id);
      const pts = (isL ? 2 : 1) * total * (win ? 1 : -1);
      return `${isL ? '👑' : '🌾'} ${p.name} ${pts > 0 ? '+' : ''}${pts} 分`;
    });
    G.over = {
      winners,
      base: { title: landlordWon ? '地主胜利' : '农民胜利', lines: [`底分 ${G.bid} × 倍数 ${G.multiplier}`, ...lines] },
    };
    log(`🏁 ${nameOf(winnerPid)} 出完了所有牌！`);
    push();
  }

  return {
    start() { deal(); push('deal'); },
    onAction(pid, a) {
      if (!G || G.over || !a) return;
      if (G.phase === 'bid') {
        if (P[G.bidTurn].id !== pid || a.t !== 'bid') return;
        const v = Math.max(0, Math.min(3, a.v | 0));
        if (v > 0 && v <= G.bid) return;
        G.bidActed++;
        if (v > 0) { G.bid = v; G.bidPid = pid; log(`${nameOf(pid)} 叫 ${v} 分`); }
        else log(`${nameOf(pid)} 不叫`);
        if (v === 3 || G.bidActed >= 3) {
          if (G.bid === 0) { log('无人叫地主，重新发牌'); deal(); push('deal'); return; }
          G.landlord = G.bidPid;
          const h = G.hands[G.landlord];
          h.push(...G.bottom);
          h.sort((x, y) => y.r - x.r || y.s - x.s);
          G.phase = 'play';
          G.turn = P.findIndex(p => p.id === G.landlord);
          log(`👑 ${nameOf(G.landlord)} 成为地主（${G.bid} 分），亮出底牌`);
          push('turn');
        } else {
          G.bidTurn = (G.bidTurn + 1) % 3;
          push('click');
        }
        return;
      }
      // 出牌阶段
      if (P[G.turn].id !== pid) return;
      const hand = G.hands[pid];
      if (a.t === 'play') {
        const idx = [...new Set(a.idx)].filter(i => i >= 0 && i < hand.length);
        if (!idx.length || idx.length !== a.idx.length) return;
        const cards = idx.map(i => hand[i]);
        const combo = parse(cards);
        if (!combo) return;
        if (G.lastPlay && G.lastPlay.pid !== pid && !beats(combo, G.lastPlay.combo)) return;
        idx.sort((x, y) => y - x).forEach(i => hand.splice(i, 1));
        G.lastPlay = { pid, cards, combo };
        G.lastMoves = { [pid]: { cards, combo } };
        G.passCount = 0;
        G.plays[pid]++;
        let sfx = 'card';
        if (combo.type === 'bomb' || combo.type === 'rocket') { G.multiplier *= 2; sfx = 'bomb'; log(`💥 ${nameOf(pid)} 打出${TYPE_NAMES[combo.type]}！倍数×2`); }
        else log(`${nameOf(pid)} 出【${TYPE_NAMES[combo.type]}】`);
        if (hand.length === 0) { finish(pid); return; }
        if (hand.length <= 2) log(`⚠️ ${nameOf(pid)} 只剩 ${hand.length} 张牌！`);
        G.turn = (G.turn + 1) % 3;
        push(sfx);
      } else if (a.t === 'pass') {
        if (!G.lastPlay || G.lastPlay.pid === pid) return;
        G.lastMoves[pid] = { pass: true };
        G.passCount++;
        log(`${nameOf(pid)} 不出`);
        if (G.passCount >= 2) { G.lastPlay = null; G.passCount = 0; }
        G.turn = (G.turn + 1) % 3;
        push('pass');
      }
    },
  };
}

// ---------- AI ----------
function ai(view, act) {
  if (!view || view.game !== 'ddz' || view.result || !view.myTurn) return;
  const hand = view.hand;
  if (view.phase === 'bid') {
    let score = 0;
    const cnt = counts(hand);
    score += (cnt[15] || 0) * 1.5 + (cnt[16] ? 2 : 0) + (cnt[17] ? 2.5 : 0) + (cnt[14] || 0) * 0.6;
    for (const r in cnt) if (cnt[r] === 4) score += 3;
    if (cnt[16] && cnt[17]) score += 2;
    let v = score >= 8 ? 3 : score >= 6 ? 2 : score >= 4 ? 1 : 0;
    if (v > 0 && v <= view.bid) v = view.bid < 3 ? view.bid + 1 : 0;
    if (v > 0 && score < 4.5 && view.bid >= 2) v = 0;
    act({ t: 'bid', v });
    return;
  }
  const myPid = view.turnPid; // 轮到自己时收到的视图
  const amLandlord = view.landlord === myPid;
  const enemies = view.counts.filter(c => (amLandlord ? c.pid !== myPid : c.pid === view.landlord));
  const minEnemy = Math.min(...enemies.map(e => e.n));

  // 把牌对象映射回手牌下标
  const mapIdx = (cards) => {
    const used = new Set();
    return cards.map(c => {
      for (let i = 0; i < hand.length; i++) {
        if (!used.has(i) && hand[i].r === c.r && hand[i].s === c.s) { used.add(i); return i; }
      }
      return -1;
    });
  };

  if (view.leading) {
    const cards = chooseLead(hand, minEnemy <= 2);
    act({ t: 'play', idx: mapIdx(cards) });
    return;
  }
  const lp = view.lastPlay;
  const options = findBeats(hand, lp.combo);
  if (!options.length) { act({ t: 'pass' }); return; }
  const lastByTeammate = !amLandlord && lp.pid !== view.landlord;
  const first = options[0];
  const firstCombo = parse(first);
  const isBombPlay = firstCombo.type === 'bomb' || firstCombo.type === 'rocket';
  // 队友出的大牌（≥K）就让过
  if (lastByTeammate && (lp.combo.key >= 13 || isBombPlay)) { act({ t: 'pass' }); return; }
  // 不轻易动炸弹
  if (isBombPlay && lp.combo.type !== 'bomb' && lp.combo.type !== 'rocket') {
    const enemyDanger = minEnemy <= 3 && (amLandlord || lp.pid === view.landlord);
    const almostDone = hand.length - first.length <= 3;
    if (!enemyDanger && !almostDone) { act({ t: 'pass' }); return; }
  }
  act({ t: 'play', idx: mapIdx(first) });
}

// ---------- 渲染 ----------
function miniCards(cards) {
  const box = el('div', 'ddz-sidemove');
  cards.slice(0, 8).forEach(c => box.appendChild(pokerCard(c)));
  if (cards.length > 8) box.appendChild(el('span', '', `+${cards.length - 8}`));
  return box;
}

function render(root, view, send, ctx) {
  ensureCss();
  clear(root);
  const stage = el('div', 'ddz-stage');
  root.appendChild(stage);

  const logBox = el('div', 'game-log');
  view.log.forEach(l => logBox.appendChild(el('div', '', l)));
  stage.appendChild(logBox);

  const myIdx = view.order.indexOf(ctx.myId);
  const leftPid = view.order[(myIdx + 2) % 3];   // 上家
  const rightPid = view.order[(myIdx + 1) % 3];  // 下家

  const opps = el('div', 'ddz-opps');
  for (const pid of [leftPid, rightPid]) {
    const c = view.counts.find(x => x.pid === pid);
    const pav = el('div', 'pav' + (view.turnPid === pid ? ' turn' : ''));
    pav.appendChild(el('div', 'pav-face', ctx.avatarOf(pid)));
    pav.appendChild(el('div', 'pav-name', (view.landlord === pid ? '👑' : '🌾') + ctx.nameOf(pid)));
    pav.appendChild(el('div', 'pav-cnt', String(c.n)));
    const mv = view.lastMoves && view.lastMoves[pid];
    if (mv) {
      if (mv.pass) { const b = el('div', 'pav-bubble', '不出'); pav.appendChild(b); }
    }
    opps.appendChild(pav);
  }
  stage.appendChild(opps);

  const mid = el('div', 'ddz-mid');
  // 底牌
  const b3 = el('div', 'ddz-bottom3');
  b3.appendChild(el('span', 'ddz-ptag', '底牌'));
  if (view.bottom) view.bottom.forEach(c => b3.appendChild(pokerCard(c)));
  else for (let i = 0; i < 3; i++) b3.appendChild(pokerCard({}, false));
  mid.appendChild(b3);
  mid.appendChild(el('div', 'ddz-mult', view.phase === 'bid' ? `当前叫分：${view.bid || '无'}` : `底分 ${view.bid} · 倍数 ×${view.multiplier}`));

  // 中央出牌
  const played = el('div', 'ddz-played');
  if (view.lastPlay) {
    const box = el('div');
    box.style.textAlign = 'center';
    const cardsRow = el('div', 'ddz-played');
    view.lastPlay.cards.forEach((c, i) => {
      const cd = pokerCard(c);
      // 甩在桌上的随机小角度，更有牌桌味
      cd.style.setProperty('--rot', ((((c.r * 7 + c.s * 3 + i) % 9) - 4) * 1.1).toFixed(1) + 'deg');
      cardsRow.appendChild(cd);
    });
    box.appendChild(cardsRow);
    box.appendChild(el('div', 'ddz-ptag', `${ctx.nameOf(view.lastPlay.pid)} · ${TYPE_NAMES[view.lastPlay.combo.type]}`));
    played.appendChild(box);
  } else if (view.phase === 'play') {
    played.appendChild(el('div', 'ddz-ptag', view.turnPid === ctx.myId ? '轮到你自由出牌' : `等待 ${ctx.nameOf(view.turnPid || '')} 出牌…`));
  }
  mid.appendChild(played);
  stage.appendChild(mid);

  // 操作区
  const bar = el('div', 'act-bar');
  bar.style.bottom = '130px';
  const sel = new Set();

  if (view.phase === 'bid' && view.myTurn) {
    for (const v of [0, 1, 2, 3]) {
      if (v !== 0 && v <= view.bid) continue;
      const b = el('button', v === 0 ? 'act-btn plain' : 'act-btn' + (v === 3 ? ' warm' : ''), v === 0 ? '不叫' : `叫 ${v} 分`);
      b.onclick = () => { ctx.audio.play('click'); send({ t: 'bid', v }); };
      bar.appendChild(b);
    }
  } else if (view.phase === 'play' && view.myTurn && !view.result) {
    const bPass = el('button', 'act-btn plain', '不出');
    bPass.disabled = view.leading;
    bPass.onclick = () => { ctx.audio.play('pass'); send({ t: 'pass' }); };
    const bPlay = el('button', 'act-btn warm', '出牌');
    bPlay.onclick = () => {
      if (!sel.size) return toast('请先选牌');
      const cards = [...sel].map(i => view.hand[i]);
      const combo = parse(cards);
      if (!combo) return toast('❌ 不是合法牌型');
      if (!view.leading && !beats(combo, view.lastPlay.combo)) return toast('❌ 压不过上家的牌');
      send({ t: 'play', idx: [...sel] });
    };
    bar.appendChild(bPass); bar.appendChild(bPlay);
  }
  stage.appendChild(bar);

  // 手牌
  const wrap = el('div', 'ddz-hand-wrap');
  const handBox = el('div', 'ddz-hand');
  const cardEls = [];
  const mid2 = (view.hand.length - 1) / 2;
  view.hand.forEach((c, i) => {
    const cd = pokerCard(c);
    // 扇形手牌：微微旋转 + 弧形下沉，握在手里的感觉
    cd.style.setProperty('--rot', ((i - mid2) * 1.6).toFixed(1) + 'deg');
    cd.style.marginTop = (Math.pow(Math.abs(i - mid2), 1.4) * 1.1).toFixed(1) + 'px';
    cardEls.push(cd);
    cd.onclick = () => {
      if (!(view.phase === 'play' && view.myTurn)) return;
      if (sel.has(i)) sel.delete(i); else sel.add(i);
      ctx.audio.play('select');
      refreshSel();
    };
    handBox.appendChild(cd);
  });
  function refreshSel() { cardEls.forEach((cd, i) => cd.classList.toggle('sel', sel.has(i))); }
  wrap.appendChild(handBox);
  stage.appendChild(wrap);

  if (root._ddzSeq !== view.seq && view.myTurn) ctx.audio.play('turn');
  root._ddzSeq = view.seq;
}

export default {
  id: 'ddz', name: '斗地主', icon: '👑',
  desc: '国民纸牌！叫分抢地主，两个农民联手对抗，炸弹翻倍嗨翻天。',
  theme: 'linear-gradient(140deg, #14532d, #4d7c0f 130%)',
  minPlayers: 3, maxPlayers: 3, defaultPlayers: 3,
  help: `<b>目标</b>：地主先出完牌则地主胜，任一农民先出完则农民共同获胜。<br><br>
· 发牌后轮流<b>叫分</b>（1-3 分），最高者当地主并拿 3 张底牌；<br>
· 牌型：单张、对子、三带、顺子(≥5)、连对(≥3对)、飞机、四带二、炸弹、王炸；<br>
· 炸弹可压任意牌型，王炸最大，每个炸弹使倍数×2；<br>
· 「春天」（农民一张没出）倍数再×2。`,
  createEngine, ai, render,
};
