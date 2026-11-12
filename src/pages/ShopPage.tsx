import { useState, useEffect } from 'react';
import { coinService } from '@/services/coinService';
import type { ShopItem, Theme } from '@/types';
import {
  Palette,
  Shield,
  Volume2,
  Check,
  Lock,
  Layers,
  Zap,
  Play,
} from 'lucide-react';
import { useToast } from '@/components/common/toastStore';
import { soundService, type AcousticPackId } from '@/services/soundService';
import {
  ACCENT_CARTRIDGES,
  applyAppearanceToDocument,
  normalizeAccentTheme,
  resolvePolarityMode,
} from '@/lib/theme';

type ArmoryFilter = 'all' | 'theme' | 'gear' | 'acoustic_pack';

const ARMORY_TABS: { id: ArmoryFilter; label: string; icon: typeof Layers }[] = [
  { id: 'all', label: 'All Gear', icon: Layers },
  { id: 'theme', label: 'Signal Inks', icon: Palette },
  { id: 'gear', label: 'Protection Gear', icon: Shield },
  { id: 'acoustic_pack', label: 'Acoustic Packs', icon: Volume2 },
];

const RARITY_BORDER: Record<ShopItem['rarity'], string> = {
  common: 'border-[var(--border-default)]',
  rare: 'border-[var(--accent)]',
  epic: 'border-[var(--accent)]',
  legendary: 'border-amber-500/60',
};

function matchesArmoryTab(item: ShopItem, filter: ArmoryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'theme') return item.category === 'theme';
  if (filter === 'acoustic_pack') return item.category === 'acoustic_pack';
  return (
    item.category === 'consumable' ||
    item.category === 'avatar' ||
    item.category === 'badge_frame'
  );
}

