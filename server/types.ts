export type SourceType = "topic" | "pdf";
export type LearnerLevel = "beginner" | "intermediate" | "advanced";
export type TutorStyle = "calm" | "energetic" | "storyteller" | "exam-prep";
export type OutputFocus = "explain-simply" | "visualize-concept" | "summarize-revision";
export type LessonStatus =
  | "planned"
  | "image_generating"
  | "video_pending"
  | "video_generating"
  | "complete"
  | "failed";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export type LessonPlan = {
  title: string;
  summary: string;
  simpleExplanation: string;
  visualMetaphor: string;
  imagePrompt: string;
  videoPrompt: string;
  keyTakeaways: string[];
  quizQuestions: QuizQuestion[];
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
  imageUrl: string | null;
  videoUrl: string | null;
  status: LessonStatus;
  errorMessage: string | null;
  createdAt: string;
};

export type DbLesson = {
  id: string;
  title: string;
  source_type: SourceType;
  source_filename: string | null;
  source_text: string;
  source_text_preview: string;
  learner_level: LearnerLevel;
  tutor_style: TutorStyle;
  output_focus: OutputFocus;
  summary: string;
  simple_explanation: string;
  key_takeaways: string[];
  quiz_questions: QuizQuestion[];
  image_prompt: string;
  video_prompt: string;
  image_url: string | null;
  video_url: string | null;
  status: LessonStatus;
  error_message: string | null;
  created_at: string;
};
