// TypeScript Service
import OtpStore from "@/src/models/OtpStore";

// Generate secure 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}



export async function sendOtp(phone: string, name?: string): Promise<boolean> {
  const apiKey = process.env.SENDOXI_API_KEY;
  const basicUser = process.env.SENDOXI_BASIC_AUTH_USERNAME;
  const basicPass = process.env.SENDOXI_BASIC_AUTH_PASSWORD;
  const senderId = process.env.SENDOXI_SENDER_ID;
  const entityId = process.env.SENDOXI_DLT_ENTITY_ID;
  const templateId = process.env.SENDOXI_OTP_TEMPLATE_ID;

  if (!apiKey || !senderId || !templateId) {
    console.warn("Missing Sendoxi Credentials in .env");
    // Dev Fallback
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV_FALLBACK] Missing keys. Simulating OTP for ${phone}`);
      const devOtp = generateOTP();
      await saveOtpToDb(phone, devOtp, name);
      console.log(`[DEV] OTP is ${devOtp}`);
      return true;
    }
  }

  // 1. Generate OTP
  const otp = generateOTP();

  // 2. Store in MongoDB
  await saveOtpToDb(phone, otp, name);

  console.log(`[SENDOXI] Sending OTP to ${phone}`);

  // 3. Call Sendoxi API
  try {
    const messageContent = `Your login OTP for SpinWheel is ${otp}. Yes Bharath Wedding Collections.`;

    // Construct Auth Header if Basic Auth env vars are present
    let authHeader = "";
    if (basicUser && basicPass) {
      authHeader = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString('base64')}`;
    }

    const payload = {
      messageContent,
      senderID: senderId,
      templateID: templateId,
      destination: phone,
      entityId: entityId,
      countryCode: "91"
    };

    const headers: HeadersInit = {
      "apiKey": apiKey!,
      "Content-Type": "application/json"
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch("https://api.sendoxi.com/send/v1/single_sms_post", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    // Handle non-JSON responses (like 401 Unauthorized HTML or empty body)
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[SENDOXI] Failed to parse JSON:", text);
      return false;
    }

    console.log("[SENDOXI RESPONSE]", JSON.stringify(data));

    if (data.status === 'success' || data.responseResult?.responseCode === 200) {
      return true;
    } else {
      console.error("Sendoxi Failed:", data);
      return false;
    }

  } catch (error) {
    console.error("Sendoxi API Error:", error);
    return false;
  }
}

async function saveOtpToDb(phone: string, otp: string, name?: string) {
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 Mins

  await OtpStore.findOneAndUpdate(
    { phone },
    {
      $set: {
        otpCode: otp,
        expiresAt: otpExpires,
        tempName: name
      }
    },
    { upsert: true, new: true }
  );
  // console.log(`[DB] Saved OTP for ${phone}: ${otp}`);
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  // 1. Check OtpStore
  const storedOtp = await OtpStore.findOne({ phone });

  if (!storedOtp) {
    console.log(`[VERIFY] No OTP found for: ${phone}`);
    return false;
  }

  // 2. Validate
  if (storedOtp.otpCode !== otp) {
    // console.log(`[VERIFY] Mismatch`);
    return false;
  }

  // 3. Cleanup
  await OtpStore.deleteOne({ _id: storedOtp._id });
  return true;
}
