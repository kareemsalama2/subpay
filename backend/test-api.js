const { spawn } = require("child_process");

const BASE = "http://localhost:8080";

async function waitForHealth() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch (_) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error("Backend did not start");
}

async function json(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} failed: ${JSON.stringify(data)}`);
  return data;
}

async function run() {
  const child = spawn(process.execPath, ["server.js"], { cwd: __dirname, stdio: "pipe" });
  try {
    await waitForHealth();
    const register = await json("POST", "/api/auth/register", {
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      phone: "010"
    });
    const created = await json("POST", "/api/rooms", {
      name: "Test Room",
      inboundEmail: "test-room@gmail.com",
      subscriptionEmail: "shared@gmail.com",
      monthlyPrice: 25
    }, register.token);
    await json("POST", `/api/rooms/${created.room.id}/messages`, {
      subject: "OTP",
      body: "Your code is 123456",
      from: "noreply@example.com"
    }, register.token);
    const messages = await json("GET", `/api/rooms/${created.room.id}/messages`, null, register.token);
    if (!messages.messages[0]?.otp) throw new Error("OTP was not extracted");
    console.log("API smoke test passed");
  } finally {
    child.kill();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
