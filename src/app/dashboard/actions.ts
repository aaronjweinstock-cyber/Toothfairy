"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, destroySession } from "@/lib/auth";
import { childSchema, toothPostSchema, inviteSchema } from "@/lib/validation";

async function requireOwnedFamily(familyId: string) {
  const user = await requireUser();
  const family = await db.family.findFirst({
    where: { id: familyId, ownerId: user.id },
  });
  if (!family) {
    throw new Error("Family not found");
  }
  return family;
}

export async function addChild(familyId: string, formData: FormData) {
  await requireOwnedFamily(familyId);

  const parsed = childSchema.safeParse({
    name: formData.get("name"),
    birthdate: formData.get("birthdate") || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await db.child.create({
    data: {
      familyId,
      name: parsed.data.name,
      birthdate: parsed.data.birthdate
        ? new Date(parsed.data.birthdate)
        : undefined,
    },
  });

  revalidatePath("/dashboard");
}

export async function addToothPost(familyId: string, formData: FormData) {
  await requireOwnedFamily(familyId);

  const parsed = toothPostSchema.safeParse({
    childId: formData.get("childId"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const child = await db.child.findFirst({
    where: { id: parsed.data.childId, familyId },
  });
  if (!child) {
    throw new Error("Child not found");
  }

  await db.toothPost.create({
    data: {
      childId: child.id,
      note: parsed.data.note,
    },
  });

  revalidatePath("/dashboard");
}

export async function createInvite(familyId: string, formData: FormData) {
  await requireOwnedFamily(familyId);

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await db.invite.create({
    data: {
      familyId,
      email: parsed.data.email,
    },
  });

  revalidatePath("/dashboard");
}

export async function revokeInvite(familyId: string, inviteId: string) {
  await requireOwnedFamily(familyId);

  await db.invite.updateMany({
    where: { id: inviteId, familyId },
    data: { status: "REVOKED" },
  });

  revalidatePath("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
