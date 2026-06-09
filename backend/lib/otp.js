const OTP_TTL_MS = 5 * 60 * 1000;

function otpTtlMs(minutes) {
  const value = Number(minutes || 5);
  const safeMinutes = Number.isFinite(value) ? Math.min(60, Math.max(1, value)) : 5;
  return safeMinutes * 60 * 1000;
}

function extractOtp(text) {
  const value = String(text || "");
  const keywordMatch = value.match(/(?:otp|code|passcode|verification|security|login|كود|رمز|تحقق|التأكيد)[^\d]{0,60}(\d{6})\b/i);
  if (keywordMatch) return keywordMatch[1];

  const candidates = value.match(/\b\d{6}\b/g) || [];
  return candidates[0] || null;
}

function otpExpiresAt(createdAt = Date.now(), minutes = 5) {
  return createdAt + otpTtlMs(minutes);
}

module.exports = { OTP_TTL_MS, extractOtp, otpExpiresAt, otpTtlMs };
