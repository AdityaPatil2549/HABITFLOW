import { useState, useEffect } from 'react';
import { coinService } from '@/services/coinService';
import type { ShopItem } from '@/types';
import {
  Crown,
  Palette,
  Package,
  Check,
  Lock,
  ShoppingBag,
  Zap,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/common/Toast';
import { soundService } from '@/services/soundService';
import { TiltCard } from '@/components/ui/TiltCard';
import { TextEffect } from '@/components/ui/text-effect';
import { InView } from '@/components/ui/in-view';
import { lazy, Suspense } from 'react';

const GamificationBackground = lazy(() => import('@/components/gamification/GamificationBackground'));

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: ShoppingBag },
  { id: 'theme', label: 'Themes', icon: Palette },
  { id: 'avatar', label: 'Frames', icon: Crown },
  { id: 'icon_pack', label: 'Icons', icon: Package },
  { id: 'badge_frame', label: 'Badges', icon: Star },
  { id: 'consumable', label: 'Power-ups', icon: Zap },
] as const;

const RARITY_STYLES: Record<string, { border: string; glow: string; badge: string }> = {
  common: { border: 'border-slate-500/30', glow: '', badge: 'bg-slate-500/20 text-slate-400' },
  rare: {
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-400',
  },
  epic: {
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/15',
    badge: 'bg-purple-500/20 text-purple-400',
  },
  legendary: {
    border: 'border-amber-400/40',
    glow: 'shadow-amber-400/20',
    badge: 'bg-amber-400/20 text-amber-400',
  },
};

export function ShopPage() {
  const [balance, setBalance] = useState(0);
  const [category, setCategory] = useState('all');
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const toast = useToast();

  const shopItems = coinService.getShopItems();

  async function loadData() {
    const [bal, purchases] = await Promise.all([
      coinService.getBalance(),
      coinService.getPurchasedItems(),
    ]);
    setBalance(bal);
    setPurchased(new Set(purchases.map(p => p.item_id)));
  }

  useEffect(() => {
    document.title = 'Rewards Shop — HabitFlow';
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = category === 'all' ? shopItems : shopItems.filter(i => i.category === category);

  async function handlePurchase(item: ShopItem) {
    if (purchased.has(item.id)) return;
    if (balance < item.price) {
      toast.error('Not enough XP!');
      return;
    }

    setPurchasing(item.id);
    if (item.id === 'streak_freeze') {
      const success = await coinService.spendCoins(item.price);
      if (success) {
        const { gamificationService } = await import('@/services/gamificationService');
        // Actually buyStreakFreeze just does the coin math, but we did it via spendCoins. Let's use buyStreakFreeze directly or just increment the freeze count.
        const { getOrCreateUserXP, db } = await import('@/db');
        const xp = await getOrCreateUserXP();
        xp.streakFreezes = (xp.streakFreezes || 0) + 1;
        await db.userXP.put(xp);
        soundService.playLevelUp();
        toast.success(`🎉 Bought ${item.name}!`);
        await loadData();
      } else {
        toast.error('Purchase failed');
      }
      setPurchasing(null);
      return;
    }

    const success = await coinService.purchaseItem(item);
    if (success) {
      soundService.playLevelUp();
      toast.success(`🎉 Unlocked ${item.name}!`);
      await loadData();

      // Apply theme instantly if it's a theme item
      if (item.category === 'theme' && item.preview) {
        const root = document.documentElement;
        if (item.preview === 'indigo') {
          root.removeAttribute('data-theme');
        } else {
          root.setAttribute('data-theme', item.preview);
        }
        // Persist to Settings so it survives page reload
        const { db, getOrCreateSettings } = await import('@/db');
        const s = await getOrCreateSettings();
        await db.settings.update(s.id, { theme: item.preview as any });
      }
    } else {
      toast.error('Purchase failed');
    }
    setPurchasing(null);
  }

  return (
    <div className="space-y-6 relative pb-10">
      <Suspense fallback={null}>
        <GamificationBackground />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>XP Economy & Rewards</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Rewards Marketplace
          </h1>
          <p className="text-sm text-slate-400 mt-1">Reinvest consistency XP into exclusive visual artifacts.</p>
        </div>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 shadow-[0_0_20px_rgba(245,158,11,0.2)] font-mono self-start sm:self-auto"
        >
          <Zap size={20} className="text-amber-400" />
          <span className="text-lg font-black text-amber-400 tabular-nums">{balance}</span>
          <span className="text-xs text-amber-400/70 uppercase tracking-widest font-sans font-bold">XP</span>
        </motion.div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-[#0e111a]/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-x-auto hide-scrollbar shadow-lg">
        {CATEGORY_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = category === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCategory(tab.id);
                soundService.playTick();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm border border-white/20 backdrop-blur-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-amber-400' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 auto-rows-fr">
        {filtered.map((item, idx) => {
          const owned = item.category === 'consumable' ? false : purchased.has(item.id);
          const canAfford = balance >= item.price;
          const rarity = RARITY_STYLES[item.rarity];
          const isPurchasing = purchasing === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.04, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className={`h-full ${item.category === 'theme' ? 'col-span-2' : 'col-span-1'}`}
            >
              <TiltCard tiltIntensity={item.category === 'theme' ? 5 : 10} className="h-full block">
                <div className={`relative h-full rounded-2xl border ${rarity.border} overflow-hidden group bg-[#0e111a]/75 backdrop-blur-2xl shadow-lg transition-[transform,box-shadow,border-color] duration-300 ease-out hover:border-amber-400/40 ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`}>
                  {/* Legendary shimmer */}
                  {item.rarity === 'legendary' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-[shimmer_2s_infinite] pointer-events-none" />
                  )}

                  <div className="relative p-5 flex flex-col items-center text-center">
                    {/* Rarity badge */}
                    <span
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${rarity.badge}`}
                    >
                      {item.rarity}
                    </span>

                    {/* Icon */}
                    <div className={`text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 ease-out ${item.category === 'theme' ? 'text-5xl' : ''}`}>
                      {item.icon}
                    </div>

                    {/* Name & Description */}
                    <h3 className="text-sm font-bold text-white mb-1 tracking-tight">{item.name}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Price / Status */}
                    {owned ? (
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        <Check size={14} />
                        Owned
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!canAfford || isPurchasing}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:brightness-110'
                            : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isPurchasing ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : !canAfford ? (
                          <Lock size={12} />
                        ) : (
                          <Zap size={12} className="stroke-[3]" />
                        )}
                        <span>{item.price} XP</span>
                      </button>
                    )}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      {/* How to earn coins */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <TiltCard tiltIntensity={3}>
          <div className="rounded-2xl dark:bg-black/20 bg-slate-100 backdrop-blur-md border dark:border-white/10 border-slate-900/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold dark:text-white text-slate-900">How to Earn XP</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Complete habit', coins: 10, icon: '✅' },
                { label: 'Complete task', coins: 20, icon: '📋' },
                { label: 'Consistency', coins: 'Bonus', icon: '🔥' },
              ].map((item, idx) => (
                <InView
                  key={item.label}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border dark:border-white/5 border-slate-900/5 shadow-sm transition-transform duration-200 ease-out hover:scale-[1.02] h-full"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-[10px] dark:text-slate-400 text-slate-500">{item.label}</p>
                      <p className="text-xs font-bold text-amber-500 dark:text-amber-400">{typeof item.coins === 'number' ? `+${item.coins}` : item.coins}</p>
                    </div>
                  </div>
                </InView>
              ))}
            </div>
          </div>
        </TiltCard>
      </motion.div>
    </div>
  );
}
