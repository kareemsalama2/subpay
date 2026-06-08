const { extractOtp, otpExpiresAt } = require("./otp");
const { makeId } = require("./store");

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function config() {
  return {
    clientId: process.env.GMAIL_CLIENT_ID || "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
    redirectUri: process.env.GMAIL_REDIRECT_URI || `${process.env.APP_BASE_URL || "http://localhost:8080"}/api/gmail/callback`
  };
}

function ensureConfigured() {
  const cfg = config();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error("Gmail OAuth is not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.");
  }
  return cfg;
}

function authUrl(roomId) {
  const cfg = ensureConfigured();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: roomId
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCode(code) {
  const cfg = ensureConfigured();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
      code
    })
  });
  if (!res.ok) throw new Error(`Gmail token exchange failed: ${await res.text()}`);
  const token = await res.json();
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + (token.expires_in || 3600) * 1000
  };
}

async function refreshAccessToken(account) {
  const cfg = ensureConfigured();
  if (!account.refreshToken) throw new Error("Missing Gmail refresh token.");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: "refresh_token",
      refresh_token: account.refreshToken
    })
  });
  if (!res.ok) throw new Error(`Gmail token refresh failed: ${await res.text()}`);
  const token = await res.json();
  account.accessToken = token.access_token;
  account.expiresAt = Date.now() + (token.expires_in || 3600) * 1000;
}

async function gmailFetch(account, path) {
  if (!account.accessToken || Date.now() > account.expiresAt - 60000) {
    await refreshAccessToken(account);
  }
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${account.accessToken}` }
  });
  if (!res.ok) throw new Error(`Gmail API failed: ${await res.text()}`);
  return res.json();
}

function decodeBase64Url(data = "") {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function flattenPayload(part, out = []) {
  if (!part) return out;
  if (part.body?.data) out.push({ mimeType: part.mimeType, text: decodeBase64Url(part.body.data) });
  if (part.parts) part.parts.forEach((child) => flattenPayload(child, out));
  return out;
}

function parseMessage(room, gmailMessage) {
  const headers = gmailMessage.payload?.headers || [];
  const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
  const parts = flattenPayload(gmailMessage.payload);
  const body = parts.find((p) => p.mimeType === "text/plain")?.text || parts[0]?.text || gmailMessage.snippet || "";
  const createdAt = Number(gmailMessage.internalDate || Date.now());
  const otp = extractOtp(`${getHeader("Subject")}\n${body}`);
  return {
    id: makeId("msg"),
    roomId: room.id,
    type: "email",
    externalId: gmailMessage.id,
    subject: getHeader("Subject") || "رسالة واردة",
    body,
    from: getHeader("From"),
    sourceEmail: room.inboundEmail,
    otp,
    otpExpiresAt: otp ? otpExpiresAt(createdAt) : null,
    createdAt
  };
}

async function pollRoomGmail(db, room, account) {
  const query = account.lastHistoryAt ? `newer:${Math.floor(account.lastHistoryAt / 1000)}` : "newer_than:7d";
  const list = await gmailFetch(account, `messages?q=${encodeURIComponent(query)}&maxResults=10`);
  const ids = (list.messages || []).map((msg) => msg.id);
  const existing = new Set(db.messages.map((msg) => msg.externalId).filter(Boolean));
  const created = [];
  for (const messageId of ids) {
    if (existing.has(messageId)) continue;
    const full = await gmailFetch(account, `messages/${messageId}?format=full`);
    const parsed = parseMessage(room, full);
    db.messages.unshift(parsed);
    created.push(parsed);
  }
  account.lastHistoryAt = Date.now();
  return created;
}

module.exports = { authUrl, exchangeCode, pollRoomGmail };
