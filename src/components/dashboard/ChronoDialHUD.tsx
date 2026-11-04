import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Sparkles,
  Compass,
  Palette,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useChronoStore, PaletteWorld, ChronoEpoch } from '../../store/chronoStore';
import { soundService } from '../../services/soundService';
import { cn } from '../../lib/utils';

export function ChronoDialHUD() {
  const {
    mode,
    simulatedHour,
    currentEpoch,
    activeWorld,
    setMode,
    setSimulatedHour,
    setActiveWorld,
    syncWithSystemClock,
  } = useChronoStore();

  const [expanded, setExpanded] = useState(false);
  const [showWorldMenu, setShowWorldMenu] = useState(false);
  const lastTickTime = useRef(0);

  // Format hour (float 0-24) to 12-hour AM/PM string
  const formatTime = (h: number) => {
    const hours = Math.floor(h);
    const minutes = Math.floor((h - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const displayMin = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHour}:${displayMin} ${period}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const now = Date.now();
    if (now - lastTickTime.current > 75) {
      soundService.playChronoDialTick();
      lastTickTime.current = now;
    }
    setSimulatedHour(val);
  };

  const handleEpochSnap = (targetHour: number) => {
    soundService.playChronoDialTick();
    setSimulatedHour(targetHour);
  };

  const worlds: { id: PaletteWorld; name: string; accent: string; bg: string }[] = [
    { id: 'neo-kinpaku', name: 'Neo-Kinpaku', accent: '#f59e0b', bg: '#06080d' },
    { id: 'cyber-obsidian', name: 'Cyber-Obsidian', accent: '#6366f1', bg: '#05060f' },
    { id: 'polar-titanium', name: 'Polar Titanium', accent: '#06b6d4', bg: '#06090e' },
    { id: 'volcanic-basalt', name: 'Volcanic Basalt', accent: '#ef4444', bg: '#0a0606' },
    { id: 'monolith-zero', name: 'Monolith Zero', accent: '#ffffff', bg: '#000000' },
  ];

  const getEpochIcon = (epoch: ChronoEpoch) => {
    switch (epoch) {
      case 'dawn':
        return <Sunrise className="w-4 h-4 text-amber-400" />;
      case 'zenith':
        return <Sun className="w-4 h-4 text-cyan-400" />;
      case 'dusk':
        return <Sunset className="w-4 h-4 text-amber-500" />;
      case 'night':
        return <Moon className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
      {/* Outer Titanium Dock Glass Frame */}
      <motion.div
        layout
        className="relative bg-[#0c0f1a]/85 backdrop-blur-2xl border border-white/[0.12] rounded-full shadow-[0_24px_60px_rgba(0,0,0,0.7)] px-4 sm:px-6 py-2.5 flex items-center gap-3 sm:gap-4 transition-all duration-300"
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
        }}
      >
        {/* Epoch & Time Indicator */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-white/[0.1]">
          <div className="p-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
            {getEpochIcon(currentEpoch)}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 leading-none">
              {currentEpoch}
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-tight mt-0.5">
              {formatTime(simulatedHour)}
            </span>
          </div>
        </div>

        {/* 24-Hour Analog Scrubber Slider */}
        <div className="flex items-center gap-2 w-32 sm:w-48">
          <input
            type="range"
            min="0"
            max="23.9"
            step="0.1"
            value={simulatedHour}
            onChange={handleSliderChange}
            aria-label="Circadian Time Scrubber"
            className="w-full h-1.5 bg-white/[0.1] rounded-full appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 focus:outline-none transition-all"
            style={{
              accentColor: 'var(--chrono-accent, #f59e0b)',
            }}
          />
        </div>

        {/* Quick Epoch Jumpers */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => handleEpochSnap(7)}
            title="Snap to Dawn (07:00)"
            className={cn(
              'px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer',
              currentEpoch === 'dawn'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            Dawn
          </button>
          <button
            onClick={() => handleEpochSnap(13)}
            title="Snap to Zenith (13:00)"
            className={cn(
              'px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer',
              currentEpoch === 'zenith'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            Noon
          </button>
          <button
            onClick={() => handleEpochSnap(18.5)}
            title="Snap to Neo-Kinpaku Dusk (18:30)"
            className={cn(
              'px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer',
              currentEpoch === 'dusk'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            Dusk
          </button>
          <button
            onClick={() => handleEpochSnap(22.5)}
            title="Snap to Nocturnal Starlight (22:30)"
            className={cn(
              'px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer',
              currentEpoch === 'night'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            Night
          </button>
        </div>

        {/* Auto-Circadian Lock Button */}
        <button
          onClick={() => {
            soundService.playChronoDialTick();
            setMode(mode === 'auto' ? 'manual' : 'auto');
          }}
          title={mode === 'auto' ? 'Locked to Real-Time Clock' : 'Click to Sync with System Time'}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer border',
            mode === 'auto'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              mode === 'auto' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            )}
          />
          <span>{mode === 'auto' ? 'Live' : 'Sync'}</span>
        </button>

        {/* World Preset Selector Toggle */}
        <button
          onClick={() => setShowWorldMenu(prev => !prev)}
          title="Switch Signature World"
          className={cn(
            'p-1.5 rounded-full transition-all cursor-pointer border',
            showWorldMenu
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'text-slate-400 border-transparent hover:text-white hover:bg-white/[0.06]'
          )}
        >
          <Palette className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* World Selector Popover Drawer */}
      <AnimatePresence>
        {showWorldMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-[#0a0d16]/95 backdrop-blur-3xl border border-white/[0.14] rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 px-2 py-1 mb-1">
              Bespoke Signature Worlds
            </div>
            <div className="space-y-1">
              {worlds.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    soundService.playChronoDialTick();
                    setActiveWorld(w.id);
                    setShowWorldMenu(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                    activeWorld === w.id
                      ? 'bg-white/[0.1] text-white shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: w.accent }}
                    />
                    <span>{w.name}</span>
                  </div>
                  {activeWorld === w.id && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Active</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChronoDialHUD;
