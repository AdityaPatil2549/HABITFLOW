import { create } from 'zustand';

export type ChronoEpoch = 'dawn' | 'zenith' | 'dusk' | 'night';

export type PaletteWorld =
  | 'neo-kinpaku'
  | 'cyber-obsidian'
  | 'polar-titanium'
  | 'volcanic-basalt'
  | 'monolith-zero';

interface ChronoSolarState {
  elevationDeg: number;
  sunXPercent: number;
  sunYPercent: number;
  glowOpacity: number;
}

interface ChronoState {
  mode: 'auto' | 'manual';
  simulatedHour: number; // 0 to 24
  currentEpoch: ChronoEpoch;
  activeWorld: PaletteWorld;
  solarState: ChronoSolarState;

  // Actions
  setMode: (mode: 'auto' | 'manual') => void;
  setSimulatedHour: (hour: number) => void;
  setActiveWorld: (world: PaletteWorld) => void;
  syncWithSystemClock: () => void;
}

// Map hour (0-24) to circadian diurnal epoch
export function getEpochFromHour(hour: number): ChronoEpoch {
  const norm = ((hour % 24) + 24) % 24;
  if (norm >= 5 && norm < 12) return 'dawn';
  if (norm >= 12 && norm < 17) return 'zenith';
  if (norm >= 17 && norm < 21) return 'dusk';
  return 'night';
}

// Calculate virtual solar coordinates based on hour
export function calculateSolarState(hour: number): ChronoSolarState {
  const norm = ((hour % 24) + 24) % 24;

  // Daytime: 05:00 to 20:59
  if (norm >= 5 && norm <= 21) {
    const dayProgress = (norm - 5) / 16; // 0 at 05:00, 1 at 21:00
    // Solar altitude curve: 0 at 5:00, peaks at 13:00 (progress 0.5), 0 at 21:00
    const elevationDeg = Math.sin(dayProgress * Math.PI) * 78 + 5;
    const sunXPercent = Math.round(15 + dayProgress * 70); // 15% to 85%
    const sunYPercent = Math.round(75 - Math.sin(dayProgress * Math.PI) * 60); // 75% at sunrise/set, 15% at noon
    const glowOpacity = Math.max(0.15, Math.sin(dayProgress * Math.PI) * 0.45);
    return { elevationDeg, sunXPercent, sunYPercent, glowOpacity };
  }

  // Nighttime (Lunar orbit: 21:00 to 05:00)
  const nightHours = norm > 21 ? norm - 21 : norm + 3; // 0 to 8
  const nightProgress = nightHours / 8;
  const elevationDeg = Math.sin(nightProgress * Math.PI) * 45;
  const sunXPercent = Math.round(25 + nightProgress * 50); // 25% to 75%
  const sunYPercent = Math.round(65 - Math.sin(nightProgress * Math.PI) * 35);
  return { elevationDeg, sunXPercent, sunYPercent, glowOpacity: 0.12 };
}

function applyToDocument(epoch: ChronoEpoch, world: PaletteWorld, hour: number, solar: ChronoSolarState) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-chrono', epoch);
  root.setAttribute('data-world', world);

  root.style.setProperty('--chrono-hour', hour.toFixed(2));
  root.style.setProperty('--sun-elevation', `${solar.elevationDeg.toFixed(1)}deg`);
  root.style.setProperty('--sun-x', `${solar.sunXPercent}%`);
  root.style.setProperty('--sun-y', `${solar.sunYPercent}%`);
  root.style.setProperty('--sun-glow-opacity', solar.glowOpacity.toFixed(2));
}

function getInitialSystemHour(): number {
  if (typeof window === 'undefined') return 14;
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

const initialHour = getInitialSystemHour();
const initialEpoch = getEpochFromHour(initialHour);
const initialSolar = calculateSolarState(initialHour);

export const useChronoStore = create<ChronoState>((set, get) => {
  // Apply initial state to DOM immediately on creation
  if (typeof document !== 'undefined') {
    applyToDocument(initialEpoch, 'neo-kinpaku', initialHour, initialSolar);
  }

  return {
    mode: 'auto',
    simulatedHour: initialHour,
    currentEpoch: initialEpoch,
    activeWorld: 'neo-kinpaku',
    solarState: initialSolar,

    setMode: (mode) => {
      set({ mode });
      if (mode === 'auto') {
        get().syncWithSystemClock();
      }
    },

    setSimulatedHour: (hour) => {
      const epoch = getEpochFromHour(hour);
      const solar = calculateSolarState(hour);
      applyToDocument(epoch, get().activeWorld, hour, solar);
      set({
        simulatedHour: hour,
        currentEpoch: epoch,
        solarState: solar,
        mode: 'manual', // Dragging scrubber moves to manual
      });
    },

    setActiveWorld: (world) => {
      const { currentEpoch, simulatedHour, solarState } = get();
      applyToDocument(currentEpoch, world, simulatedHour, solarState);
      set({ activeWorld: world });
    },

    syncWithSystemClock: () => {
      const hour = getInitialSystemHour();
      const epoch = getEpochFromHour(hour);
      const solar = calculateSolarState(hour);
      applyToDocument(epoch, get().activeWorld, hour, solar);
      set({
        mode: 'auto',
        simulatedHour: hour,
        currentEpoch: epoch,
        solarState: solar,
      });
    },
  };
});
