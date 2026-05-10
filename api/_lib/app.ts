import { Hono } from "hono";
import { cors } from "hono/cors";
import { createLessonPlan } from "./lessonPlanner.js";
import { extractPdfText, normalizeSourceText, previewText } from "./pdf.js";
import { generateLessonImage, generateLessonVideo } from "./runway.js";
import { getLesson, insertLesson, listLessons, updateLesson } from "./store.js";
import type { LearnerLevel, OutputFocus, SourceType, TutorStyle } from "./types.js";

export const app = new Hono();

app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/lessons", async (c) => {
  try {
    const lessons = await listLessons();
    return c.json({ lessons });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load lessons.";
    return c.json({ error: message }, 500);
  }
});

app.get("/api/lessons/:id", async (c) => {
  try {
    const lesson = await getLesson(c.req.param("id"));
    if (!lesson) {
      return c.json({ error: "Lesson not found." }, 404);
    }

    return c.json({ lesson });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load lesson.";
    return c.json({ error: message }, 500);
  }
});

app.get("/api/lesson", async (c) => {
  const id = c.req.query("id");

  if (!id) {
    return c.json({ error: "Missing lesson id." }, 400);
  }

  try {
    const lesson = await getLesson(id);
    if (!lesson) {
      return c.json({ error: "Lesson not found." }, 404);
    }

    return c.json({ lesson });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load lesson.";
    return c.json({ error: message }, 500);
  }
});

app.post("/api/lessons", async (c) => {
  try {
    const body = await c.req.parseBody();
    const sourceType = readEnum<SourceType>(body.sourceType, ["topic", "pdf"], "source type");
    const learnerLevel = readEnum<LearnerLevel>(
      body.learnerLevel,
      ["beginner", "intermediate", "advanced"],
      "learner level"
    );
    const tutorStyle = readEnum<TutorStyle>(
      body.tutorStyle,
      ["calm", "energetic", "storyteller", "exam-prep"],
      "tutor style"
    );
    const outputFocus = readEnum<OutputFocus>(
      body.outputFocus,
      ["explain-simply", "visualize-concept", "summarize-revision"],
      "output focus"
    );

    const file = body.sourceFile instanceof File ? body.sourceFile : null;
    const topicText = typeof body.topic === "string" ? normalizeSourceText(body.topic) : "";

    if (sourceType === "topic" && !topicText) {
      return c.json({ error: "Enter a topic before generating a lesson." }, 400);
    }

    if (sourceType === "pdf" && !file) {
      return c.json({ error: "Upload a PDF before generating a lesson." }, 400);
    }

    const sourceText = sourceType === "pdf" && file ? await extractPdfText(file) : topicText;
    const sourceFilename = sourceType === "pdf" && file ? file.name : null;
    const lessonPlan = await createLessonPlan({
      sourceText,
      learnerLevel,
      tutorStyle,
      outputFocus
    });

    const lesson = await insertLesson({
      title: lessonPlan.title,
      source_type: sourceType,
      source_filename: sourceFilename,
      source_text: sourceText,
      source_text_preview: previewText(sourceText),
      learner_level: learnerLevel,
      tutor_style: tutorStyle,
      output_focus: outputFocus,
      summary: lessonPlan.summary,
      simple_explanation: lessonPlan.simpleExplanation,
      key_takeaways: lessonPlan.keyTakeaways,
      quiz_questions: lessonPlan.quizQuestions,
      image_prompt: lessonPlan.imagePrompt,
      video_prompt: lessonPlan.videoPrompt,
      status: "planned"
    });

    return c.json({ lesson }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create lesson plan.";
    return c.json({ error: message }, 400);
  }
});

app.post("/api/lessons/:id/image", async (c) => {
  const id = c.req.param("id");

  try {
    const lesson = await getLesson(id);

    if (!lesson) {
      return c.json({ error: "Lesson not found." }, 404);
    }

    await updateLesson(id, {
      status: "image_generating",
      error_message: null
    });

    const imageUrl = await generateLessonImage(lesson.imagePrompt);
    const updated = await updateLesson(id, {
      image_url: imageUrl,
      status: "video_pending",
      error_message: null
    });

    return c.json({ lesson: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed.";
    const failed = await updateLesson(id, {
      status: "failed",
      error_message: message
    }).catch(() => null);

    return c.json({ error: message, lesson: failed }, 502);
  }
});

app.post("/api/lesson-image", async (c) => {
  const id = c.req.query("id");

  if (!id) {
    return c.json({ error: "Missing lesson id." }, 400);
  }

  const image = await app.request(`/api/lessons/${id}/image`, { method: "POST" });
  return c.json(await image.json(), image.ok ? 200 : image.status >= 500 ? 502 : 400);
});

app.post("/api/lessons/:id/video", async (c) => {
  const id = c.req.param("id");

  try {
    const lesson = await getLesson(id);

    if (!lesson) {
      return c.json({ error: "Lesson not found." }, 404);
    }

    if (!lesson.imageUrl) {
      return c.json({ error: "Generate an image before generating video." }, 400);
    }

    await updateLesson(id, {
      status: "video_generating",
      error_message: null
    });

    const media = await generateLessonVideo(lesson.imageUrl, lesson.videoPrompt);
    const updated = await updateLesson(id, {
      video_url: media.videoUrl,
      status: "complete",
      error_message: null
    });

    return c.json({ lesson: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video generation failed.";
    const failed = await updateLesson(id, {
      status: "failed",
      error_message: message
    }).catch(() => null);

    return c.json({ error: message, lesson: failed }, 502);
  }
});

app.post("/api/lesson-video", async (c) => {
  const id = c.req.query("id");

  if (!id) {
    return c.json({ error: "Missing lesson id." }, 400);
  }

  const video = await app.request(`/api/lessons/${id}/video`, { method: "POST" });
  return c.json(await video.json(), video.ok ? 200 : video.status >= 500 ? 502 : 400);
});

app.post("/api/lessons/generate", async (c) => {
  const planned = await app.request("/api/lessons", {
    method: "POST",
    body: await c.req.formData()
  });
  const payload = (await planned.json()) as { lesson?: { id: string }; error?: string };

  if (!planned.ok || !payload.lesson) {
    return c.json(payload, planned.status >= 500 ? 500 : 400);
  }

  const image = await app.request(`/api/lesson-image?id=${payload.lesson.id}`, { method: "POST" });

  if (!image.ok) {
    return c.json(await image.json(), image.status >= 500 ? 502 : 400);
  }

  const video = await app.request(`/api/lesson-video?id=${payload.lesson.id}`, { method: "POST" });
  return c.json(await video.json(), video.ok ? 200 : video.status >= 500 ? 502 : 400);
});

function readEnum<T extends string>(value: FormDataEntryValue | undefined, allowed: T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`Invalid ${label}.`);
  }

  return value as T;
}
