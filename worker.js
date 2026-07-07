// Cloudflare Workers 部署入口：静态资源 + WebSocket 房间中继（Durable Object）
// 部署：npx wrangler login && npx wrangler deploy
export default {
  async fetch(request, env) {
    if (request.headers.get('Upgrade') === 'websocket') {
      const id = env.ROOMS.idFromName('hub');
      return env.ROOMS.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

export class RoomHub {
  constructor(state) {
    this.state = state;
    // rooms: code -> { host, nextId, locked, clients: Map<id, ws>, names: Map<id, name> }
    this.rooms = new Map();
    this.meta = new WeakMap(); // ws -> { roomCode, pid }
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('需要 WebSocket 连接', { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.meta.set(server, {});
    server.addEventListener('message', (ev) => this.onMessage(server, ev.data));
    server.addEventListener('close', () => this.dropClient(server));
    server.addEventListener('error', () => this.dropClient(server));
    return new Response(null, { status: 101, webSocket: client });
  }

  send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch {} }

  genCode() {
    for (let i = 0; i < 100; i++) {
      const c = String(Math.floor(1000 + Math.random() * 9000));
      if (!this.rooms.has(c)) return c;
    }
    return String(Date.now()).slice(-4);
  }

  broadcastHumans(room) {
    const list = [...room.clients.keys()].map(id => ({ id, name: room.names.get(id) }));
    for (const ws of room.clients.values()) this.send(ws, { t: 'humans', list, host: room.host });
  }

  onMessage(ws, raw) {
    let m; try { m = JSON.parse(raw); } catch { return; }
    const meta = this.meta.get(ws) || {};
    const room = meta.roomCode ? this.rooms.get(meta.roomCode) : null;

    if (m.t === 'create') {
      const code = this.genCode();
      const r = { host: 'p1', nextId: 2, locked: false, clients: new Map(), names: new Map() };
      this.rooms.set(code, r);
      meta.roomCode = code; meta.pid = 'p1';
      this.meta.set(ws, meta);
      r.clients.set('p1', ws); r.names.set('p1', String(m.name || '玩家').slice(0, 8));
      this.send(ws, { t: 'created', code, id: 'p1' });
      this.broadcastHumans(r);
    } else if (m.t === 'join') {
      const r = this.rooms.get(String(m.code || ''));
      if (!r) return this.send(ws, { t: 'err', msg: '房间不存在，请检查房间号' });
      if (r.locked) return this.send(ws, { t: 'err', msg: '游戏已开始，无法加入' });
      if (r.clients.size >= 10) return this.send(ws, { t: 'err', msg: '房间已满' });
      const id = 'p' + r.nextId++;
      meta.roomCode = String(m.code); meta.pid = id;
      this.meta.set(ws, meta);
      r.clients.set(id, ws); r.names.set(id, String(m.name || '玩家').slice(0, 8));
      this.send(ws, { t: 'joined', code: meta.roomCode, id });
      this.broadcastHumans(r);
    } else if (m.t === 'relay' && room) {
      const payload = { t: 'data', from: meta.pid, data: m.data };
      if (m.to === 'all') {
        for (const [id, c] of room.clients) if (id !== meta.pid) this.send(c, payload);
      } else {
        const c = room.clients.get(m.to);
        if (c) this.send(c, payload);
      }
    } else if (m.t === 'lock' && room && meta.pid === room.host) {
      room.locked = !!m.on;
    } else if (m.t === 'leave') {
      this.dropClient(ws);
    }
    // 'ping' 心跳：无需处理
  }

  dropClient(ws) {
    const meta = this.meta.get(ws);
    if (!meta || !meta.roomCode) return;
    const code = meta.roomCode;
    const room = this.rooms.get(code);
    meta.roomCode = null;
    if (!room) return;
    room.clients.delete(meta.pid);
    room.names.delete(meta.pid);
    if (room.clients.size === 0) { this.rooms.delete(code); return; }
    if (meta.pid === room.host) {
      for (const c of room.clients.values()) this.send(c, { t: 'closed', msg: '房主已离开，房间解散' });
      for (const c of room.clients.values()) { const cm = this.meta.get(c); if (cm) cm.roomCode = null; }
      this.rooms.delete(code);
    } else {
      this.broadcastHumans(room);
    }
  }
}
