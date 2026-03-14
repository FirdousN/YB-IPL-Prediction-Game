import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import User from '@/src/models/User';
import { verifyOtp } from '@/src/services/otpService';
import { signSession } from '@/src/lib/auth';
import { z } from 'zod';
import { cookies } from 'next/headers';

const verifySchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
  name: z.string().optional(), // Provided if registering
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { phone, otp, name } = verifySchema.parse(body);

    const isValid = await verifyOtp(phone, otp);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check if user exists
    let user = await User.findOne({ phone });

    // Handle Registration (if name is provided and user doesn't exist)
    if (!user && name) {
      user = await User.create({ name, phone, role: 'USER' });
    } else if (!user && !name) {
      return NextResponse.json({ error: 'User not found and no name provided for registration.' }, { status: 400 });
    }

    // Create Session
    const sessionPayload = {
      userId: user!._id.toString(),
      role: user!.role,
      name: user!.name,
    };

    const token = await signSession(sessionPayload);

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      message: 'Login successful',
      user: { id: user!._id, name: user!.name, role: user!.role }
    });

  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
  }
}
