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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-slate-900 tracking-tight">
            Rewards Shop
          </h1>
          <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">Earn XP, unlock premium content</p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400/10 border border-amber-400/20"
        >
          <Zap size={20} className="text-amber-400" />
          <span className="text-lg font-black text-amber-400">{balance}</span>
        </motion.div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-1 dark:bg-slate-800/60 bg-slate-200/60 rounded-xl border dark:border-white/5 border-slate-900/5 overflow-x-auto hide-scrollbar">
        {CATEGORY_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                category === tab.id
                  ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'dark:text-slate-400 text-slate-500 dark:hover:text-slate-200 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((item, idx) => {
          const owned = item.category === 'consumable' ? false : purchased.has(item.id);
          const canAfford = balance >= item.price;
          const rarity = RARITY_STYLES[item.rarity];
          const isPurchasing = purchasing === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="h-full"
            >
              <TiltCard tiltIntensity={12} className="h-full block">
                <div className={`relative h-full rounded-2xl glass-card-3d border ${rarity.border} overflow-hidden group hover:bg-white/10 transition-all ${rarity.glow ? `shadow-xl ${rarity.glow}` : ''}`}>
                  {/* Legendary shimmer */}
                  {item.rarity === 'legendary' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-[shimmer_2s_infinite] pointer-events-none" />
                  )}

                  <div className="relative p-4 flex flex-col items-center text-center">
                    {/* Rarity badge */}
                    <span
                      className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${rarity.badge}`}
                    >
                      {item.rarity}
                    </span>

                    {/* Icon */}
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>

                    {/* Name & Description */}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.name}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Price / Status */}
                    {owned ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <Check size={14} />
                        Owned
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!canAfford || isPurchasing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/20'
                            : 'bg-white/5 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isPurchasing ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : !canAfford ? (
                          <Lock size={12} />
                        ) : (
                          <Zap size={12} />
                        )}
                        {item.price}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-white border dark:border-white/5 border-slate-900/5 shadow-sm"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-[10px] dark:text-slate-400 text-slate-500">{item.label}</p>
                    <p className="text-xs font-bold text-amber-500 dark:text-amber-400">{typeof item.coins === 'number' ? `+${item.coins}` : item.coins}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>
      </motion.div>
    </div>
  );
}
