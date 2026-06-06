/**
 * Squad Service — Social Accountability Groups
 * Uses Supabase for real-time multiplayer squads.
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Squad, SquadMember } from '@/types';

const MY_SQUAD_KEY = 'habitflow_my_squad_id';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getMySquadId(): string | null {
  return localStorage.getItem(MY_SQUAD_KEY);
}

function setMySquadId(id: string | null): void {
  if (id) localStorage.setItem(MY_SQUAD_KEY, id);
  else localStorage.removeItem(MY_SQUAD_KEY);
}

async function createSquad(
  name: string,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<Squad | null> {
  if (!isSupabaseConfigured()) {
    console.error('[SquadService] Supabase not configured');
    return null;
  }

  const inviteCode = generateInviteCode();

  // 1. Insert Squad
  const { data: squadData, error: squadError } = await supabase
    .from('squads')
    .insert({
      name,
      invite_code: inviteCode,
      owner_id: userId,
    })
    .select()
    .single();

  if (squadError || !squadData) {
    console.error('[SquadService] Error creating squad:', squadError);
    return null;
  }

  // 2. Insert Owner as Member
  const { error: memberError } = await supabase.from('squad_members').insert({
    squad_id: squadData.id,
    user_id: userId,
    streak: 0,
    completion_today: 0,
  });

  if (memberError) {
    console.error('[SquadService] Error adding owner to squad:', memberError);
    return null;
  }

  setMySquadId(squadData.id);

  return {
    id: squadData.id,
    name: squadData.name,
    invite_code: squadData.invite_code,
    owner_id: squadData.owner_id,
    created_at: squadData.created_at,
    members: [
      {
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
        streak: 0,
        completion_today: 0,
        joined_at: new Date().toISOString(),
      },
    ],
  };
}

async function joinSquad(
  inviteCode: string,
  userId: string,
  _displayName: string,
  _avatarUrl?: string
): Promise<Squad | null> {
  if (!isSupabaseConfigured()) return null;

  // 1. Find Squad
  const { data: squadData, error: squadError } = await supabase
    .from('squads')
    .select('id')
    .ilike('invite_code', inviteCode.trim())
    .single();

  if (squadError || !squadData) {
    console.error('[SquadService] Invalid invite code or squad not found');
    return null;
  }

  // 2. Count members
  const { count, error: countError } = await supabase
    .from('squad_members')
    .select('*', { count: 'exact', head: true })
    .eq('squad_id', squadData.id);

  if (countError || (count !== null && count >= 5)) {
    console.error('[SquadService] Squad is full');
    return null;
  }

  // 3. Insert Member (ignores if already exists due to PK)
  const { error: insertError } = await supabase.from('squad_members').upsert({
    squad_id: squadData.id,
    user_id: userId,
  });

  if (insertError) {
    console.error('[SquadService] Error joining squad:', insertError);
    return null;
  }

  setMySquadId(squadData.id);
  return await getMySquad();
}

async function leaveSquad(squadId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('squad_members')
    .delete()
    .eq('squad_id', squadId)
    .eq('user_id', userId);

  if (error) {
    console.error('[SquadService] Error leaving squad:', error);
    return;
  }

  // Cleanup local
  setMySquadId(null);
}

async function getMySquad(): Promise<Squad | null> {
  if (!isSupabaseConfigured()) return null;
  const id = getMySquadId();
  if (!id) return null;

  // Query squad and members + profiles
  const { data: squadData, error: squadError } = await supabase
    .from('squads')
    .select(
      `
      id, name, invite_code, owner_id, created_at,
      squad_members (
        user_id, streak, completion_today, joined_at,
        profiles (
          name, avatar_url
        )
      )
    `
    )
    .eq('id', id)
    .single();

  if (squadError || !squadData) {
    console.error('[SquadService] Error fetching squad:', squadError);
    // Maybe they got kicked out, or squad deleted
    setMySquadId(null);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members: SquadMember[] = ((squadData.squad_members as any[]) || []).map(m => ({
    user_id: m.user_id,
    display_name: m.profiles?.name || 'Anonymous',
    avatar_url: m.profiles?.avatar_url,
    streak: m.streak,
    completion_today: m.completion_today,
    joined_at: m.joined_at,
  }));

  return {
    id: squadData.id,
    name: squadData.name,
    invite_code: squadData.invite_code,
    owner_id: squadData.owner_id,
    created_at: squadData.created_at,
    members,
  };
}

async function updateMyProgress(
  squadId: string,
  userId: string,
  streak: number,
  completionToday: number
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await supabase
    .from('squad_members')
    .update({
      streak,
      completion_today: completionToday,
    })
    .eq('squad_id', squadId)
    .eq('user_id', userId);
}

export const squadService = {
  createSquad,
  joinSquad,
  leaveSquad,
  getMySquad,
  updateMyProgress,
  generateInviteCode,
};
