import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, familyName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      families: {
        create: { name: familyName },
      },
    },
  });

  // Account is created; the client signs the user in via next-auth's
  // Credentials flow (see signup/page.tsx) rather than this route setting
  // a session directly.
  return NextResponse.json({ ok: true });
}
