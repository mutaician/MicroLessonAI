import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  FileText,
  ImageIcon,
  Library,
  Loader2,
  Play,
  Sparkles,
  Upload
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createLesson, fetchLesson, fetchLessons, generateLessonImage, generateLessonVideo } from "./lib/api";
import type { LearnerLevel, Lesson, OutputFocus, SourceType, TutorStyle } from "./types";

const levels: Array<{ value: LearnerLevel; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

const tutorStyles: Array<{ value: TutorStyle; label: string }> = [
  { value: "calm", label: "Calm tutor" },
  { value: "energetic", label: "Energetic coach" },
  { value: "storyteller", label: "Storyteller" },
  { value: "exam-prep", label: "Exam prep" }
];

const outputFocuses: Array<{ value: OutputFocus; label: string }> = [
  { value: "explain-simply", label: "Explain simply" },
  { value: "visualize-concept", label: "Visualize concept" },
  { value: "summarize-revision", label: "Revision summary" }
];

const progressSteps = [
  "Reading material",
  "Planning lesson",
  "Creating visual",
  "Generating video",
  "Saving lesson"
];

type Route =
  | { name: "generate" }
  | { name: "library" }
  | { name: "lesson"; id: string };

export function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());

  useEffect(() => {
    const onPop = () => setRoute(parseRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (next: Route) => {
    const path =
      next.name === "generate" ? "/" : next.name === "library" ? "/lessons" : `/lessons/${next.id}`;
    window.history.pushState(null, "", path);
    setRoute(next);
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <TopNav route={route} navigate={navigate} />
        {route.name === "generate" && <GenerateView navigate={navigate} />}
        {route.name === "library" && <LibraryView navigate={navigate} />}
        {route.name === "lesson" && <LessonDetailView id={route.id} navigate={navigate} />}
      </div>
    </main>
  );
}

function TopNav({ route, navigate }: { route: Route; navigate: (route: Route) => void }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 py-4">
      <button className="flex items-center gap-2 text-left" onClick={() => navigate({ name: "generate" })}>
        <span className="grid size-10 place-items-center rounded-lg bg-ink text-paper">
          <Sparkles size={20} />
        </span>
        <span>
          <span className="block text-lg font-semibold leading-tight">MicroLesson AI</span>
          <span className="block text-sm text-ink/60">Saved visual lessons from your material</span>
        </span>
      </button>
      <nav className="flex items-center gap-2">
        <button
          className={navButton(route.name === "generate")}
          onClick={() => navigate({ name: "generate" })}
        >
          <BookOpen size={18} />
          Generate
        </button>
        <button className={navButton(route.name === "library")} onClick={() => navigate({ name: "library" })}>
          <Library size={18} />
          Library
        </button>
      </nav>
    </header>
  );
}

function GenerateView({ navigate }: { navigate: (route: Route) => void }) {
  const [sourceType, setSourceType] = useState<SourceType>("topic");
  const [topic, setTopic] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [learnerLevel, setLearnerLevel] = useState<LearnerLevel>("beginner");
  const [tutorStyle, setTutorStyle] = useState<TutorStyle>("calm");
  const [outputFocus, setOutputFocus] = useState<OutputFocus>("visualize-concept");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastLesson, setLastLesson] = useState<Lesson | null>(null);
  const [liveLesson, setLiveLesson] = useState<Lesson | null>(null);

  const canSubmit = sourceType === "topic" ? topic.trim().length > 0 : sourceFile !== null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLastLesson(null);
    setLiveLesson(null);
    setStepIndex(0);
    setIsGenerating(true);

    try {
      const lesson = await createLesson({
        sourceType,
        topic,
        sourceFile,
        learnerLevel,
        tutorStyle,
        outputFocus
      });
      setLiveLesson(lesson);
      setStepIndex(2);

      const imageLesson = await generateLessonImage(lesson.id);
      setLiveLesson(imageLesson);
      setStepIndex(3);

      const videoLesson = await generateLessonVideo(lesson.id);
      setLiveLesson(videoLesson);
      setStepIndex(4);
      setLastLesson(videoLesson);
    } catch (caught) {
      const generationError = caught as Error & { lesson?: Lesson };
      setError(generationError.message);
      if (generationError.lesson) {
        setLiveLesson(generationError.lesson);
        setLastLesson(generationError.lesson);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="grid flex-1 gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
            Turn study material into a saved visual micro-lesson.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink/65">
            Paste a topic or upload a text-based PDF, choose how it should teach, and generate one lesson
            with a visual, video, takeaways, and quiz.
          </p>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <SegmentedControl
            value={sourceType}
            onChange={(value) => setSourceType(value as SourceType)}
            options={[
              { value: "topic", label: "Topic", icon: <BookOpen size={17} /> },
              { value: "pdf", label: "PDF", icon: <FileText size={17} /> }
            ]}
          />

          {sourceType === "topic" ? (
            <label className="mt-4 block">
              <span className="text-sm font-medium text-ink/70">Topic or pasted notes</span>
              <textarea
                className="mt-2 min-h-48 w-full resize-y rounded-lg border border-ink/15 bg-paper p-4 text-base leading-7 outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Example: gradient descent in machine learning"
              />
            </label>
          ) : (
            <label className="mt-4 grid min-h-48 cursor-pointer place-items-center rounded-lg border border-dashed border-ink/20 bg-paper p-6 text-center transition hover:border-moss hover:bg-mint/40">
              <input
                className="sr-only"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setSourceFile(event.target.files?.[0] ?? null)}
              />
              <span className="grid gap-3">
                <span className="mx-auto grid size-12 place-items-center rounded-lg bg-mint text-moss">
                  <Upload size={22} />
                </span>
                <span className="text-base font-medium">
                  {sourceFile ? sourceFile.name : "Upload a text-based PDF"}
                </span>
                <span className="text-sm text-ink/55">First pages are extracted server-side. Max 8 MB.</span>
              </span>
            </label>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Learning level"
            value={learnerLevel}
            options={levels}
            onChange={(value) => setLearnerLevel(value as LearnerLevel)}
          />
          <SelectField
            label="Tutor style"
            value={tutorStyle}
            options={tutorStyles}
            onChange={(value) => setTutorStyle(value as TutorStyle)}
          />
          <SelectField
            label="Output focus"
            value={outputFocus}
            options={outputFocuses}
            onChange={(value) => setOutputFocus(value as OutputFocus)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-coral px-5 text-base font-semibold text-white transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:bg-ink/25"
            disabled={!canSubmit || isGenerating}
            type="submit"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={19} /> : <Sparkles size={19} />}
            {isGenerating ? "Generating" : "Generate lesson"}
          </button>
          {lastLesson && (
            <button
              type="button"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-ink/15 px-4 font-medium transition hover:bg-white"
              onClick={() => navigate({ name: "lesson", id: lastLesson.id })}
            >
              <Play size={18} />
              Open last lesson
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-coral/30 bg-coral/10 p-4 text-sm text-ink">
            <CircleAlert className="mt-0.5 shrink-0 text-coral" size={18} />
            <span>{error}</span>
          </div>
        )}
      </form>

      <aside className="space-y-4">
        <ProgressPanel isGenerating={isGenerating} stepIndex={stepIndex} />
        {liveLesson ? (
          <LiveLessonPreview lesson={liveLesson} navigate={navigate} />
        ) : (
          <div className="rounded-lg border border-ink/10 bg-ink p-5 text-paper shadow-soft">
            <div className="flex items-center gap-2 text-sm font-medium text-mint">
              <ImageIcon size={17} />
              Demo loop
            </div>
            <p className="mt-3 text-2xl font-semibold leading-tight">Topic/PDF → lesson plan → image → video → library</p>
            <p className="mt-3 text-sm leading-6 text-paper/65">
              Each finished step appears here immediately while the next API call continues.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}

function LiveLessonPreview({ lesson, navigate }: { lesson: Lesson; navigate: (route: Route) => void }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-mint px-2 py-1 text-xs font-semibold uppercase tracking-wide text-moss">
          {statusLabel(lesson.status)}
        </span>
        <button
          type="button"
          className="text-sm font-semibold text-moss hover:text-ink"
          onClick={() => navigate({ name: "lesson", id: lesson.id })}
        >
          Open
        </button>
      </div>
      <h2 className="mt-3 text-xl font-semibold leading-tight">{lesson.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/60">{lesson.summary}</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-ink/10 bg-paper">
        {lesson.videoUrl ? (
          <video className="aspect-video w-full bg-ink" src={lesson.videoUrl} controls playsInline poster={lesson.imageUrl ?? undefined} />
        ) : lesson.imageUrl ? (
          <img className="aspect-video w-full object-cover" src={lesson.imageUrl} alt="" />
        ) : (
          <div className="grid aspect-video place-items-center text-ink/35">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/65">
        {lesson.keyTakeaways.map((takeaway) => (
          <li className="flex gap-2" key={takeaway}>
            <CheckCircle2 className="mt-1 shrink-0 text-moss" size={15} />
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressPanel({ isGenerating, stepIndex }: { isGenerating: boolean; stepIndex: number }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold">Generation progress</h2>
      <div className="mt-4 grid gap-3">
        {progressSteps.map((step, index) => {
          const complete = isGenerating ? index < stepIndex : false;
          const active = isGenerating && index === stepIndex;
          return (
            <div className="flex items-center gap-3" key={step}>
              <span
                className={[
                  "grid size-8 shrink-0 place-items-center rounded-lg border",
                  complete
                    ? "border-moss bg-moss text-white"
                    : active
                      ? "border-amber bg-amber/20 text-ink"
                      : "border-ink/10 bg-paper text-ink/35"
                ].join(" ")}
              >
                {complete ? <CheckCircle2 size={17} /> : active ? <Loader2 className="animate-spin" size={17} /> : index + 1}
              </span>
              <span className={active ? "font-semibold" : "text-ink/65"}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LibraryView({ navigate }: { navigate: (route: Route) => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLessons()
      .then(setLessons)
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="flex-1 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Lesson library</h1>
          <p className="mt-2 text-ink/60">Reopen saved micro-lessons from previous generations.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-3 font-medium text-paper" onClick={() => navigate({ name: "generate" })}>
          <Sparkles size={18} />
          New lesson
        </button>
      </div>

      {isLoading && <LoadingBlock label="Loading saved lessons" />}
      {error && <ErrorBlock message={error} />}
      {!isLoading && !error && lessons.length === 0 && (
        <EmptyState
          title="No lessons saved yet"
          body="Generate a topic or PDF lesson first, then it will appear here."
        />
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <button
            className="group overflow-hidden rounded-lg border border-ink/10 bg-white text-left shadow-soft transition hover:-translate-y-0.5"
            key={lesson.id}
            onClick={() => navigate({ name: "lesson", id: lesson.id })}
          >
            <div className="aspect-video bg-mint">
              {lesson.imageUrl ? (
                <img className="size-full object-cover" src={lesson.imageUrl} alt="" />
              ) : (
                <div className="grid size-full place-items-center text-moss">
                  <ImageIcon size={32} />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-ink/45">
                <span>{lesson.sourceType === "pdf" ? "PDF" : "Topic"}</span>
                <span>{lesson.status}</span>
              </div>
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug group-hover:text-moss">
                {lesson.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/60">{lesson.summary}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function LessonDetailView({ id, navigate }: { id: string; navigate: (route: Route) => void }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    const loadLesson = () => {
      fetchLesson(id)
        .then((nextLesson) => {
          if (cancelled) {
            return;
          }

          setLesson(nextLesson);

          if (isTerminalStatus(nextLesson.status) && intervalId) {
            window.clearInterval(intervalId);
            intervalId = undefined;
          }
        })
        .catch((caught: Error) => {
          if (!cancelled) {
            setError(caught.message);
          }
        });
    };

    setLesson(null);
    setError(null);
    loadLesson();
    intervalId = window.setInterval(loadLesson, 3500);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [id]);

  if (error) {
    return <ErrorBlock message={error} />;
  }

  if (!lesson) {
    return <LoadingBlock label="Opening lesson" />;
  }

  return (
    <section className="flex-1 py-6">
      <button className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-ink" onClick={() => navigate({ name: "library" })}>
        <ArrowLeft size={17} />
        Back to library
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-moss">
              <span className="rounded-md bg-mint px-2 py-1">{lesson.learnerLevel}</span>
              <span className="rounded-md bg-sky/20 px-2 py-1">{lesson.tutorStyle}</span>
              <span className="rounded-md bg-amber/20 px-2 py-1">{lesson.sourceType}</span>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">{lesson.title}</h1>
            <p className="mt-3 text-lg leading-8 text-ink/65">{lesson.summary}</p>
          </div>

          <div className="overflow-hidden rounded-lg border border-ink/10 bg-ink shadow-soft">
            {lesson.videoUrl ? (
              <video className="aspect-video w-full bg-ink" src={lesson.videoUrl} controls playsInline poster={lesson.imageUrl ?? undefined} />
            ) : (
              <MediaPendingPanel lesson={lesson} />
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <button
              className="overflow-hidden rounded-lg border border-ink/10 bg-white text-left shadow-soft transition hover:border-moss disabled:cursor-default disabled:hover:border-ink/10"
              disabled={!lesson.imageUrl}
              onClick={() => setExpandedImage(true)}
              type="button"
            >
              {lesson.imageUrl ? (
                <img className="aspect-video w-full object-contain" src={lesson.imageUrl} alt={`Visual for ${lesson.title}`} />
              ) : (
                <div className="grid aspect-video place-items-center bg-mint text-moss">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              )}
            </button>
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
              <h2 className="text-xl font-semibold">Simple explanation</h2>
              <p className="mt-3 leading-7 text-ink/70">{lesson.simpleExplanation}</p>
            </div>
          </div>

          {lesson.status === "failed" && lesson.errorMessage && (
            <div className="flex items-start gap-3 rounded-lg border border-coral/30 bg-coral/10 p-4 text-sm">
              <CircleAlert className="mt-0.5 shrink-0 text-coral" size={18} />
              <span>{lesson.errorMessage}</span>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-semibold">Key takeaways</h2>
            <ul className="mt-4 space-y-3">
              {lesson.keyTakeaways.map((takeaway) => (
                <li className="flex gap-3 leading-6 text-ink/70" key={takeaway}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-moss" size={18} />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-semibold">Quick quiz</h2>
            <div className="mt-4 space-y-4">
              {lesson.quizQuestions.map((question, index) => (
                <QuizCard question={question} index={index} key={question.question} />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {expandedImage && lesson.imageUrl && (
        <ImageModal
          imageUrl={lesson.imageUrl}
          title={lesson.title}
          onClose={() => setExpandedImage(false)}
        />
      )}
    </section>
  );
}

function MediaPendingPanel({ lesson }: { lesson: Lesson }) {
  const label =
    lesson.status === "planned"
      ? "Lesson plan is ready. Visual generation is next."
      : lesson.status === "image_generating"
        ? "Creating the lesson image."
        : lesson.status === "video_pending"
          ? "Image is ready. Video generation is next."
          : lesson.status === "video_generating"
            ? "Generating the explainer video."
            : "Video is not available yet.";

  return (
    <div className="grid aspect-video place-items-center bg-ink text-paper">
      <div className="grid max-w-sm justify-items-center gap-3 px-6 text-center">
        <span className="grid size-14 place-items-center rounded-lg bg-paper/10 text-mint">
          {lesson.status === "failed" ? <CircleAlert size={26} /> : <Loader2 className="animate-spin" size={26} />}
        </span>
        <span className="text-lg font-semibold">{statusLabel(lesson.status)}</span>
        <span className="text-sm leading-6 text-paper/65">{label}</span>
      </div>
    </div>
  );
}

function ImageModal({
  imageUrl,
  title,
  onClose
}: {
  imageUrl: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-soft" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
          <h2 className="line-clamp-2 text-base font-semibold">{title}</h2>
          <button className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold hover:bg-paper" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="max-h-[82vh] overflow-auto bg-paper p-3">
          <img className="mx-auto h-auto max-h-[78vh] w-auto max-w-full object-contain" src={imageUrl} alt={`Expanded visual for ${title}`} />
        </div>
      </div>
    </div>
  );
}

function QuizCard({
  question,
  index
}: {
  question: Lesson["quizQuestions"][number];
  index: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-4">
      <p className="font-medium">
        {index + 1}. {question.question}
      </p>
      <div className="mt-3 grid gap-2">
        {question.options.map((option) => {
          const answered = selected !== null;
          const correct = option === question.answer;
          const chosen = option === selected;
          return (
            <button
              className={[
                "rounded-md border px-3 py-2 text-left text-sm transition",
                !answered ? "border-ink/10 bg-white hover:border-moss" : "",
                answered && correct ? "border-moss bg-mint font-semibold text-moss" : "",
                answered && chosen && !correct ? "border-coral bg-coral/10 text-ink" : "",
                answered && !chosen && !correct ? "border-ink/10 bg-white text-ink/50" : ""
              ].join(" ")}
              disabled={answered}
              key={option}
              onClick={() => setSelected(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="mt-3 text-sm font-medium text-ink/65">
          {selected === question.answer ? "Correct." : `Correct answer: ${question.answer}`}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <select
        className="mt-2 h-12 w-full rounded-lg border border-ink/15 bg-white px-3 outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SegmentedControl({
  value,
  options,
  onChange
}: {
  value: string;
  options: Array<{ value: string; label: string; icon: React.ReactNode }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg bg-paper p-1">
      {options.map((option) => (
        <button
          className={[
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold transition",
            value === option.value ? "bg-white text-ink shadow-sm" : "text-ink/55 hover:text-ink"
          ].join(" ")}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="mt-6 flex min-h-56 items-center justify-center rounded-lg border border-ink/10 bg-white">
      <span className="inline-flex items-center gap-2 text-ink/60">
        <Loader2 className="animate-spin" size={18} />
        {label}
      </span>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-lg border border-coral/30 bg-coral/10 p-4">
      <CircleAlert className="mt-0.5 shrink-0 text-coral" size={18} />
      <span>{message}</span>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-ink/20 bg-white p-10 text-center">
      <Library className="mx-auto text-ink/35" size={34} />
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-ink/55">{body}</p>
    </div>
  );
}

function navButton(active: boolean) {
  return [
    "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
    active ? "bg-ink text-paper" : "text-ink/60 hover:bg-white hover:text-ink"
  ].join(" ");
}

function statusLabel(status: Lesson["status"]) {
  const labels: Record<Lesson["status"], string> = {
    planned: "Plan ready",
    image_generating: "Creating image",
    video_pending: "Image ready",
    video_generating: "Generating video",
    complete: "Complete",
    failed: "Failed"
  };

  return labels[status];
}

function isTerminalStatus(status: Lesson["status"]) {
  return status === "complete" || status === "failed";
}

function parseRoute(): Route {
  const path = window.location.pathname;

  if (path === "/lessons") {
    return { name: "library" };
  }

  if (path.startsWith("/lessons/")) {
    return { name: "lesson", id: path.replace("/lessons/", "") };
  }

  return { name: "generate" };
}
