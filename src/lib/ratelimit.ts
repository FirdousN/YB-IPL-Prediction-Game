// Simple in-memory rate limiting mechanism for OTPs.
// In a production environment, this should be replaced with Redis.

const store = new Map<string, { count: number; blockedUntil?: number; resetTime: number }>();

function getOrInitRecord(key: string, resetIntervalMs: number) {
  const now = Date.now();
  let record = store.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + resetIntervalMs };
    store.set(key, record);
  }

  return record;
}

export async function checkRateLimit(key: string) {
  // Example dummy generic check
  const record = getOrInitRecord(key, 60 * 1000); // 1 minute window
  if (record.count >= 10) {
    return { success: false, msg: "Rate limit exceeded" };
  }
  record.count++;
  return { success: true };
}

export async function checkOtpLimit(key: string) {
  const now = Date.now();
  const record = store.get(key);

  if (record && record.blockedUntil && now < record.blockedUntil) {
    return { success: false, msg: "Too many OTP requests. Please try again in 10 minutes." };
  }

  const activeRecord = getOrInitRecord(key, 60 * 1000); // 1 minute window
  if (activeRecord.count >= 4) {
    activeRecord.blockedUntil = now + 10 * 60 * 1000; // block for 10 minutes
    return { success: false, msg: "Too many OTP requests. Please try again in 10 minutes." };
  }
  
  activeRecord.count++;
  return { success: true };
}

export async function checkOtpVerifyBlock(key: string) {
  const now = Date.now();
  const record = store.get(key);

  if (record && record.blockedUntil && now < record.blockedUntil) {
    return { success: false, msg: "Account blocked for 15 minutes due to too many failed verify attempts." };
  }

  return { success: true };
}

export async function incrementOtpVerifyFailure(key: string) {
  const activeRecord = getOrInitRecord(key, 15 * 60 * 1000); // 15 mins window
  activeRecord.count++;

  if (activeRecord.count >= 5) {
    activeRecord.blockedUntil = Date.now() + 15 * 60 * 1000; // Block for 15 minutes on 5th failure
  }
}
