const { parseRawEmail } = require("./lib/imap");

const room = { id: "room_test", inboundEmail: "test@gmail.com" };
const parsed = parseRawEmail(room, 10, {
  subject: "Login code",
  body: "Your verification code is 654321",
  from: "noreply@example.com",
  dateMs: Date.now()
});

if (parsed.otp !== "654321") {
  throw new Error("IMAP OTP parser failed");
}

console.log("IMAP parser test passed");
