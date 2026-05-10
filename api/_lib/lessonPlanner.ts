import OpenAI from "openai";
import { z } from "zod";
import { env } from "./env.js";
import type { LearnerLevel, LessonPlan, OutputFocus, TutorStyle } from "./types.js";

const quizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(1),
  answer: z.string().min(1)
});

const lessonPlanZodSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  simpleExplanation: z.string().min(1),
  visualMetaphor: z.string().min(1),
  imagePrompt: z.string().min(1),
  videoPrompt: z.string().min(1),
  audioScript: z.string().min(1),
  keyTakeaways: z.array(z.string().min(1)).min(1),
  quizQuestions: z.array(quizQuestionSchema).min(1)
});

const lessonPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    simpleExplanation: { type: "string" },
    visualMetaphor: { type: "string" },
    imagePrompt: { type: "string" },
    videoPrompt: { type: "string" },
    audioScript: { type: "string" },
    keyTakeaways: {
      type: "array",
      items: { type: "string" }
    },
    quizQuestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" }
          },
          answer: { type: "string" }
        },
        required: ["question", "options", "answer"]
      }
    }
  },
  required: [
    "title",
    "summary",
    "simpleExplanation",
    "visualMetaphor",
    "imagePrompt",
    "videoPrompt",
    "audioScript",
    "keyTakeaways",
    "quizQuestions"
  ]
} as const;

type PlannerInput = {
  sourceText: string;
  learnerLevel: LearnerLevel;
  tutorStyle: TutorStyle;
  outputFocus: OutputFocus;
};

const styleInstruction: Record<TutorStyle, string> = {
  calm: "calm, patient, clear, visual tutor",
  energetic: "energetic coach with short punchy explanations",
  storyteller: "story-led tutor using concrete scenes and analogies",
  "exam-prep": "exam prep tutor focused on definitions, common mistakes, and recall"
};

const focusInstruction: Record<OutputFocus, string> = {
  "explain-simply": "prioritize plain-language understanding",
  "visualize-concept": "prioritize a concrete visual metaphor and visible process",
  "summarize-revision": "prioritize compact revision notes and quiz readiness"
};

export async function createLessonPlan(input: PlannerInput): Promise<LessonPlan> {
  const openai = new OpenAI({ apiKey: env.openaiApiKey() });

  const response = await openai.responses.create({
    model: env.openaiModel,
    input: [
      {
        role: "system",
        content:
          "You create concise, accurate micro-lessons for students. Return only the requested structured lesson. Media prompts must be safe, original, educational, and avoid copyrighted characters or brands."
      },
      {
        role: "user",
        content: [
          `Learner level: ${input.learnerLevel}`,
          `Tutor style: ${styleInstruction[input.tutorStyle]}`,
          `Output focus: ${focusInstruction[input.outputFocus]}`,
          "Create a saved visual micro-lesson from this source material.",
          "Return exactly 3 key takeaways and exactly 3 quiz questions.",
          "Each quiz question must include exactly 4 answer options.",
          "The image prompt should describe a clean educational illustration or diagram.",
          "The video prompt should describe a 5-second explainer animation with clear visual motion.",
          "The audio script should be a spoken narration under 900 characters that explains the concept clearly.",
          `Source material:\n${input.sourceText}`
        ].join("\n\n")
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "micro_lesson_plan",
        strict: true,
        schema: lessonPlanJsonSchema
      }
    }
  });

  const parsed = JSON.parse(response.output_text);
  return normalizeLessonPlan(lessonPlanZodSchema.parse(parsed));
}

function normalizeLessonPlan(plan: z.infer<typeof lessonPlanZodSchema>): LessonPlan {
  const keyTakeaways = takeExactly(
    plan.keyTakeaways,
    3,
    "Review the core idea in your own words."
  );
  const quizQuestions = takeExactly(plan.quizQuestions, 3, {
    question: "What is the main idea of this lesson?",
    options: ["The core concept", "An unrelated detail", "A file format", "A tool setting"],
    answer: "The core concept"
  }).map((question) => {
    const options = takeExactly(question.options, 4, question.answer);
    const answer = options.includes(question.answer) ? question.answer : options[0];

    return {
      ...question,
      options,
      answer
    };
  });

  return {
    ...plan,
    audioScript: plan.audioScript.slice(0, 900),
    keyTakeaways,
    quizQuestions
  };
}

function takeExactly<T>(items: T[], count: number, fallback: T) {
  const exact = items.slice(0, count);

  while (exact.length < count) {
    exact.push(fallback);
  }

  return exact;
}
