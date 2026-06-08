const fs = require("fs");
const pathModule = require("path");
const http = require("http");
const { readDb, mutate, makeId, roomCode } = require("./lib/store");
const { sendJson, notFound, badRequest, readBody, routePath, routeQuery } = require("./lib/http");
const { extractOtp, otpExpiresAt } = require("./lib/otp");
const gmail = require("./lib/gmail");
const imap = require("./lib/imap");

loadEnv();
syncAdminAccount();
syncDefaultImapConfig();

const PORT = Number(process.env.PORT || 8080);
const FRONTEND_DIR = pathModule.resolve(__dirname, "..", "files");
const sseClients = new Map();

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return sendJson(res, 200, {});
    const path = routePath(req);

    if (req.method === "GET" && path === "/api/health") return sendJson(res, 200, { ok: true });
    if (req.method === "GET" && path.match(/^\/api\/rooms\/[^/]+\/events$/)) return roomEvents(req, res, path);
    if (req.method === "POST" && path === "/api/auth/register") return await register(req, res);
    if (req.method === "POST" && path === "/api/auth/login") return await login(req, res);
    if (req.method === "GET" && path === "/api/me") return me(req, res);
    if (req.method === "GET" && path === "/api/rooms") return listRooms(req, res);
    if (req.method === "POST" && path === "/api/rooms") return await createRoom(req, res);
    if (req.method === "POST" && path === "/api/rooms/join") return await joinRoom(req, res);
    if (req.method === "POST" && path.match(/^\/api\/rooms\/[^/]+\/messages$/)) return await addRoomMessage(req, res, path);
    if (req.method === "GET" && path.match(/^\/api\/rooms\/[^/]+\/messages$/)) return roomMessages(req, res, path);
    if (req.method === "GET" && path.match(/^\/api\/rooms\/[^/]+\/gmail\/auth-url$/)) return gmailAuthUrl(req, res, path);
    if (req.method === "GET" && path === "/api/gmail/callback") return await gmailCallback(req, res);
    if (req.method === "POST" && path.match(/^\/api\/rooms\/[^/]+\/gmail\/poll$/)) return await pollRoom(req, res, path);
    if (req.method === "POST" && path.match(/^\/api\/rooms\/[^/]+\/imap$/)) return await saveRoomImap(req, res, path);
    if (req.method === "POST" && path.match(/^\/api\/rooms\/[^/]+\/imap\/poll$/)) return await pollRoomImap(req, res, path);

    if (req.method === "GET") return serveStatic(req, res, path);
    return notFound(res);
  } catch (error) {
    sendJson(res, 500, { error: "server_error", message: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`SubPay backend listening on http://localhost:${PORT}`);
  startGmailPoller();
});

function loadEnv() {
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    process.env[key.trim()] = rest.join("=").trim();
  }
}

function syncDefaultImapConfig() {
  const email = process.env.DEFAULT_IMAP_EMAIL;
  const appPassword = process.env.DEFAULT_IMAP_APP_PASSWORD;
  if (!email || !appPassword) return;

  mutate((db) => {
    const roomCodeValue = (process.env.DEFAULT_IMAP_ROOM_CODE || db.rooms[0]?.code || "").toUpperCase();
    const room = db.rooms.find((item) => item.code.toUpperCase() === roomCodeValue) || db.rooms[0];
    if (!room) return null;

    db.imapAccounts = db.imapAccounts || [];
    db.imapAccounts = db.imapAccounts.filter((account) => account.roomId !== room.id);
    db.imapAccounts.push({
      id: makeId("imap"),
      roomId: room.id,
      email,
      appPassword,
      host: process.env.DEFAULT_IMAP_HOST || "imap.gmail.com",
      port: Number(process.env.DEFAULT_IMAP_PORT || 993),
      secure: process.env.DEFAULT_IMAP_SECURE !== "false",
      lastUid: Number(process.env.DEFAULT_IMAP_LAST_UID || 0),
      createdAt: Date.now()
    });
    room.inboundEmail = email;
    return room;
  });
}

