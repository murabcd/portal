import { openai } from "@ai-sdk/openai";
import { database, tables } from "@repo/backend/database";
import type { JsonValue } from "@repo/backend/drizzle/schema";
import { textToContent } from "@repo/editor/lib/tiptap";
import { experimental_transcribe as transcribe } from "ai";
import { eq } from "drizzle-orm";

export const maxDuration = 300;
export const revalidate = 0;
export const dynamic = "force-dynamic";

type InsertPayload = {
  type: "INSERT";
  table: string;
  schema: string;
  record: typeof tables.feedback.$inferSelect;
  old_record: null;
};

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json()) as InsertPayload;

  if (!(body.record.videoUrl || body.record.audioUrl)) {
    return new Response("No video or audio to transcribe", { status: 401 });
  }

  const transcript = await transcribe({
    model: openai.transcription("whisper-1") as unknown as Parameters<
      typeof transcribe
    >[0]["model"],
    audio: new URL(body.record.videoUrl ?? (body.record.audioUrl as string)),
  });

  await database
    .update(tables.feedback)
    .set({
      transcript: transcript.text,
      content: textToContent(transcript.text ?? "") as JsonValue,
      transcribedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tables.feedback.id, body.record.id));

  return new Response("Success", { status: 200 });
};
