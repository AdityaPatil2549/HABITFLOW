/**
 * Squad Service — Social Accountability Groups
 * Uses localStorage for squad data (works in guest mode too).
 */
import type { Squad, SquadMember } from '@/types';

const STORAGE_KEY = 'habitflow_squads';
const MY_SQUAD_KEY = 'habitflow_my_squad_id';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getAllSquads(): Squad[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllSquads(squads: Squad[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(squads));
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
): Promise<Squad> {
  const squad: Squad = {
    id: crypto.randomUUID(),
    name,
    invite_code: generateInviteCode(),
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
    created_at: new Date().toISOString(),
    owner_id: userId,
  };

  const squads = getAllSquads();
  squads.push(squad);
  saveAllSquads(squads);
  setMySquadId(squad.id);
  return squad;
}

async function joinSquad(
  inviteCode: string,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<Squad | null> {
  const squads = getAllSquads();
  const squad = squads.find(s => s.invite_code.toUpperCase() === inviteCode.toUpperCase());
  if (!squad) return null;

  // Check if already a member
  if (squad.members.some(m => m.user_id === userId)) {
    setMySquadId(squad.id);
    return squad;
  }

  // Max 5 members
  if (squad.members.length >= 5) return null;

  const member: SquadMember = {
    user_id: userId,
    display_name: displayName,
    avatar_url: avatarUrl,
    streak: 0,
    completion_today: 0,
    joined_at: new Date().toISOString(),
  };

  squad.members.push(member);
  saveAllSquads(squads);
  setMySquadId(squad.id);
  return squad;
}

async function leaveSquad(squadId: string, userId: string): Promise<void> {
  const squads = getAllSquads();
  const idx = squads.findIndex(s => s.id === squadId);
  if (idx === -1) return;

  const squad = squads[idx];
  squad.members = squad.members.filter(m => m.user_id !== userId);

  // If empty or owner left, delete squad
  if (squad.members.length === 0 || squad.owner_id === userId) {
    squads.splice(idx, 1);
  }

  saveAllSquads(squads);
  setMySquadId(null);
}

function getMySquad(): Squad | null {
  const id = getMySquadId();
  if (!id) return null;
  const squads = getAllSquads();
  return squads.find(s => s.id === id) || null;
}

function updateMyProgress(
  squadId: string,
  userId: string,
  streak: number,
  completionToday: number
): void {
  const squads = getAllSquads();
  const squad = squads.find(s => s.id === squadId);
  if (!squad) return;

  const member = squad.members.find(m => m.user_id === userId);
  if (!member) return;

  member.streak = streak;
  member.completion_today = completionToday;
  saveAllSquads(squads);
}

export const squadService = {
  createSquad,
  joinSquad,
  leaveSquad,
  getMySquad,
  updateMyProgress,
  generateInviteCode,
};