function syncAdminAccount() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password) {
    console.warn("Admin account is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD.");
    return;
  }
  mutate((db) => {
    let user = db.users.find((item) => item.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: makeId("usr"),
        name: process.env.ADMIN_NAME || "SubPay Security",
        email,
        phone: "",
        avatar: "AD",
        role: "admin",
        password,
        language: "ar",
        createdAt: Date.now()
      };
      db.users.unshift(user);
      return user;
    }
    user.role = "admin";
    user.password = password;
    user.avatar = user.avatar || "AD";
    return user;
  });
}

function currentUser(db, req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = db.sessions.find((item) => item.token === token);
  return session ? db.users.find((user) => user.id === session.userId) : db.users[0];
}

async function register(req, res) {
  const body = await readBody(req);
  if (!body.email) return badRequest(res, "email is required");
  const result = mutate((db) => {
    let user = db.users.find((item) => item.email.toLowerCase() === body.email.toLowerCase());
    if (!user) {
      user = {
        id: makeId("usr"),
        name: body.name || "مستخدم جديد",
        email: body.email,
        phone: body.phone || "",
        avatar: "SP",
        role: "member",
        password: body.password || "",
        language: "ar",
        createdAt: Date.now()
      };
      db.users.push(user);
    }
    const token = makeId("sess");
    db.sessions.push({ token, userId: user.id, createdAt: Date.now() });
    return { user, token };
  });
  sendJson(res, 201, result);
}

async function login(req, res) {
  const body = await readBody(req);
  const result = mutate((db) => {
    let user = db.users.find((item) => item.email.toLowerCase() === String(body.email || "").toLowerCase());
    if (!user) user = db.users[0];
    if (user.password && String(body.password || "") !== String(user.password)) {
      return { error: "invalid_credentials" };
    }
    const token = makeId("sess");
    db.sessions.push({ token, userId: user.id, createdAt: Date.now() });
    return { user, token };
  });
  if (result.error) return badRequest(res, "invalid email or password");
  sendJson(res, 200, result);
}

function me(req, res) {
  const db = readDb();
  sendJson(res, 200, { user: currentUser(db, req) });
}

function listRooms(req, res) {
  const db = readDb();
  const user = currentUser(db, req);
  const roomIds = new Set(db.memberships.filter((member) => member.userId === user.id).map((member) => member.roomId));
  const rooms = db.rooms.filter((room) => roomIds.has(room.id)).map((room) => enrichRoom(db, room, user.id));
  sendJson(res, 200, { rooms });
}

async function createRoom(req, res) {
  const body = await readBody(req);
  if (!body.name) return badRequest(res, "room name is required");
  const result = mutate((db) => {
    const user = currentUser(db, req);
    if (user.role !== "admin") return { forbidden: true };
    const code = uniqueRoomCode(db, body.name);
    const room = {
      id: makeId("room"),
      ownerId: user.id,
      name: body.name,
      code,
      inviteLink: `subpay://join/${code}`,
      inboundEmail: body.inboundEmail || `${code.toLowerCase()}@subpay.app`,
      subscriptionEmail: body.subscriptionEmail || "",
      monthlyPrice: Number(body.monthlyPrice || 0),
      password: body.password || "",
      createdAt: Date.now()
    };
    db.rooms.unshift(room);
    db.memberships.push({ id: makeId("mem"), roomId: room.id, userId: user.id, role: "owner", paidUntil: null, createdAt: Date.now() });
    if (body.imapEmail && body.imapAppPassword) {
      db.imapAccounts = db.imapAccounts || [];
      db.imapAccounts.push({
        id: makeId("imap"),
        roomId: room.id,
        email: body.imapEmail,
        appPassword: body.imapAppPassword,
        host: body.imapHost || "imap.gmail.com",
        port: Number(body.imapPort || 993),
        secure: body.imapSecure !== false,
        lastUid: 0,
        createdAt: Date.now()
      });
      room.inboundEmail = body.imapEmail;
    }
    return enrichRoom(db, room, user.id);
  });
  if (result?.forbidden) return sendJson(res, 403, { error: "forbidden", message: "admin account required" });
  sendJson(res, 201, { room: result });
}

