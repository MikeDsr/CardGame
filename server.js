// 聚会卡堂 联机服务器：静态文件 + WebSocket 房间中继
// 用法: npm install && npm start  （默认端口 3000，可用环境变量 PORT 修改）
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(PUB, p);
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 未找到'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

// ---------------- 房间系统 ----------------
// rooms: code -> { host: id, nextId, clients: Map<id, ws>, names: Map<id, name> }
const rooms = new Map();

function genCode() {
  for (let i = 0; i < 100; i++) {
    const c = String(Math.floor(1000 + Math.random() * 9000));
    if (!rooms.has(c)) return c;
  }
  return String(Date.now()).slice(-4);
}

function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }

function broadcastHumans(room) {
  const list = [...room.clients.keys()].map(id => ({ id, name: room.names.get(id) }));
  for (const ws of room.clients.values()) send(ws, { t: 'humans', list, host: room.host });
}

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    const room = ws.roomCode ? rooms.get(ws.roomCode) : null;

    if (m.t === 'create') {
      const code = genCode();
      const r = { host: 'p1', nextId: 2, clients: new Map(), names: new Map() };
      rooms.set(code, r);
      ws.roomCode = code; ws.pid = 'p1';
      r.clients.set('p1', ws); r.names.set('p1', String(m.name || '玩家').slice(0, 8));
      send(ws, { t: 'created', code, id: 'p1' });
      broadcastHumans(r);
    } else if (m.t === 'join') {
      const r = rooms.get(String(m.code || ''));
      if (!r) return send(ws, { t: 'err', msg: '房间不存在，请检查房间号' });
      if (r.locked) return send(ws, { t: 'err', msg: '游戏已开始，无法加入' });
      if (r.clients.size >= 10) return send(ws, { t: 'err', msg: '房间已满' });
      const id = 'p' + r.nextId++;
      ws.roomCode = String(m.code); ws.pid = id;
      r.clients.set(id, ws); r.names.set(id, String(m.name || '玩家').slice(0, 8));
      send(ws, { t: 'joined', code: ws.roomCode, id });
      broadcastHumans(r);
    } else if (m.t === 'relay' && room) {
      const payload = { t: 'data', from: ws.pid, data: m.data };
      if (m.to === 'all') {
        for (const [id, c] of room.clients) if (id !== ws.pid) send(c, payload);
      } else {
        const c = room.clients.get(m.to);
        if (c) send(c, payload);
      }
    } else if (m.t === 'lock' && room && ws.pid === room.host) {
      room.locked = !!m.on;
    } else if (m.t === 'leave' && room) {
      dropClient(ws);
    }
  });

  ws.on('close', () => dropClient(ws));
});

function dropClient(ws) {
  const room = ws.roomCode ? rooms.get(ws.roomCode) : null;
  if (!room) return;
  room.clients.delete(ws.pid);
  room.names.delete(ws.pid);
  ws.roomCode = null;
  if (room.clients.size === 0) { rooms.delete(ws.roomCode); return; }
  if (ws.pid === room.host) {
    // 房主离开：房间解散
    for (const c of room.clients.values()) send(c, { t: 'closed', msg: '房主已离开，房间解散' });
    for (const c of room.clients.values()) { c.roomCode = null; }
    rooms.delete(ws.roomCode);
  } else {
    broadcastHumans(room);
  }
}

// 心跳，清理断线
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { dropClient(ws); ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 15000);

server.listen(PORT, () => {
  console.log(`聚会卡堂已启动: http://localhost:${PORT}`);
  console.log('局域网联机：让好友连接同一 WiFi，访问 http://<本机IP>:' + PORT);
});
