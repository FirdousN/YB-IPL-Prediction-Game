import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import User from '@/src/models/User';
import { sendOtp } from '@/src/services/otpService';
import { z } from 'zod';

const loginSchema = z.object({
  phone: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { phone } = loginSchema.parse(body);

    const user = await User.findOne({ phone });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register.' },
        { status: 404 }
      );
    }

    const otpSent = await sendOtp(phone);
    if (!otpSent) {
      return NextResponse.json(
        { error: 'Failed to send OTP.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}
