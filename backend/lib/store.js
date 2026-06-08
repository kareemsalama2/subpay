const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function makeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function roomCode(name = "ROOM") {
  const letters = String(name).replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "ROM";
  return `${letters}${Math.floor(100 + Math.random() * 900)}`;
}

function initialDb() {
  const now = Date.now();
  const userId = makeId("usr");
  const chatRoomId = makeId("room");
  return {
    users: [
      {
        id: userId,
        name: "Demo Member",
        email: "member@example.com",
        phone: "01000000000",
        avatar: "DM",
        role: "member",
        password: "",
        language: "ar",
        createdAt: now
      }
    ],
    sessions: [],
    rooms: [
      {
        id: chatRoomId,
        ownerId: userId,
        name: "ChatGPT Room",
        code: "GPT728",
        inviteLink: "subpay://join/GPT728",
        inboundEmail: "add-gmail-from-admin-panel@example.com",
        subscriptionEmail: "shared-account@example.com",
        monthlyPrice: 50,
        password: "CHANGE_FROM_ADMIN_PANEL",
        createdAt: now
      }
    ],
    memberships: [
      { id: makeId("mem"), roomId: chatRoomId, userId, role: "member", paidUntil: "2026-06-30", createdAt: now }
    ],
    messages: [],
    payments: [],
    gmailAccounts: [],
    imapAccounts: []
  };
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) writeDb(initialDb());
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8").replace(/^\uFEFF/, ""));
}

function writeDb(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function mutate(mutator) {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
}

module.exports = { readDb, writeDb, mutate, makeId, roomCode };
