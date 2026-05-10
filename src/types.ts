export type SourceType = "topic" | "pdf";
export type LearnerLevel = "beginner" | "intermediate" | "advanced";
export type TutorStyle = "calm" | "energetic" | "storyteller" | "exam-prep";
export type OutputFocus = "explain-simply" | "visualize-concept" | "summarize-revision";
export type LessonStatus =
  | "planned"
  | "image_generating"
  | "video_pending"
  | "video_generating"
  | "audio_pending"
  | "audio_generating"
  | "complete"
  | "failed";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export type Lesson = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceFilename: string | null;
  sourceText: string;
  sourceTextPreview: string;
  learnerLevel: LearnerLevel;
  tutorStyle: TutorStyle;
  outputFocus: OutputFocus;
  summary: string;
  simpleExplanation: string;
  keyTakeaways: string[];
  quizQuestions: QuizQuestion[];
  imagePrompt: string;
  videoPrompt: string;
  audioScript: string;
  imageUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  status: LessonStatus;
  errorMessage: string | null;
  createdAt: string;
};
