import type { LearnerLevel, Lesson, OutputFocus, SourceType, TutorStyle } from "../types";

export type GenerateLessonInput = {
  sourceType: SourceType;
  topic: string;
  sourceFile: File | null;
  learnerLevel: LearnerLevel;
  tutorStyle: TutorStyle;
  outputFocus: OutputFocus;
};

export async function createLesson(input: GenerateLessonInput) {
  const formData = new FormData();
  formData.set("sourceType", input.sourceType);
  formData.set("learnerLevel", input.learnerLevel);
  formData.set("tutorStyle", input.tutorStyle);
  formData.set("outputFocus", input.outputFocus);

  if (input.sourceType === "topic") {
    formData.set("topic", input.topic);
  }

  if (input.sourceType === "pdf" && input.sourceFile) {
    formData.set("sourceFile", input.sourceFile);
  }

  const response = await fetch("/api/lessons", {
    method: "POST",
    body: formData
  });
  const payload = await readJson<{ lesson?: Lesson; error?: string }>(response);

  if (!response.ok) {
    const error = new Error(payload.error ?? "Could not generate lesson.") as Error & {
      lesson?: Lesson;
    };
    error.lesson = payload.lesson;
    throw error;
  }

  if (!payload.lesson) {
    throw new Error("Lesson response was empty.");
  }

  return payload.lesson;
}

export async function generateLessonImage(id: string) {
  return runLessonStep(`/api/lesson-image?id=${encodeURIComponent(id)}`, "Could not generate lesson image.");
}

export async function generateLessonVideo(id: string) {
  return runLessonStep(`/api/lesson-video?id=${encodeURIComponent(id)}`, "Could not generate lesson video.");
}

export async function fetchLessons() {
  const response = await fetch("/api/lessons");
  const payload = await readJson<{ lessons?: Lesson[]; error?: string }>(response);

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load lessons.");
  }

  return payload.lessons ?? [];
}

export async function fetchLesson(id: string) {
  const response = await fetch(`/api/lesson?id=${encodeURIComponent(id)}`);
  const payload = await readJson<{ lesson?: Lesson; error?: string }>(response);

  if (!response.ok || !payload.lesson) {
    throw new Error(payload.error ?? "Could not load lesson.");
  }

  return payload.lesson;
}

async function runLessonStep(url: string, fallbackMessage: string) {
  const response = await fetch(url, { method: "POST" });
  const payload = await readJson<{ lesson?: Lesson | null; error?: string }>(response);

  if (!response.ok || !payload.lesson) {
    const error = new Error(payload.error ?? fallbackMessage) as Error & {
      lesson?: Lesson | null;
    };
    error.lesson = payload.lesson;
    throw error;
  }

  return payload.lesson;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {
      error: response.ok ? "The server returned an empty response." : `Request failed with status ${response.status}.`
    } as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      error: response.ok ? "The server returned invalid JSON." : text
    } as T;
  }
}
