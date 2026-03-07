import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./drizzle/db";
import { type JsonValue, schema } from "./drizzle/schema";

export const database = db;
export const tables = schema;

export async function getJsonColumnFromTable(
  tableName:
    | "changelog"
    | "feature"
    | "feedback"
    | "initiative_canvas"
    | "initiative_page"
    | "initiative_update"
    | "template",
  _column: "content",
  id: string
): Promise<JsonValue | null> {
  switch (tableName) {
    case "changelog": {
      const result = await db
        .select({ value: tables.changelog.content })
        .from(tables.changelog)
        .where(eq(tables.changelog.id, id))
        .limit(1);
      return result[0]?.value ?? null;
    }
    case "feature": {
      const result = await db
        .select({ value: tables.feature.content })
        .from(tables.feature)
        .where(eq(tables.feature.id, id))
        .limit(1);
      return result[0]?.value ?? null;
    }
    case "feedback": {
      const result = await db
        .select({ value: tables.feedback.content })
        .from(tables.feedback)
        .where(eq(tables.feedback.id, id))
        .limit(1);
      return result[0]?.value ?? null;
    }
    case "initiative_canvas": {
      const result = await db
        .select({ value: tables.initiativeCanvas.content })
        .from(tables.initiativeCanvas)
        .where(eq(tables.initiativeCanvas.id, id))
        .limit(1);
      return result[0]?.value ?? null;
    }
    case "initiative_page": {
      const result = await db
        .select({ value: tables.initiativePage.content })
        .from(tables.initiativePage)
        .where(eq(tables.initiativePage.id, id))
        .limit(1);
      return result[0]?.value ?? null;
    }
    case "initiative_update": {
      const result = await db
        .select({ value: tables.initiativeUpdate.content })
        .from(tables.initiativeUpdate)
        .where(eq(tables.initiativeUpdate.id, id))
        .limit(1);
      return result[0]?.value ?? null;
    }
    case "template": {
      const result = await db
        .select({ value: tables.template.content })
        .from(tables.template)
        .where(eq(tables.template.id, id))
        .limit(1);
      return result[0]?.value ?? null;
    }
    default: {
      throw new Error(`Unsupported table: ${tableName}`);
    }
  }
}
