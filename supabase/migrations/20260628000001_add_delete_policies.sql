-- 20260628000001_add_delete_policies.sql
-- Add missing DELETE policies for votes table

-- Users can delete their own vote (e.g., when leaving the room)
CREATE POLICY "Users can delete their own vote"
    ON public.votes FOR DELETE
    USING (auth.uid() = user_id);

-- Mediator can delete any vote in their room (e.g., kicking a participant)
CREATE POLICY "Mediator can delete votes in their room"
    ON public.votes FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.rooms
        WHERE id = room_id AND mediator_id = auth.uid()
      )
    );