async function joinRoom(req, res) {
  const body = await readBody(req);
  const code = String(body.code || "").trim().toUpperCase();
  const result = mutate((db) => {
    const user = currentUser(db, req);
    const room = db.rooms.find((item) => item.code.toUpperCase() === code);
    if (!room) return null;
    const exists = db.memberships.some((member) => member.roomId === room.id && member.userId === user.id);
    if (!exists) db.memberships.push({ id: makeId("mem"), roomId: room.id, userId: user.id, role: "member", paidUntil: null, createdAt: Date.now() });
    return enrichRoom(db, room, user.id);
  });
  if (!result) return badRequest(res, "invalid room code");
  sendJson(res, 200, { room: result });
}

async function addRoomMessage(req, res, path) {
  const roomId = path.split("/")[3];
  const body = await readBody(req);
  const result = mutate((db) => {
    const room = db.rooms.find((item) => item.id === roomId);
    if (!room) return null;
    const createdAt = Date.now();
    const text = `${body.subject || ""}\n${body.body || ""}`;
    const otp = extractOtp(text);
    const message = {
      id: makeId("msg"),
      roomId,
      type: body.type || "email",
      subject: body.subject || "رسالة واردة",
      body: body.body || "",
      from: body.from || room.inboundEmail,
      sourceEmail: room.inboundEmail,
      otp,
      otpExpiresAt: otp ? otpExpiresAt(createdAt) : null,
      createdAt
    };
    db.messages.unshift(message);
    return message;
  });
  if (!result) return notFound(res);
  notifyRoom(roomId, "message", result);
  sendJson(res, 201, { message: result });
}

function roomMessages(req, res, path) {
  const roomId = path.split("/")[3];
  const db = readDb();
  sendJson(res, 200, { messages: db.messages.filter((msg) => msg.roomId === roomId) });
}

function gmailAuthUrl(req, res, path) {
  const roomId = path.split("/")[3];
  sendJson(res, 200, { authUrl: gmail.authUrl(roomId) });
}

async function gmailCallback(req, res) {
  const query = routeQuery(req);
  const code = query.get("code");
  const roomId = query.get("state");
  if (!code || !roomId) return badRequest(res, "missing code or room state");
  const token = await gmail.exchangeCode(code);
  mutate((db) => {
    const room = db.rooms.find((item) => item.id === roomId);
    if (!room) throw new Error("room not found");
    db.gmailAccounts = db.gmailAccounts.filter((account) => account.roomId !== roomId);
    db.gmailAccounts.push({ id: makeId("gmail"), roomId, ...token, lastHistoryAt: null, createdAt: Date.now() });
  });
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h1>SubPay Gmail connected</h1><p>You can close this window.</p>");
}

async function pollRoom(req, res, path) {
  const roomId = path.split("/")[3];
  const result = await pollRoomById(roomId);
  result.forEach((message) => notifyRoom(roomId, "message", message));
  sendJson(res, 200, { created: result });
}

async function saveRoomImap(req, res, path) {
  const roomId = path.split("/")[3];
  const body = await readBody(req);
  if (!body.email || !body.appPassword) return badRequest(res, "email and appPassword are required");
  const result = mutate((db) => {
    const room = db.rooms.find((item) => item.id === roomId);
    if (!room) return null;
    db.imapAccounts = db.imapAccounts || [];
    db.imapAccounts = db.imapAccounts.filter((account) => account.roomId !== roomId);
    db.imapAccounts.push({
      id: makeId("imap"),
      roomId,
      email: body.email,
      appPassword: body.appPassword,
      host: body.host || "imap.gmail.com",
      port: Number(body.port || 993),
      secure: body.secure !== false,
      lastUid: 0,
      createdAt: Date.now()
    });
    room.inboundEmail = body.email;
    return { room, configured: true };
  });
  if (!result) return notFound(res);
  sendJson(res, 200, result);
}

