const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const { extractOtp, otpExpiresAt } = require("./otp");
const { makeId } = require("./store");

function accountEmail(room) {
  return room.inboundEmail;
}

async function parseRawEmail(room, uid, raw) {
  const parsed = await simpleParser(raw);
  const createdAt = parsed.date ? parsed.date.getTime() : Date.now();
  const subject = parsed.subject || "رسالة واردة";
  const body = parsed.text || parsed.html || "";
  const otp = extractOtp(`${subject}\n${body}`);
  return {
    id: makeId("msg"),
    roomId: room.id,
    type: "email",
    externalId: `imap:${room.id}:${uid}`,
    subject,
    body: String(body).slice(0, 4000),
    from: parsed.from?.text || room.inboundEmail,
    sourceEmail: accountEmail(room),
    otp,
    otpExpiresAt: otp ? otpExpiresAt(createdAt) : null,
    createdAt
  };
}

async function pollRoomImap(db, room, account) {
  if (!account.email || !account.appPassword) throw new Error("Missing IMAP email/app password.");

  const client = new ImapFlow({
    host: account.host || "imap.gmail.com",
    port: Number(account.port || 993),
    secure: account.secure !== false,
    auth: {
      user: account.email,
      pass: account.appPassword
    },
    logger: false
  });

  const created = [];
  const existing = new Set(db.messages.map((msg) => msg.externalId).filter(Boolean));

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const lastUid = Number(account.lastUid || 0);
      const range = lastUid ? `${lastUid + 1}:*` : "1:*";
      const messages = [];

      for await (const message of client.fetch(range, { uid: true, source: true }, { uid: true })) {
        messages.push(message);
      }

      const limit = Number(account.limit || 20);
      for (const item of messages.slice(-limit)) {
        const uid = Number(item.uid || 0);
        if (!uid) continue;
        account.lastUid = Math.max(Number(account.lastUid || 0), uid);
        const externalId = `imap:${room.id}:${uid}`;
        if (existing.has(externalId)) continue;
        const parsed = await parseRawEmail(room, uid, item.source);
        db.messages.unshift(parsed);
        created.push(parsed);
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }

  return created;
}

module.exports = { pollRoomImap, parseRawEmail };
