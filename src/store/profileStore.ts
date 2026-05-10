import { create } from 'zustand';

const PROFILE_KEY = 'habitflow_profile';

interface Profile {
  name: string;
  bio: string;
  avatar: string | null;
}

interface ProfileState {
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  saveProfile: (p: Partial<Profile>) => void;
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { name: 'Alex', bio: '', avatar: null, ...JSON.parse(raw) };
  } catch {}
  return { name: 'Alex', bio: '', avatar: null };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: loadProfile(),

  setProfile: (partial) => {
    set(state => ({ profile: { ...state.profile, ...partial } }));
  },

  saveProfile: (partial) => {
    const updated = { ...get().profile, ...partial };
    set({ profile: updated });
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('profile-updated'));
    } catch {}
  },
}));

// Sync from storage events (cross-tab)
if (typeof window !== 'undefined') {
  const sync = () => {
    useProfileStore.getState().setProfile(loadProfile());
  };
  window.addEventListener('storage', sync);
  window.addEventListener('profile-updated', () => {
    useProfileStore.setState({ profile: loadProfile() });
  });
}
