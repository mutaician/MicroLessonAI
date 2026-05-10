import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import type { DbLesson, Lesson } from "./types.js";

export const supabase = () =>
  createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

export const mapLesson = (lesson: DbLesson): Lesson => ({
  id: lesson.id,
  title: lesson.title,
  sourceType: lesson.source_type,
  sourceFilename: lesson.source_filename,
  sourceText: lesson.source_text,
  sourceTextPreview: lesson.source_text_preview,
  learnerLevel: lesson.learner_level,
  tutorStyle: lesson.tutor_style,
  outputFocus: lesson.output_focus,
  summary: lesson.summary,
  simpleExplanation: lesson.simple_explanation,
  keyTakeaways: lesson.key_takeaways,
  quizQuestions: lesson.quiz_questions,
  imagePrompt: lesson.image_prompt,
  videoPrompt: lesson.video_prompt,
  imageUrl: lesson.image_url,
  videoUrl: lesson.video_url,
  status: lesson.status,
  errorMessage: lesson.error_message,
  createdAt: lesson.created_at
});
