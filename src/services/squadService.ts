/**
 * Squad Service — Social Accountability Groups
 * Uses Firestore for real-time multiplayer squads.
 */
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import type { Squad, SquadMember } from '@/types';

const MY_SQUADS_KEY = 'habitflow_my_squad_ids';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getMySquadIds(): string[] {
  const ids = localStorage.getItem(MY_SQUADS_KEY);
  if (!ids) {
    const oldId = localStorage.getItem('habitflow_my_squad_id');
    if (oldId) {
      setMySquadIds([oldId]);
      localStorage.removeItem('habitflow_my_squad_id');
      return [oldId];
    }
    return [];
  }
  try {
    return JSON.parse(ids);
  } catch {
    return [];
  }
}

function setMySquadIds(ids: string[]): void {
  localStorage.setItem(MY_SQUADS_KEY, JSON.stringify(ids));
}

function addSquadId(id: string) {
  const ids = getMySquadIds();
  if (!ids.includes(id)) {
    setMySquadIds([...ids, id]);
  }
}

function removeSquadId(id: string) {
  const ids = getMySquadIds();
  setMySquadIds(ids.filter(i => i !== id));
}

async function createSquad(
  name: string,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<Squad | null> {
  if (!isFirebaseConfigured()) {
    return mockCreateSquad(name, userId, displayName, avatarUrl);
  }

  const inviteCode = generateInviteCode();
  const squadId = crypto.randomUUID();

  // 1. Create Squad doc
  const squadDocRef = doc(db, 'squads', squadId);
  const now = new Date().toISOString();
  await setDoc(squadDocRef, {
    id: squadId,
    name,
    invite_code: inviteCode,
    owner_id: userId,
    created_at: now
  });

  // 2. Create Squad Member doc
  const memberDocRef = doc(db, 'squad_members', `${squadId}_${userId}`);
  await setDoc(memberDocRef, {
    squad_id: squadId,
    user_id: userId,
    display_name: displayName,
    avatar_url: avatarUrl || null,
    streak: 0,
    completion_today: 0,
    joined_at: now
  });

  addSquadId(squadId);

  return {
    id: squadId,
    name,
    invite_code: inviteCode,
    owner_id: userId,
    created_at: now,
    members: [
      {
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
        streak: 0,
        completion_today: 0,
        joined_at: now,
      },
    ],
  };
}

async function joinSquad(
  inviteCode: string,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<Squad | null> {
  if (!isFirebaseConfigured()) {
    return mockJoinSquad(inviteCode, userId, displayName, avatarUrl);
  }

  // 1. Find Squad by invite code
  const squadsRef = collection(db, 'squads');
  const q = query(squadsRef, where('invite_code', '==', inviteCode.trim().toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.error('[SquadService] Invalid invite code or squad not found');
    return null;
  }

  const squadData = snapshot.docs[0].data();
  const squadId = squadData.id;

  // 2. Check member count
  const membersRef = collection(db, 'squad_members');
  const membersQuery = query(membersRef, where('squad_id', '==', squadId));
  const membersSnapshot = await getDocs(membersQuery);

  if (membersSnapshot.size >= 5) {
    console.error('[SquadService] Squad is full');
    return null;
  }

  // 3. Insert Member
  const memberDocRef = doc(db, 'squad_members', `${squadId}_${userId}`);
  await setDoc(memberDocRef, {
    squad_id: squadId,
    user_id: userId,
    display_name: displayName,
    avatar_url: avatarUrl || null,
    streak: 0,
    completion_today: 0,
    joined_at: new Date().toISOString()
  }, { merge: true });

  addSquadId(squadId);
  
  const squads = await getMySquads();
  return squads.find(s => s.id === squadId) || null;
}

async function leaveSquad(squadId: string, userId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    return mockLeaveSquad(squadId, userId);
  }

  const memberDocRef = doc(db, 'squad_members', `${squadId}_${userId}`);
  await deleteDoc(memberDocRef);

  removeSquadId(squadId);
}

async function getMySquads(): Promise<Squad[]> {
  if (!isFirebaseConfigured()) {
    return mockGetMySquads();
  }
  const ids = getMySquadIds();
  if (ids.length === 0) return [];

  const validSquads: Squad[] = [];
  const activeIds: string[] = [];

  for (const squadId of ids) {
    // 1. Get Squad
    const squadDoc = await getDoc(doc(db, 'squads', squadId));
    if (!squadDoc.exists()) continue;
    
    const squadData = squadDoc.data();
    activeIds.push(squadId);

    // 2. Get Members
    const membersQuery = query(collection(db, 'squad_members'), where('squad_id', '==', squadId));
    const membersSnapshot = await getDocs(membersQuery);

    const members: SquadMember[] = membersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        user_id: data.user_id,
        display_name: data.display_name || 'Anonymous',
        avatar_url: data.avatar_url,
        streak: data.streak || 0,
        completion_today: data.completion_today || 0,
        joined_at: data.joined_at,
      };
    });

    validSquads.push({
      id: squadData.id,
      name: squadData.name,
      invite_code: squadData.invite_code,
      owner_id: squadData.owner_id,
      created_at: squadData.created_at,
      members,
    });
  }

  if (activeIds.length !== ids.length) {
    setMySquadIds(activeIds);
  }

  return validSquads;
}

