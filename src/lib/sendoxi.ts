import dbConnect from "./db";
import OtpStore from "../models/OtpStore";

interface OtpResponse {
    success: boolean;
    message?: string;
    refId?: string;
    name?: string;
}

// Generate secure 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(phone: string, name?: string): Promise<OtpResponse> {
    console.log('[SENDOXI] Starting sendOTP for:', phone);
    const apiKey = process.env.SENDOXI_API_KEY;
    const basicUser = process.env.SENDOXI_BASIC_AUTH_USERNAME;
    const basicPass = process.env.SENDOXI_BASIC_AUTH_PASSWORD;
    const senderId = process.env.SENDOXI_SENDER_ID;
    const entityId = process.env.SENDOXI_DLT_ENTITY_ID;
    const templateId = process.env.SENDOXI_OTP_TEMPLATE_ID;

    // 1. Generate local OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 Mins

    // 2. Store in MongoDB (OtpStore)
    console.log('[SENDOXI] Connecting to DB...');
    await dbConnect();
    console.log('[SENDOXI] DB connected, saving OTP...');
    await OtpStore.findOneAndUpdate(
        { phone },
        {
            $set: {
                otpCode: otp,
                expiresAt: otpExpires,
                tempName: name || "Guest"
            }
        },
        { upsert: true, new: true }
    );
    console.log('[SENDOXI] OTP saved successfully');

    console.log(`[OTP] Generated ${otp} for ${phone}`);

    // If no credentials, treat as dev mode and succeed locally
    if (!apiKey || !senderId || !templateId) {
        console.warn("Sendoxi keys missing - Mode: DEV_LOCAL_OTP");
        return { success: true, message: "OTP Generated (Dev Mode)", refId: "DEV-MOCK" };
    }

    // 3. Call Sendoxi API
    try {
        const authHeader = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString('base64')}`;
        const messageContent = `Your login OTP for SpinWheel is ${otp}. Yes Bharath Wedding Collections.`;

        const payload = {
            messageContent,
            senderID: senderId,
            templateID: templateId,
            destination: phone,
            entityId: entityId,
            countryCode: "91"
        };

        const res = await fetch("https://api.sendoxi.com/send/v1/single_sms_post", {
            method: "POST",
            headers: {
                "apiKey": apiKey,
                "Authorization": authHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (data.responseResult?.responseCode === 200 || data.status === 'success') {
            return { success: true, message: "OTP Sent", refId: data.data?.[0]?.msgID };
        } else {
            console.error("[SENDOXI FAIL]", data);
            return { success: false, message: "Failed to send OTP via Sendoxi" };
        }

    } catch (error) {
        console.error("Sendoxi API Error:", error);
        return { success: false, message: "SMS Service unavailable" };
    }
}

export async function verifyOTP(phone: string, otp: string): Promise<OtpResponse> {
    await dbConnect();
    
    // 1. Check OtpStore
    const storedOtp = await OtpStore.findOne({ phone });

    if (!storedOtp) {
        return { success: false, message: "OTP expired or not found" };
    }

    // 2. Validate
    if (storedOtp.otpCode !== otp) {
        return { success: false, message: "Invalid OTP" };
    }

    // 3. Cleanup and Return
    const name = storedOtp.tempName;
    await OtpStore.deleteOne({ _id: storedOtp._id });

    return { success: true, message: "Verified", name };
}