async function pollRoomImap(req, res, path) {
  const roomId = path.split("/")[3];
  const result = await pollRoomImapById(roomId);
  result.forEach((message) => notifyRoom(roomId, "message", message));
  sendJson(res, 200, { created: result });
}

async function pollRoomById(roomId) {
  const { readDb, writeDb } = require("./lib/store");
  const db = readDb();
  const room = db.rooms.find((item) => item.id === roomId);
  const account = db.gmailAccounts.find((item) => item.roomId === roomId);
  if (!room || !account) return [];
  const created = await gmail.pollRoomGmail(db, room, account);
  writeDb(db);
  return created;
}

function startGmailPoller() {
  const seconds = Number(process.env.IMAP_POLL_INTERVAL_SECONDS || process.env.GMAIL_POLL_INTERVAL_SECONDS || 5);
  setInterval(async () => {
    const db = readDb();
    for (const account of db.gmailAccounts) {
      try {
        const created = await pollRoomById(account.roomId);
        created.forEach((message) => notifyRoom(account.roomId, "message", message));
      } catch (error) {
        console.error(`Gmail poll failed for room ${account.roomId}:`, error.message);
      }
    }
    for (const account of db.imapAccounts || []) {
      try {
        if (!account.email || !account.appPassword) continue;
        const created = await pollRoomImapById(account.roomId);
        created.forEach((message) => notifyRoom(account.roomId, "message", message));
      } catch (error) {
        console.error(`IMAP poll failed for room ${account.roomId}:`, error.message);
      }
    }
  }, Math.max(5, seconds) * 1000);
}

async function pollRoomImapById(roomId) {
  const { readDb, writeDb } = require("./lib/store");
  const db = readDb();
  const room = db.rooms.find((item) => item.id === roomId);
  const account = (db.imapAccounts || []).find((item) => item.roomId === roomId);
  if (!room || !account) return [];
  const created = await imap.pollRoomImap(db, room, account);
  writeDb(db);
  return created;
}

function enrichRoom(db, room, userId) {
  const membership = db.memberships.find((member) => member.roomId === room.id && member.userId === userId);
  return {
    ...room,
    role: membership?.role || "member",
    paidUntil: membership?.paidUntil || null,
    members: db.memberships
      .filter((member) => member.roomId === room.id)
      .map((member) => ({ ...member, user: db.users.find((user) => user.id === member.userId) })),
    messages: db.messages.filter((message) => message.roomId === room.id)
  };
}

function uniqueRoomCode(db, name) {
  let code = roomCode(name);
  while (db.rooms.some((room) => room.code === code)) code = roomCode(name);
  return code;
}

function roomEvents(req, res, path) {
  const roomId = path.split("/")[3];
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });
  res.write(`event: ready\ndata: ${JSON.stringify({ roomId, connectedAt: Date.now() })}\n\n`);

  if (!sseClients.has(roomId)) sseClients.set(roomId, new Set());
  const clients = sseClients.get(roomId);
  clients.add(res);

  const heartbeat = setInterval(() => {
    if (!res.destroyed) res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
    if (clients.size === 0) sseClients.delete(roomId);
  });
}

function notifyRoom(roomId, event, payload) {
  const clients = sseClients.get(roomId);
  if (!clients) return;
  const data = JSON.stringify(payload);
  for (const client of clients) {
    if (!client.destroyed) client.write(`event: ${event}\ndata: ${data}\n\n`);
  }
}

function serveStatic(req, res, urlPath) {
  let requested = urlPath === "/" ? "/index.html" : urlPath;
  requested = decodeURIComponent(requested).replace(/\\/g, "/");
  const filePath = pathModule.resolve(FRONTEND_DIR, `.${requested}`);
  if (!filePath.startsWith(FRONTEND_DIR)) return notFound(res);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return notFound(res);

  const ext = pathModule.extname(filePath).toLowerCase();
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml; charset=utf-8",
    ".ico": "image/x-icon",
    ".webmanifest": "application/manifest+json; charset=utf-8"
  };
  res.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
  });
  fs.createReadStream(filePath).pipe(res);
}
