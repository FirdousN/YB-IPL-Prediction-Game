import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import User from '@/src/models/User';
import { sendOtp } from '@/src/services/otpService';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10), // Basic phone validation
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, phone } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists. Please login.' },
        { status: 409 }
      );
    }

    // Send OTP
    const otpSent = await sendOtp(phone);
    if (!otpSent) {
      return NextResponse.json(
        { error: 'Failed to send OTP.' },
        { status: 500 }
      );
    }

    // Return success but don't create user yet. User is created after OTP verification.
    // However, we need to store the name somewhere.
    // For simplicity: Create the user now but mark as 'unverified'? or store in OTP cache?
    // Let's adopt a "Create on Verify" strategy or "Update on Verify".
    // Or just store the name in the client state and send it again with verify?
    // Better: Upsert the user with a flag?

    // Simplest for this flow: 
    // Just send OTP. When verifying, if user doesn't exist, create it using the name passed then.
    // BUT the verify step usually just takes phone + otp.
    // So let's store the pending user data in the DB or reuse the User model with `isVerified` flag?
    // The prompt's constraints were simple. Let's stick to "User Creation during Verify" if possible 
    // OR "Create user now with inactive status".

    // Let's go with: Create User now. 
    // Actually, if we create user now, login flow might be confused.
    // Let's just return success. The frontend will pass name + phone + otp to /verify for new users?
    // Standard flow:
    // Register: Phone + Name -> Send OTP. 
    // Verify: Phone + OTP + Name (if registering) -> Create User + Token.

    return NextResponse.json({ message: 'OTP sent successfully' });

  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
  }
}
