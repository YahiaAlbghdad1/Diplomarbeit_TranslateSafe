-- ============================================================
-- Migration: RLS policies for teacher-user mechanism
-- ============================================================

alter table profiles           enable row level security;
alter table classes             enable row level security;
alter table class_memberships   enable row level security;
alter table flashcard_sets      enable row level security;
alter table flashcard_set_items enable row level security;
alter table exercises           enable row level security;
alter table exercise_questions  enable row level security;
alter table assignments         enable row level security;
alter table student_results     enable row level security;
alter table student_set_progress enable row level security;


-- ----------------------------------------------------------------
-- Helper: is the current user a teacher of the given class?
-- ----------------------------------------------------------------
create or replace function is_class_teacher(p_class_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from classes
    where id = p_class_id
      and teacher_id = auth.uid()
  );
$$;

-- Helper: is the current user a member of the given class?
create or replace function is_class_member(p_class_id uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from class_memberships
    where class_id  = p_class_id
      and student_id = auth.uid()
  );
$$;


-- ----------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------
create policy "users read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "teachers read student profiles in their classes"
  on profiles for select
  using (
    exists (
      select 1
      from class_memberships cm
      join classes c on c.id = cm.class_id
      where cm.student_id = profiles.id
        and c.teacher_id  = auth.uid()
    )
  );

create policy "students read teacher profiles"
  on profiles for select
  using (
    exists (
      select 1
      from class_memberships cm
      join classes c on c.id = cm.class_id
      where cm.student_id = auth.uid()
        and c.teacher_id  = profiles.id
    )
  );

create policy "users update own profile"
  on profiles for update
  using  (id = auth.uid())
  with check (id = auth.uid());


-- ----------------------------------------------------------------
-- classes
-- ----------------------------------------------------------------
create policy "teachers crud own classes"
  on classes for all
  using  (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "students read their classes"
  on classes for select
  using (is_class_member(id));


-- ----------------------------------------------------------------
-- class_memberships
-- ----------------------------------------------------------------
create policy "teachers read memberships of own classes"
  on class_memberships for select
  using (is_class_teacher(class_id));

create policy "teachers delete memberships from own classes"
  on class_memberships for delete
  using (is_class_teacher(class_id));

create policy "students read own memberships"
  on class_memberships for select
  using (student_id = auth.uid());

-- student joins a class (insert) — invite_code checked at app level before insert
create policy "students join classes"
  on class_memberships for insert
  with check (student_id = auth.uid());

create policy "students leave classes"
  on class_memberships for delete
  using (student_id = auth.uid());


-- ----------------------------------------------------------------
-- flashcard_sets
-- ----------------------------------------------------------------
create policy "teachers crud own sets"
  on flashcard_sets for all
  using  (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "students read assigned sets"
  on flashcard_sets for select
  using (
    exists (
      select 1
      from assignments a
      join class_memberships cm on cm.class_id = a.class_id
      where a.flashcard_set_id = flashcard_sets.id
        and cm.student_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- flashcard_set_items
-- ----------------------------------------------------------------
create policy "teachers crud items in own sets"
  on flashcard_set_items for all
  using  (exists (select 1 from flashcard_sets where id = set_id and teacher_id = auth.uid()))
  with check (exists (select 1 from flashcard_sets where id = set_id and teacher_id = auth.uid()));

create policy "students read items in assigned sets"
  on flashcard_set_items for select
  using (
    exists (
      select 1
      from assignments a
      join class_memberships cm on cm.class_id = a.class_id
      where a.flashcard_set_id = flashcard_set_items.set_id
        and cm.student_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- exercises
-- ----------------------------------------------------------------
create policy "teachers crud own exercises"
  on exercises for all
  using  (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "students read assigned exercises"
  on exercises for select
  using (
    exists (
      select 1
      from assignments a
      join class_memberships cm on cm.class_id = a.class_id
      where a.exercise_id   = exercises.id
        and cm.student_id   = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- exercise_questions
-- ----------------------------------------------------------------
create policy "teachers crud questions in own exercises"
  on exercise_questions for all
  using  (exists (select 1 from exercises where id = exercise_id and teacher_id = auth.uid()))
  with check (exists (select 1 from exercises where id = exercise_id and teacher_id = auth.uid()));

create policy "students read questions in assigned exercises"
  on exercise_questions for select
  using (
    exists (
      select 1
      from exercises e
      join assignments a on a.exercise_id = e.id
      join class_memberships cm on cm.class_id = a.class_id
      where e.id            = exercise_questions.exercise_id
        and cm.student_id   = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- assignments
-- ----------------------------------------------------------------
create policy "teachers crud assignments for own classes"
  on assignments for all
  using  (is_class_teacher(class_id))
  with check (is_class_teacher(class_id));

create policy "students read own assignments"
  on assignments for select
  using (is_class_member(class_id));


-- ----------------------------------------------------------------
-- student_results
-- ----------------------------------------------------------------
create policy "students crud own results"
  on student_results for all
  using  (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "teachers read results for their exercises"
  on student_results for select
  using (
    exists (
      select 1 from exercises
      where id = exercise_id
        and teacher_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- student_set_progress
-- ----------------------------------------------------------------
create policy "students crud own progress"
  on student_set_progress for all
  using  (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "teachers read progress for their sets"
  on student_set_progress for select
  using (
    exists (
      select 1
      from flashcard_set_items fsi
      join flashcard_sets fs on fs.id = fsi.set_id
      where fsi.id       = flashcard_set_item_id
        and fs.teacher_id = auth.uid()
    )
  );