export function ShopPage() {
  const [balance, setBalance] = useState(0);
  const [filter, setFilter] = useState<ArmoryFilter>('all');
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<string>('obsidian');
  const [equippedPack, setEquippedPack] = useState<AcousticPackId>(soundService.getAcousticPack());
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const toast = useToast();

  const shopItems = coinService.getShopItems();

  async function loadData() {
    const [{ getOrCreateSettings }, bal, purchases] = await Promise.all([
      import('@/db'),
      coinService.getBalance(),
      coinService.getPurchasedItems(),
    ]);
    const settings = await getOrCreateSettings();
    setBalance(bal);
    setPurchased(new Set(purchases.map(p => p.item_id)));
    setActiveTheme(normalizeAccentTheme(settings.theme));
  }

  useEffect(() => {
    document.title = 'Armory — HabitFlow';
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = shopItems.filter(item => matchesArmoryTab(item, filter));

  async function handleEquipTheme(themeId: string) {
    const normalized = normalizeAccentTheme(themeId);
    const { db, getOrCreateSettings } = await import('@/db');
    const settings = await getOrCreateSettings();
    await db.settings.update(settings.id, { theme: normalized as Theme });
    applyAppearanceToDocument(resolvePolarityMode(settings), normalized);
    window.dispatchEvent(new CustomEvent('habitflow-appearance-changed'));
    setActiveTheme(normalized);
    soundService.playTick();
    toast.success('Ink cartridge equipped');
  }

  function handleEquipPack(packId: AcousticPackId) {
    soundService.setAcousticPack(packId);
    soundService.previewPack(packId);
    setEquippedPack(packId);
    toast.success('Acoustic switch pack active');
  }

  async function handlePurchase(item: ShopItem) {
    if (item.category !== 'consumable' && purchased.has(item.id)) return;
    if (balance < item.price) {
      toast.error('Insufficient coins');
      return;
    }

    setPurchasing(item.id);
    if (item.id === 'streak_freeze') {
      const success = await coinService.spendCoins(item.price);
      if (success) {
        const { getOrCreateUserXP, db } = await import('@/db');
        const xp = await getOrCreateUserXP();
        xp.streakFreezes = (xp.streakFreezes || 0) + 1;
        await db.userXP.put(xp);

        const { useGamificationStore } = await import('@/store/gamificationStore');
        await useGamificationStore.getState().loadXP();

        soundService.playUnlatchClick();
        toast.success(`Acquired ${item.name}`);
        await loadData();
      } else {
        toast.error('Purchase failed');
      }
      setPurchasing(null);
      return;
    }

    const success = await coinService.purchaseItem(item);
    if (success) {
      const { useGamificationStore } = await import('@/store/gamificationStore');
      await useGamificationStore.getState().loadXP();

      soundService.playUnlatchClick();
      toast.success(`Unlocked ${item.name}`);
      await loadData();

      if (item.category === 'theme' && item.preview) {
        await handleEquipTheme(item.preview);
      } else if (item.category === 'acoustic_pack') {
        handleEquipPack(item.id as AcousticPackId);
      }
    } else {
      toast.error('Purchase failed');
    }
    setPurchasing(null);
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <p className="font-label-caps">Workspace / Armory</p>
          <h1 className="font-h1 text-[var(--tx-primary)] mt-1">Armory</h1>
          <p className="text-sm text-[var(--tx-secondary)] mt-1">
            Reinvest execution coins into Signal Inks, Continuity Shields, and Acoustic Packs.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--sf-raised)] border border-[var(--border-strong)] font-mono self-start sm:self-auto">
          <Zap size={16} className="text-[var(--accent-ink)]" />
          <span className="font-data text-lg font-bold text-[var(--tx-primary)]">{balance}</span>
          <span className="text-xs uppercase tracking-wider text-[var(--tx-muted)]">Coins</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div
        role="tablist"
        aria-label="Armory categories"
        className="flex gap-1.5 p-1 bg-[var(--sf-raised)] rounded-xl border border-[var(--border-default)] overflow-x-auto"
      >
        {ARMORY_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setFilter(tab.id);
                soundService.playTick();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                  : 'text-[var(--tx-secondary)] hover:text-[var(--tx-primary)]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Armory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const owned = item.category === 'consumable' ? false : purchased.has(item.id);
          const canAfford = balance >= item.price;
          const isPurchasing = purchasing === item.id;
          const cartridge =
            item.category === 'theme'
              ? ACCENT_CARTRIDGES.find(c => c.id === item.id)
              : undefined;
          const isEquippedTheme =
            item.category === 'theme' && activeTheme === normalizeAccentTheme(item.id);
          const isEquippedPack =
            item.category === 'acoustic_pack' && equippedPack === item.id;

          return (
            <div
              key={item.id}
              onMouseEnter={() => {
                if (cartridge) setHoveredTheme(cartridge.swatchDark);
              }}
              onMouseLeave={() => {
                if (cartridge) setHoveredTheme(null);
              }}
              className={`card-raised p-5 flex flex-col justify-between gap-4 transition-colors duration-100 ${RARITY_BORDER[item.rarity]}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  {cartridge ? (
                    <span
                      className="w-10 h-10 rounded-xl border border-[var(--border-strong)] flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: cartridge.swatchDark,
                        outline:
                          hoveredTheme === cartridge.swatchDark
                            ? `2px solid ${cartridge.swatchDark}`
                            : undefined,
                        outlineOffset: '2px',
                      }}
                    >
                      <Palette size={16} className="text-white" />
                    </span>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)] flex items-center justify-center text-xl shrink-0">
                      <span aria-hidden="true">{item.icon}</span>
                    </div>
                  )}

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-[var(--sf-overlay)] text-[var(--tx-secondary)] border border-[var(--border-default)]">
                    {item.rarity}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[var(--tx-primary)]">{item.name}</h2>
                  <p className="text-xs text-[var(--tx-secondary)] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-default)]">
                {item.category === 'acoustic_pack' && (
                  <button
                    type="button"
                    onClick={() => soundService.previewPack(item.id as AcousticPackId)}
                    aria-label={`Sample ${item.name}`}
                    className="btn-secondary px-2.5 py-1.5 text-xs inline-flex items-center gap-1.5"
                  >
                    <Play size={11} />
                    <span>Sample</span>
                  </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {owned ? (
                    item.category === 'theme' ? (
                      <button
                        type="button"
                        disabled={isEquippedTheme}
                        onClick={() => handleEquipTheme(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border ${
                          isEquippedTheme
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border-[var(--accent)] cursor-default'
                            : 'btn-secondary'
                        }`}
                      >
                        <Check size={13} />
                        <span>{isEquippedTheme ? 'Equipped' : 'Equip'}</span>
                      </button>
                    ) : item.category === 'acoustic_pack' ? (
                      <button
                        type="button"
                        disabled={isEquippedPack}
                        onClick={() => handleEquipPack(item.id as AcousticPackId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border ${
                          isEquippedPack
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent-ink)] border-[var(--accent)] cursor-default'
                            : 'btn-secondary'
                        }`}
                      >
                        <Check size={13} />
                        <span>{isEquippedPack ? 'Active' : 'Activate'}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-ink)] text-xs font-semibold border border-[var(--border-default)]">
                        <Check size={13} />
                        <span>Owned</span>
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford || isPurchasing}
                      className="btn-primary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
                    >
                      {!canAfford ? <Lock size={12} /> : <Zap size={12} />}
                      <span className="font-data">{item.price} Coins</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* How to earn coins */}
      <section className="card-raised p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-[var(--accent-ink)]" />
          <h2 className="font-label-caps">Coin Yield Schedule</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Complete daily habit', coins: '+5 Coins' },
            { label: 'Complete tactical task', coins: '+10 Coins' },
            { label: 'All daily habits & streaks', coins: '+20 to +500' },
          ].map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--sf-overlay)] border border-[var(--border-default)]"
            >
              <span className="text-xs text-[var(--tx-secondary)]">{row.label}</span>
              <span className="font-data text-xs font-bold text-[var(--accent-ink)]">
                {row.coins}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
export default ShopPage;