async function updateMyProgress(
  userId: string,
  streak: number,
  completionToday: number
): Promise<void> {
  if (!isFirebaseConfigured()) {
    return mockUpdateProgress(userId, streak, completionToday);
  }

  const squadIds = getMySquadIds();
  if (squadIds.length === 0) return;

  for (const squadId of squadIds) {
    const memberDocRef = doc(db, 'squad_members', `${squadId}_${userId}`);
    try {
      await updateDoc(memberDocRef, {
        streak,
        completion_today: completionToday,
      });
    } catch (err) {
      // Document might not exist if they were removed
      console.error('[SquadService] Failed to update progress for squad', squadId, err);
    }
  }
}

function subscribeToSquad(squadId: string, onUpdate: () => void) {
  if (!isFirebaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const q = query(collection(db, 'squad_members'), where('squad_id', '==', squadId));
  const unsubscribe = onSnapshot(q, () => {
    onUpdate();
  });

  return {
    unsubscribe
  };
}

export const squadService = {
  createSquad,
  joinSquad,
  leaveSquad,
  getMySquads,
  updateMyProgress,
  generateInviteCode,
  subscribeToSquad,
};

// ─── MOCK DATA IMPLEMENTATION ────────────────────────────────────

const MOCK_DB_KEY = 'habitflow_mock_squads_db';

function getMockDb(): Record<string, Squad> {
  try {
    return JSON.parse(localStorage.getItem(MOCK_DB_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveMockDb(mockData: Record<string, Squad>) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(mockData));
}

async function mockCreateSquad(
  name: string,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<Squad | null> {
  const mockData = getMockDb();
  const squadId = crypto.randomUUID();
  const inviteCode = generateInviteCode();

  const newSquad: Squad = {
    id: squadId,
    name,
    invite_code: inviteCode,
    owner_id: userId,
    created_at: new Date().toISOString(),
    members: [
      {
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
        streak: 0,
        completion_today: 0,
        joined_at: new Date().toISOString(),
      },
      {
        user_id: 'mock_1',
        display_name: 'Alex (Mock)',
        streak: 12,
        completion_today: 0.8,
        joined_at: new Date().toISOString(),
      },
      {
        user_id: 'mock_2',
        display_name: 'Sam (Mock)',
        streak: 5,
        completion_today: 1.0,
        joined_at: new Date().toISOString(),
      },
    ],
  };

  mockData[squadId] = newSquad;
  saveMockDb(mockData);
  addSquadId(squadId);
  return newSquad;
}

async function mockJoinSquad(
  inviteCode: string,
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<Squad | null> {
  const mockData = getMockDb();
  const squad = Object.values(mockData).find(s => s.invite_code === inviteCode.trim().toUpperCase());

  if (!squad) return null;
  if (squad.members.length >= 5) return null;

  if (!squad.members.find(m => m.user_id === userId)) {
    squad.members.push({
      user_id: userId,
      display_name: displayName,
      avatar_url: avatarUrl,
      streak: 0,
      completion_today: 0,
      joined_at: new Date().toISOString(),
    });
    saveMockDb(mockData);
  }

  addSquadId(squad.id);
  return squad;
}

async function mockLeaveSquad(squadId: string, userId: string): Promise<void> {
  const mockData = getMockDb();
  const squad = mockData[squadId];
  if (squad) {
    squad.members = squad.members.filter(m => m.user_id !== userId);
    saveMockDb(mockData);
  }
  removeSquadId(squadId);
}

async function mockGetMySquads(): Promise<Squad[]> {
  const mockData = getMockDb();
  const ids = getMySquadIds();
  return ids.map(id => mockData[id]).filter(Boolean);
}

async function mockUpdateProgress(
  userId: string,
  streak: number,
  completionToday: number
): Promise<void> {
  const mockData = getMockDb();
  let updated = false;

  for (const squad of Object.values(mockData)) {
    const member = squad.members.find(m => m.user_id === userId);
    if (member) {
      member.streak = streak;
      member.completion_today = completionToday;
      updated = true;
    }
  }

  if (updated) {
    saveMockDb(mockData);
  }
}
