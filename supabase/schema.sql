create extension if not exists "pgcrypto";

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null check (source_type in ('topic', 'pdf')),
  source_filename text,
  source_text text not null,
  source_text_preview text not null,
  learner_level text not null check (learner_level in ('beginner', 'intermediate', 'advanced')),
  tutor_style text not null check (tutor_style in ('calm', 'energetic', 'storyteller', 'exam-prep')),
  output_focus text not null check (output_focus in ('explain-simply', 'visualize-concept', 'summarize-revision')),
  summary text not null,
  simple_explanation text not null,
  key_takeaways jsonb not null,
  quiz_questions jsonb not null,
  image_prompt text not null,
  video_prompt text not null,
  audio_script text not null default '',
  image_url text,
  video_url text,
  audio_url text,
  status text not null check (status in ('planned', 'image_generating', 'video_pending', 'video_generating', 'audio_pending', 'audio_generating', 'complete', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists lessons_created_at_idx on public.lessons (created_at desc);

alter table public.lessons enable row level security;

alter table public.lessons drop constraint if exists lessons_status_check;
alter table public.lessons add constraint lessons_status_check
  check (status in ('planned', 'image_generating', 'video_pending', 'video_generating', 'audio_pending', 'audio_generating', 'complete', 'failed'));

alter table public.lessons add column if not exists audio_script text not null default '';
alter table public.lessons add column if not exists audio_url text;
