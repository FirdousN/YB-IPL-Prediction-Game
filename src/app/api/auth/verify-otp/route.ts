import { NextRequest, NextResponse } from "next/server";
import { signToken, JWTPayload } from "../../../../lib/jwt";
import { setSessionCookie } from "../../../../lib/session";
import { z } from 'zod';

const verifySchema = z.object({
    phone: z.string().min(10),
    otp: z.string().length(6),
    name: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const { default: dbConnect } = await import("../../../../lib/db");
        const { default: User } = await import("../../../../models/User");
        const { verifyOTP } = await import("../../../../lib/sendoxi");
        
        await dbConnect();
        const body = await req.json();
        const { phone, otp, name: providedName } = verifySchema.parse(body);

        // 1. Verify OTP
        const verifyResult = await verifyOTP(phone, otp);
        if (!verifyResult.success) {
            return NextResponse.json({ error: verifyResult.message || "Invalid OTP" }, { status: 400 });
        }

        // 2. Find or Create User
        let user = await User.findOne({ phone });

        if (!user) {
            // Check if this is a signup attempt (name provided or stored in OTP)
            const finalName = providedName || verifyResult.name || "Guest";
            user = await User.create({
                name: finalName,
                phone,
                role: 'user', // Default to user
            });
        }

        // 3. Create Session
        const payload: JWTPayload = {
            userId: user._id.toString(),
            role: user.role,
            name: user.name,
        };

        const token = await signToken(payload);

        // 4. Create Response and Set Cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
            },
            redirectTo: user.role === 'admin' ? '/admin' : '/site/matches'
        });

        // Set Cookie using our utility
        // Note: setSessionCookie uses cookies() from next/headers, which works in Route Handlers
        await setSessionCookie(token);

        return response;

    } catch (error: any) {
        console.error("Verify OTP Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
