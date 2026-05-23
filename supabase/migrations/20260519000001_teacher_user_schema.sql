-- ============================================================
-- Migration: teacher-user mechanism
-- Tables: profiles, classes, class_memberships, flashcard_sets,
--         flashcard_set_items, exercises, exercise_questions,
--         assignments, student_results, student_set_progress
-- ============================================================

-- ----------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------
create table profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  -- null  = regular personal account
  -- 'teacher' / 'student' = school account
  role         text        check (role in ('teacher', 'student')),
  display_name text,
  created_at   timestamptz not null default now()
);

-- auto-create a profile row when a user signs up.
-- the client passes role + display_name in options.data during signUp().
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, role, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ----------------------------------------------------------------
-- classes
-- ----------------------------------------------------------------
create table classes (
  id          uuid        primary key default gen_random_uuid(),
  teacher_id  uuid        not null references profiles(id) on delete cascade,
  name        text        not null,
  invite_code text        not null unique default substring(md5(random()::text) from 1 for 8),
  created_at  timestamptz not null default now()
);


-- ----------------------------------------------------------------
-- class_memberships
-- ----------------------------------------------------------------
create table class_memberships (
  id         uuid        primary key default gen_random_uuid(),
  class_id   uuid        not null references classes(id) on delete cascade,
  student_id uuid        not null references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  unique (class_id, student_id)
);


-- ----------------------------------------------------------------
-- flashcard_sets
-- ----------------------------------------------------------------
create table flashcard_sets (
  id          uuid        primary key default gen_random_uuid(),
  teacher_id  uuid        not null references profiles(id) on delete cascade,
  title       text        not null,
  description text,
  created_at  timestamptz not null default now()
);


-- ----------------------------------------------------------------
-- flashcard_set_items
-- ----------------------------------------------------------------
create table flashcard_set_items (
  id          uuid primary key default gen_random_uuid(),
  set_id      uuid not null references flashcard_sets(id) on delete cascade,
  word        text not null,
  translation text not null,
  position    int  not null default 0
);


-- ----------------------------------------------------------------
-- exercises
-- ----------------------------------------------------------------
create table exercises (
  id         uuid        primary key default gen_random_uuid(),
  set_id     uuid        not null references flashcard_sets(id) on delete cascade,
  teacher_id uuid        not null references profiles(id) on delete cascade,
  title      text        not null,
  type       text        not null check (type in ('fill_gap', 'multiple_choice', 'matching')),
  created_at timestamptz not null default now()
);


-- ----------------------------------------------------------------
-- exercise_questions
-- ----------------------------------------------------------------
create table exercise_questions (
  id             uuid primary key default gen_random_uuid(),
  exercise_id    uuid not null references exercises(id) on delete cascade,
  position       int  not null default 0,
  -- "The ___ is on the table"  (matching uses sentence as the prompt word)
  sentence       text not null,
  correct_answer text not null,
  -- ["dog","cat","fish"] for multiple_choice; null for fill_gap/matching
  options        jsonb
);


-- ----------------------------------------------------------------
-- assignments
-- ----------------------------------------------------------------
create table assignments (
  id               uuid        primary key default gen_random_uuid(),
  class_id         uuid        not null references classes(id) on delete cascade,
  assigned_by      uuid        not null references profiles(id),
  flashcard_set_id uuid        references flashcard_sets(id) on delete cascade,
  exercise_id      uuid        references exercises(id) on delete cascade,
  due_date         timestamptz,
  assigned_at      timestamptz not null default now(),
  -- exactly one of flashcard_set_id / exercise_id must be set
  constraint one_content_type check (
    (flashcard_set_id is not null and exercise_id is null) or
    (flashcard_set_id is null     and exercise_id is not null)
  )
);


-- ----------------------------------------------------------------
-- student_results
-- ----------------------------------------------------------------
create table student_results (
  id           uuid        primary key default gen_random_uuid(),
  student_id   uuid        not null references profiles(id) on delete cascade,
  exercise_id  uuid        not null references exercises(id) on delete cascade,
  score        int         not null,
  total        int         not null,
  -- [{question_id, given, correct, ok}]
  answers      jsonb,
  completed_at timestamptz not null default now()
);


-- ----------------------------------------------------------------
-- student_set_progress  (SRS state per student per set item)
-- ----------------------------------------------------------------
create table student_set_progress (
  id                    uuid  primary key default gen_random_uuid(),
  student_id            uuid  not null references profiles(id) on delete cascade,
  flashcard_set_item_id uuid  not null references flashcard_set_items(id) on delete cascade,
  ease_factor           float not null default 2.5,
  interval_days         int   not null default 1,
  due_date              date  not null default current_date,
  last_reviewed         timestamptz,
  unique (student_id, flashcard_set_item_id)
);


-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------
create index on classes            (teacher_id);
create index on class_memberships  (class_id);
create index on class_memberships  (student_id);
create index on flashcard_sets     (teacher_id);
create index on flashcard_set_items(set_id, position);
create index on exercises          (set_id);
create index on exercises          (teacher_id);
create index on exercise_questions (exercise_id, position);
create index on assignments        (class_id);
create index on assignments        (flashcard_set_id);
create index on assignments        (exercise_id);
create index on student_results    (student_id);
create index on student_results    (exercise_id);
create index on student_set_progress(student_id, due_date);
