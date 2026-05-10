import { mapLesson, supabase } from "./supabase.js";
import type { DbLesson } from "./types.js";

type NewLesson = Omit<DbLesson, "id" | "created_at" | "image_url" | "video_url" | "audio_url" | "error_message"> & {
  image_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  error_message?: string | null;
};

type LessonUpdate = Partial<
  Pick<DbLesson, "image_url" | "video_url" | "audio_url" | "status" | "error_message">
>;

export async function listLessons() {
  const { data, error } = await supabase()
    .from("lessons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbLesson[]).map(mapLesson);
}

export async function getLesson(id: string) {
  const { data, error } = await supabase().from("lessons").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  return mapLesson(data as DbLesson);
}

export async function insertLesson(input: NewLesson) {
  const { data, error } = await supabase().from("lessons").insert(input).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return mapLesson(data as DbLesson);
}

export async function updateLesson(id: string, input: LessonUpdate) {
  const { data, error } = await supabase().from("lessons").update(input).eq("id", id).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return mapLesson(data as DbLesson);
}
