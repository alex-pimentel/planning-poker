-- 20260627000000_init.sql
-- Planning Poker: Database Schema, RLS Policies, and Realtime Publication

-- ──────────────────────────────────────────────
-- Extensions
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────
-- Enums
-- ──────────────────────────────────────────────
CREATE TYPE room_status AS ENUM ('voting', 'revealed', 'reset');

-- ──────────────────────────────────────────────
-- Tables
-- ──────────────────────────────────────────────

-- Rooms
CREATE TABLE public.rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code       VARCHAR(6) UNIQUE NOT NULL,
    mediator_id     UUID NOT NULL,
    current_task    TEXT DEFAULT 'Initial Task',
    status          room_status DEFAULT 'voting' NOT NULL,
    deck_type       VARCHAR(10) DEFAULT 'fibonacci' NOT NULL
                        CHECK (deck_type IN ('fibonacci', 'tshirt', 'powers2')),
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Votes
CREATE TABLE public.votes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id     UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    user_id     UUID NOT NULL,
    user_name   TEXT NOT NULL,
    vote_value  VARCHAR(4),
    voted_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_per_room UNIQUE (room_id, user_id)
);

-- Task history (persistent record across rounds)
CREATE TABLE public.tasks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id     UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ──────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────
CREATE INDEX idx_votes_room_id ON public.votes(room_id);
CREATE INDEX idx_rooms_room_code ON public.rooms(room_code);

-- ──────────────────────────────────────────────
-- Realtime Publication
-- ──────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- ──────────────────────────────────────────────
-- Row-Level Security
-- ──────────────────────────────────────────────
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Rooms: anyone can read (join)
CREATE POLICY "Anyone can read rooms"
    ON public.rooms FOR SELECT USING (true);

-- Rooms: anyone can create
CREATE POLICY "Anyone can create rooms"
    ON public.rooms FOR INSERT WITH CHECK (true);

-- Rooms: only mediator can update
CREATE POLICY "Mediator can update their room"
    ON public.rooms FOR UPDATE
    USING (auth.uid() = mediator_id)
    WITH CHECK (auth.uid() = mediator_id);

-- Rooms: only mediator can delete
CREATE POLICY "Mediator can delete their room"
    ON public.rooms FOR DELETE
    USING (auth.uid() = mediator_id);

-- Votes: anyone in room can see votes
CREATE POLICY "Anyone can view votes"
    ON public.votes FOR SELECT USING (true);

-- Votes: any authenticated user can upsert their own vote
CREATE POLICY "Users can upsert their own vote"
    ON public.votes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own vote"
    ON public.votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- Triggers
-- ──────────────────────────────────────────────

-- Auto-update updated_at on rooms
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
