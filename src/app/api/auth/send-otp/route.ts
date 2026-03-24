import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '../../../../lib/sendoxi';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sendOtpSchema = z.object({
  phone: z.string().min(10),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name } = sendOtpSchema.parse(body);

    const result = await sendOTP(phone, name);

    if (result.success) {
      return NextResponse.json({ 
        message: result.message || 'OTP sent successfully',
        refId: result.refId 
      });
    } else {
      return NextResponse.json(
        { error: result.message || 'Failed to send OTP' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API_AUTH_SEND_OTP_ERROR]:", error);
    return NextResponse.json(
      { error: error.message || 'Invalid request' },
      { status: 400 }
    );
  }
}
