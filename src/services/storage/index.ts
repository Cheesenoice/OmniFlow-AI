/**
 * Storage orchestrator: parse -> AI summarize -> embed -> store in Supabase.
 * Images: upload to Supabase Storage, skip AI pipeline (too slow).
 */
import { createServiceSupabase } from "@/lib/supabase/server";
import { parseFile } from "./parser";
import { smartGenerate } from "@/lib/ai/smart-generate";
import { embedTexts } from "@/services/rag/embeddings";
import { uploadImageToStorage } from "./upload-image";
export { uploadImageToStorage };

export interface StoredDoc {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  original_text: string;
  ai_summary: string;
  ai_json: Record<string, unknown>;
}

export async function processAndStoreFile(
  file: File,
  sessionId?: string,
): Promise<StoredDoc | null> {
  const supabase = createServiceSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const fileName = file.name;
  const fileSize = file.size;
  const isImage = file.type.startsWith("image/");
  const isDoc = fileName.endsWith(".docx") || fileName.endsWith(".doc");
  const isPdf = fileName.endsWith(".pdf");

  // Step 1: Image -> upload to Supabase Storage, skip AI
  if (isImage) {
    console.log(`[Storage] Uploading image: ${fileName}`);
    const url = await uploadImageToStorage(file);
    if (!url) {
      console.log(`[Storage] Image upload failed for ${fileName}`);
      return null;
    }
    const { data, error } = await db
      .from("stored_documents")
      .insert({
        file_name: fileName,
        file_type: "image",
        file_size: fileSize,
        session_id: sessionId || null,
        original_text: url,
        ai_summary: "",
        ai_json: { image_url: url },
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.log(`[Storage] DB insert failed: ${error.message}`);
      return null;
    }
    console.log(`[Storage] Stored image: ${data.id} - ${fileName} (${url})`);
    return data;
  }

  // Step 2: Docx/PDF -> parse text
  if (!isDoc && !isPdf) {
    console.log(`[Storage] Unsupported file type: ${fileName}`);
    return null;
  }

  console.log(`[Storage] Parsing document: ${fileName}`);
  const parsed = await parseFile(file);
  if (parsed.error) {
    console.log(`[Storage] Parse error: ${parsed.error}`);
  }
  const originalText = parsed.text;

  if (!originalText || originalText.length < 10) {
    console.log(
      `[Storage] No meaningful text extracted from ${fileName}, skipping.`,
    );
    return null;
  }

  // Step 3: AI summarize -> structured JSON
  console.log(
    `[Storage] AI summarizing: ${fileName} (${originalText.length} chars)...`,
  );
  const fileType = isPdf ? "pdf" : "docx";

  const summaryPrompt = `Analyze this ${fileType} content and return ONLY valid JSON:
{
  "summary": "A 2-3 sentence summary in Vietnamese describing what this document/image is about",
  "title": "A short descriptive title in Vietnamese",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "category": "product / marketing / internal / technical / other",
  "key_points": ["point 1", "point 2", "point 3"]
}

Content from file "${fileName}":
${originalText.slice(0, 4000)}`;

  let aiJson: Record<string, unknown> = {};
  let aiSummary = "";

  try {
    const raw = await smartGenerate({
      prompt: summaryPrompt,
      model: "gemini-flash-lite-latest",
      temperature: 0.3,
      maxOutputTokens: 2048,
    });
    const jsonStr = raw.replace(/```json\s*|```/g, "").trim();
    try {
      aiJson = JSON.parse(jsonStr);
      aiSummary = (aiJson.summary as string) || (aiJson.title as string) || "";
    } catch {
      aiSummary = raw.slice(0, 500);
      aiJson = { summary: aiSummary, raw_output: raw };
    }
  } catch (err) {
    console.log(`[Storage] AI summary failed: ${err}`);
    aiSummary = originalText.slice(0, 500);
    aiJson = { summary: aiSummary };
  }

  // Step 4: Create embedding
  let embedding: number[] | null = null;
  try {
    const textToEmbed = `${aiSummary}\n${originalText.slice(0, 2000)}`;
    const embResult = await embedTexts([textToEmbed]);
    if (embResult.length > 0) embedding = embResult[0].embedding;
    console.log(
      `[Storage] Embedding created: ${embedding ? embedding.length + "d" : "FAILED"}`,
    );
  } catch (err) {
    console.log(`[Storage] Embedding failed: ${err}`);
  }

  // Step 5: Store in Supabase
  const { data, error } = await db
    .from("stored_documents")
    .insert({
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      session_id: sessionId || null,
      original_text: originalText,
      ai_summary: aiSummary,
      ai_json: aiJson,
      embedding,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    console.log(`[Storage] DB insert failed: ${error.message}`);
    return null;
  }

  console.log(`[Storage] Stored: ${data.id} - ${fileName}`);
  return data;
}

export async function processAndStoreFiles(
  files: File[],
): Promise<StoredDoc[]> {
  const sessionId = crypto.randomUUID();
  const results: StoredDoc[] = [];
  for (const file of files) {
    const doc = await processAndStoreFile(file, sessionId);
    if (doc) results.push(doc);
  }
  return results;
}
