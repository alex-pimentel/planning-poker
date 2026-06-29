-- 20260629000000_tasks_and_groups.sql
-- Enable tasks table + add groups and participant_groups

-- ──────────────────────────────────────────────
-- Groups table (must exist before tasks FK)
-- ──────────────────────────────────────────────
CREATE TABLE public.groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id     UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (room_id, name)
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;

CREATE POLICY "Anyone can view groups"
    ON public.groups FOR SELECT USING (true);

CREATE POLICY "Mediator can insert groups"
    ON public.groups FOR INSERT
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

CREATE POLICY "Mediator can update groups"
    ON public.groups FOR UPDATE
    USING (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

CREATE POLICY "Mediator can delete groups"
    ON public.groups FOR DELETE
    USING (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

-- ──────────────────────────────────────────────
-- Extend tasks table (FK to groups now exists)
-- ──────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN final_score VARCHAR(4),
  ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

CREATE POLICY "Anyone can view tasks"
    ON public.tasks FOR SELECT USING (true);

CREATE POLICY "Mediator can insert tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

CREATE POLICY "Mediator can update tasks"
    ON public.tasks FOR UPDATE
    USING (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

CREATE POLICY "Mediator can delete tasks"
    ON public.tasks FOR DELETE
    USING (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

-- ──────────────────────────────────────────────
-- Participant-Group assignments
-- ──────────────────────────────────────────────
CREATE TABLE public.participant_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id     UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    user_id     UUID NOT NULL,
    group_id    UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (room_id, user_id)
);

ALTER TABLE public.participant_groups ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participant_groups;

CREATE POLICY "Anyone can view participant_groups"
    ON public.participant_groups FOR SELECT USING (true);

-- Mediator can manage all assignments
CREATE POLICY "Mediator can insert participant_groups"
    ON public.participant_groups FOR INSERT
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

CREATE POLICY "Mediator can update participant_groups"
    ON public.participant_groups FOR UPDATE
    USING (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

CREATE POLICY "Mediator can delete participant_groups"
    ON public.participant_groups FOR DELETE
    USING (
      EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND mediator_id = auth.uid())
    );

-- Participants can self-assign (insert their own record)
CREATE POLICY "Users can self-assign to group"
    ON public.participant_groups FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      AND EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id)
    );

-- Participants can change their own group
CREATE POLICY "Users can update their own group assignment"
    ON public.participant_groups FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Participants can remove themselves from a group
CREATE POLICY "Users can delete their own group assignment"
    ON public.participant_groups FOR DELETE
    USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- Grant table permissions to anon and authenticated roles
-- ──────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
