// 网络层：在线房间（WebSocket 中继）
// 单机模式不需要本文件——主程序直接在本地跑引擎 + AI。

// 免费联机后端（Cloudflare Workers），供静态托管页面（GitHub Pages 等）默认使用
const CF_BACKEND = 'wss://juhui-katong.158486706.workers.dev';

export function defaultServerUrl() {
  const saved = localStorage.getItem('jk_server');
  if (saved) return saved;
  // 纯静态托管（无自带联机后端）→ 默认连 Cloudflare 后端
  if (location.host.endsWith('github.io')) return CF_BACKEND;
  if (location.protocol.startsWith('http')) {
    return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  }
  return 'ws://localhost:3000';
}

export function saveServerUrl(u) { localStorage.setItem('jk_server', u); }

export class OnlineRoom {
  constructor() {
    this.ws = null;
    this.myId = null;
    this.code = null;
    this.hostId = null;
    this.humans = [];       // [{id, name}]
    this._onHumans = null;  // (list) => {}
    this._onData = null;    // (fromId, data) => {}
    this._onClosed = null;  // (msg) => {}
    this._hasHumans = false;
    this._pendingData = [];
    this._pendingClosed = null;
  }
  get isHost() { return this.myId === this.hostId; }
  get onHumans() { return this._onHumans; }
  set onHumans(fn) {
    this._onHumans = fn;
    if (fn && this._hasHumans) fn(this.humans);
  }
  get onData() { return this._onData; }
  set onData(fn) {
    this._onData = fn;
    if (!fn) return;
    const pending = this._pendingData.splice(0);
    for (const item of pending) fn(item.from, item.data);
  }
  get onClosed() { return this._onClosed; }
  set onClosed(fn) {
    this._onClosed = fn;
    if (fn && this._pendingClosed) {
      const msg = this._pendingClosed;
      this._pendingClosed = null;
      fn(msg);
    }
  }

  // mode: {create:true, name} 或 {join:code, name}
  connect(opts) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let ws;
      try { ws = new WebSocket(defaultServerUrl()); } catch (e) { return reject(new Error('无法连接服务器')); }
      this.ws = ws;
      const timer = setTimeout(() => {
        if (!settled) { settled = true; ws.close(); reject(new Error('连接服务器超时，请检查联机设置')); }
      }, 8000);

      ws.onopen = () => {
        if (opts.create) ws.send(JSON.stringify({ t: 'create', name: opts.name }));
        else ws.send(JSON.stringify({ t: 'join', code: opts.join, name: opts.name }));
      };
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch { return; }
        if (m.t === 'created' || m.t === 'joined') {
          this.code = m.code; this.myId = m.id;
          // 心跳保活（云端/隧道空闲会断连）
          this._ping = setInterval(() => this._send({ t: 'ping' }), 25000);
          if (!settled) { settled = true; clearTimeout(timer); resolve(this); }
        } else if (m.t === 'humans') {
          this.humans = m.list; this.hostId = m.host;
          this._hasHumans = true;
          if (this._onHumans) this._onHumans(m.list);
        } else if (m.t === 'data') {
          if (this._onData) this._onData(m.from, m.data);
          else this._pendingData.push({ from: m.from, data: m.data });
        } else if (m.t === 'err') {
          if (!settled) { settled = true; clearTimeout(timer); ws.close(); reject(new Error(m.msg)); }
        } else if (m.t === 'closed') {
          const msg = m.msg || '房间已解散';
          if (this._onClosed) this._onClosed(msg);
          else this._pendingClosed = msg;
        }
      };
      ws.onerror = () => {
        if (!settled) { settled = true; clearTimeout(timer); reject(new Error('无法连接服务器，请检查「联机设置」中的地址')); }
      };
      ws.onclose = () => {
        if (!settled) { settled = true; clearTimeout(timer); reject(new Error('连接已断开')); }
        else if (this.ws === ws) {
          const msg = '与服务器断开连接';
          if (this._onClosed) this._onClosed(msg);
          else this._pendingClosed = msg;
        }
      };
    });
  }
  _send(obj) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); }
  sendTo(pid, data) { this._send({ t: 'relay', to: pid, data }); }
  broadcast(data) { this._send({ t: 'relay', to: 'all', data }); }
  lock(on) { this._send({ t: 'lock', on }); }
  leave() {
    if (this._ping) { clearInterval(this._ping); this._ping = null; }
    const ws = this.ws; this.ws = null;
    if (ws) { try { ws.send(JSON.stringify({ t: 'leave' })); } catch {} ws.close(); }
  }
}
