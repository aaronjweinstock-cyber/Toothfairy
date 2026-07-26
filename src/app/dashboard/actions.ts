"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { uploadToothPhoto } from "@/lib/photo-upload";
import { childSchema, toothPostSchema, inviteSchema } from "@/lib/validation";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB

async function requireOwnedFamily(familyId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const family = await db.family.findFirst({
    where: { id: familyId, ownerId: session.user.id },
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

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo is too large (max 8MB)");
  }

  const toothPost = await db.toothPost.create({
    data: {
      childId: child.id,
      note: parsed.data.note,
    },
  });

  if (photo instanceof File && photo.size > 0) {
    const photoUrl = await uploadToothPhoto(photo, toothPost.id);
    if (photoUrl) {
      await db.toothPost.update({
        where: { id: toothPost.id },
        data: { photoUrl },
      });
    }
  }

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
