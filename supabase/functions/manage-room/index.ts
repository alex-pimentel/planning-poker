// Supabase Edge Function: manage-room
// Administrative operations for planning poker rooms.
// Invoked via: POST /functions/v1/manage-room

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface RequestBody {
  action: 'reset_round' | 'reveal_votes' | 'delete_room';
  room_id: string;
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

serve(async (req: Request) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null { headers });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: RequestBody = await req.json();
    const { action, room_id } = body;

    if (!action || !room_id) {
      return new Response(
        JSON.stringify({ error: 'action and room_id are required' }),
        { status: 400, headers },
      );
    }

    switch (action) {
      case 'reset_round': {
        const { error: voteError } = await supabase
          .from('votes')
          .delete()
          .eq('room_id', room_id);

        if (voteError) throw voteError;

        const { error: roomError } = await supabase
          .from('rooms')
          .update({ status: 'voting' })
          .eq('id', room_id);

        if (roomError) throw roomError;

        return new Response(
          JSON.stringify({ success: true, action: 'reset_round' }),
          { status: 200, headers },
        );
      }

      case 'reveal_votes': {
        const { error } = await supabase
          .from('rooms')
          .update({ status: 'revealed' })
          .eq('id', room_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, action: 'reveal_votes' }),
          { status: 200, headers },
        );
      }

      case 'delete_room': {
        const { error } = await supabase
          .from('rooms')
          .delete()
          .eq('id', room_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, action: 'delete_room' }),
          { status: 200, headers },
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers },
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
});
