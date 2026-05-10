import { createServiceSupabase } from "@/lib/supabase/server";

/**
 * Upload a raw image file to Supabase Storage and return its public URL.
 */
export async function uploadImageToStorage(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;

  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const bucket = "images";
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buffer = await file.arrayBuffer();

  const { error } = await db.storage.from(bucket).upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.log(`[Storage] Image upload failed: ${error.message}`);
    if (
      error.message?.includes("not found") ||
      error.message?.includes("exist")
    ) {
      try {
        await db.storage.createBucket(bucket, { public: true });
      } catch {
        /* ignore */
      }
      const { error: retryErr } = await db.storage
        .from(bucket)
        .upload(fileName, buffer, { contentType: file.type, upsert: false });
      if (retryErr) {
        console.log(`[Storage] Retry failed: ${retryErr.message}`);
        return null;
      }
    } else {
      return null;
    }
  }

  const { data: urlData } = db.storage.from(bucket).getPublicUrl(fileName);
  return urlData?.publicUrl || null;
}
