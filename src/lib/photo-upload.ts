import { put } from "@vercel/blob";
import sharp from "sharp";

const MAX_PHOTO_WIDTH = 1600;

/**
 * Processes and uploads a tooth photo, returning its public URL. Returns
 * null (never throws) if Blob storage isn't configured or the upload fails
 * for an infra reason — the tooth post itself should still save without a
 * photo rather than fail the whole submission.
 */
export async function uploadToothPhoto(
  file: File,
  toothPostId: string
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      "BLOB_READ_WRITE_TOKEN is not set — skipping tooth photo upload"
    );
    return null;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const processed = await sharp(Buffer.from(arrayBuffer))
      // Auto-orient from the EXIF orientation tag before it's stripped,
      // otherwise photos taken on their side/upside-down would render wrong.
      .rotate()
      .resize({ width: MAX_PHOTO_WIDTH, withoutEnlargement: true })
      // Re-encoding drops all metadata (EXIF/GPS included) by default —
      // sharp only keeps it if .withMetadata() is called, which we don't.
      .jpeg({ quality: 82 })
      .toBuffer();

    const blob = await put(`tooth-photos/${toothPostId}.jpg`, processed, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });

    return blob.url;
  } catch (error) {
    console.error("Tooth photo upload failed", error);
    return null;
  }
}
