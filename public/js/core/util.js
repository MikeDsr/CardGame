// 通用工具
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, cls = '', text = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== '') e.textContent = text;
  return e;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

export function shuffle(arr, rnd = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const rndInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function toast(msg, ms = 2200) {
  const box = document.getElementById('toast-box');
  const t = el('div', 'toast', msg);
  box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, ms - 400);
  setTimeout(() => t.remove(), ms);
}

// 弹窗：content 为元素或 html 字符串；buttons: [{text, cls, cb, keep}]
export function modal({ title = '', body = null, buttons = [], dismissable = true }) {
  const layer = document.getElementById('modal-layer');
  clear(layer);
  layer.classList.remove('hidden');
  const box = el('div', 'modal-box');
  if (title) box.appendChild(el('h3', '', title));
  if (body) {
    if (typeof body === 'string') { const b = el('div', 'm-body'); b.innerHTML = body; box.appendChild(b); }
    else box.appendChild(body);
  }
  const close = () => { layer.classList.add('hidden'); clear(layer); };
  if (buttons.length) {
    const bar = el('div', 'modal-btns');
    for (const b of buttons) {
      const btn = el('button', b.cls || 'act-btn', b.text);
      btn.onclick = () => { if (!b.keep) close(); b.cb && b.cb(); };
      bar.appendChild(btn);
    }
    box.appendChild(bar);
  }
  layer.onclick = (e) => { if (e.target === layer && dismissable) close(); };
  layer.appendChild(box);
  return close;
}

// 撒彩带庆祝
export function confetti(container = document.body, n = 60) {
  const colors = ['#ffd76a', '#ff5c8a', '#5cd8ff', '#8aff5c', '#b06aff', '#ff9a5c'];
  for (let i = 0; i < n; i++) {
    const c = el('div', 'confetti');
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = pick(colors);
    c.style.animationDuration = (2 + Math.random() * 2.5) + 's';
    c.style.animationDelay = (Math.random() * .8) + 's';
    c.style.width = c.style.height = (6 + Math.random() * 8) + 'px';
    container.appendChild(c);
    setTimeout(() => c.remove(), 5500);
  }
}

// 通用结果遮罩
export function showResult(root, { title, win, lines = [] }, buttons) {
  const layer = el('div', 'result-layer');
  const box = el('div', 'result-box');
  box.appendChild(el('div', 'result-title ' + (win ? 'win' : 'lose'), title));
  box.appendChild(el('div', 'result-lines', lines.join('\n')));
  const bar = el('div', 'modal-btns');
  for (const b of buttons) {
    const btn = el('button', b.cls || 'act-btn', b.text);
    btn.onclick = b.cb;
    bar.appendChild(btn);
  }
  box.appendChild(bar);
  layer.appendChild(box);
  root.appendChild(layer);
  if (win) confetti(layer);
  return layer;
}

export const AVATARS = ['🦊', '🐱', '🐼', '🐸', '🦁', '🐰', '🐯', '🐨', '🐮', '🐵', '🐹', '🦄'];
export function avatarOf(pid) {
  let h = 0; const s = String(pid);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
}

// 扑克牌 DOM（r: 3-15=3..2, 16小王 17大王; s: 0♠ 1♥ 2♣ 3♦）
const RANK_TXT = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2' };
const SUITS = ['♠', '♥', '♣', '♦'];
export function pokerCard(card, faceUp = true) {
  const d = el('div', 'pcard');
  if (!faceUp) { d.classList.add('back'); return d; }
  if (card.r >= 16) {
    d.classList.add('joker');
    if (card.r === 17) d.classList.add('red');
    const c = el('div', 'pc-corner', card.r === 17 ? '大王' : '小王');
    d.appendChild(c);
    d.appendChild(el('div', 'pc-suit-big', '🃏'));
  } else {
    if (card.s === 1 || card.s === 3) d.classList.add('red');
    const c = el('div', 'pc-corner');
    c.innerHTML = (RANK_TXT[card.r] || card.r) + '<br>' + SUITS[card.s];
    d.appendChild(c);
    d.appendChild(el('div', 'pc-suit-big', SUITS[card.s]));
  }
  return d;
}
export const rankText = (r) => r >= 16 ? (r === 17 ? '大王' : '小王') : (RANK_TXT[r] || String(r));
export const suitText = (s) => SUITS[s];
