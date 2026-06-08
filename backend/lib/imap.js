const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { extractOtp, otpExpiresAt } = require("./otp");
const { makeId } = require("./store");

function pythonExe() {
  if (process.env.PYTHON_EXE) return process.env.PYTHON_EXE;
  const bundled = path.join(
    os.homedir(),
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "python",
    "python.exe"
  );
  if (fs.existsSync(bundled)) return bundled;
  return "python";
}

function parseRawEmail(room, uid, rawMessage) {
  const createdAt = rawMessage.dateMs || Date.now();
  const subject = rawMessage.subject || "رسالة واردة";
  const body = rawMessage.body || "";
  const otp = extractOtp(`${subject}\n${body}`);
  return {
    id: makeId("msg"),
    roomId: room.id,
    type: "email",
    externalId: `imap:${room.id}:${uid}`,
    subject,
    body: body.slice(0, 4000),
    from: rawMessage.from || room.inboundEmail,
    sourceEmail: accountEmail(room),
    otp,
    otpExpiresAt: otp ? otpExpiresAt(createdAt) : null,
    createdAt
  };
}

function accountEmail(room) {
  return room.inboundEmail;
}

async function pollRoomImap(db, room, account) {
  if (!account.email || !account.appPassword) throw new Error("Missing IMAP email/app password.");
  const script = path.join(__dirname, "imap_poll.py");
  const input = JSON.stringify({
    host: account.host || "imap.gmail.com",
    port: Number(account.port || 993),
    email: account.email,
    appPassword: account.appPassword,
    lastUid: Number(account.lastUid || 0),
    limit: Number(account.limit || 20)
  });
  const result = spawnSync(pythonExe(), [script], {
    input,
    encoding: "utf8",
    timeout: 120000
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || "IMAP poll failed");
  const payload = JSON.parse(result.stdout || "{}");
  const existing = new Set(db.messages.map((msg) => msg.externalId).filter(Boolean));
  const created = [];
  for (const item of payload.messages || []) {
    const externalId = `imap:${room.id}:${item.uid}`;
    account.lastUid = Math.max(Number(account.lastUid || 0), Number(item.uid || 0));
    if (existing.has(externalId)) continue;
    const parsed = parseRawEmail(room, item.uid, item);
    db.messages.unshift(parsed);
    created.push(parsed);
  }
  if (payload.lastUid) account.lastUid = Math.max(Number(account.lastUid || 0), Number(payload.lastUid));
  return created;
}

module.exports = { pollRoomImap, parseRawEmail };
