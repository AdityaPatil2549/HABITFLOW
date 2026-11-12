import { db, getOrCreateUserXP } from '@/db';
import { normalizeAccentTheme, normalizeShopItemId } from '@/lib/theme';
import type { ShopItem, ShopPurchase } from '@/types';

const SHOP_CATALOG: ShopItem[] = [
  // ── Signal Inks (Tier 2 Accent Cartridges) ──────────────────
  {
    id: 'ocean',
    name: 'Cobalt Blue Ink',
    description: 'Precision drafting blue cartridge for calm structural focus.',
    icon: '🖋️',
    category: 'theme',
    price: 100,
    rarity: 'common',
    preview: 'ocean',
  },
  {
    id: 'forest',
    name: 'Signal Green Ink',
    description: 'Clean instrument emerald ink for momentum and continuity.',
    icon: '🖋️',
    category: 'theme',
    price: 120,
    rarity: 'rare',
    preview: 'forest',
  },
  {
    id: 'violet',
    name: 'Ultraviolet Ink',
    description: 'Deep studio violet cartridge for deliberate deep-work sessions.',
    icon: '🖋️',
    category: 'theme',
    price: 150,
    rarity: 'rare',
    preview: 'violet',
  },
  {
    id: 'gold',
    name: 'Amber Brass Ink',
    description: 'Warm precision brass ink inspired by chronograph indices.',
    icon: '🖋️',
    category: 'theme',
    price: 200,
    rarity: 'epic',
    preview: 'gold',
  },
  {
    id: 'rose',
    name: 'Crimson Ink',
    description: 'Sharp Swiss vermilion-rose cartridge for urgent execution.',
    icon: '🖋️',
    category: 'theme',
    price: 200,
    rarity: 'epic',
    preview: 'rose',
  },
  {
    id: 'cyan',
    name: 'Cyan Grid Ink',
    description: 'Technical blueprint cyan ink for crisp telemetry readouts.',
    icon: '🖋️',
    category: 'theme',
    price: 250,
    rarity: 'legendary',
    preview: 'cyan',
  },

  // ── Protection Gear (Continuity Shields & Identity Frames) ───
  {
    id: 'streak_freeze',
    name: 'Continuity Shield',
    description: 'Missed a day? Deploy a freeze token to preserve momentum without guilt.',
    icon: '🛡️',
    category: 'consumable',
    price: 150,
    rarity: 'epic',
  },
  {
    id: 'frame_emerald',
    name: 'Emerald Chassis',
    description: 'Lush signal-green perimeter bezel for your operator profile.',
    icon: '💚',
    category: 'avatar',
    price: 120,
    rarity: 'rare',
  },
  {
    id: 'frame_gold',
    name: 'Brass Bezel Frame',
    description: 'Brushed chronograph brass avatar bezel.',
    icon: '🥇',
    category: 'avatar',
    price: 150,
    rarity: 'rare',
  },
  {
    id: 'frame_fire',
    name: 'Ember Ring Frame',
    description: 'High-contrast orange signal ring frame.',
    icon: '🔥',
    category: 'avatar',
    price: 200,
    rarity: 'epic',
  },
  {
    id: 'frame_diamond',
    name: 'Diamond Precision Frame',
    description: 'Crystal facet precision bezel for top-tier consistency.',
    icon: '💎',
    category: 'avatar',
    price: 350,
    rarity: 'legendary',
  },
  {
    id: 'badge_neon',
    name: 'Signal Badge Mount',
    description: 'Crisp high-contrast border mount for earned milestones.',
    icon: '◈',
    category: 'badge_frame',
    price: 80,
    rarity: 'common',
  },
  {
    id: 'badge_royal',
    name: 'Executive Crest Mount',
    description: 'Archival violet-brass mount for milestone commendations.',
    icon: '🏛️',
    category: 'badge_frame',
    price: 200,
    rarity: 'epic',
  },

  // ── Acoustic Switch Packs ────────────────────────────────────
  {
    id: 'acoustic_switch_pack',
    name: 'Tactile Switch Pack',
    description: 'Crisp 40ms mechanical detent & relay latch release acoustics.',
    icon: '🎚️',
    category: 'acoustic_pack',
    price: 300,
    rarity: 'epic',
  },
  {
    id: 'acoustic_chime_pack',
    name: 'Studio Brass Pack',
    description: 'Warm damped wooden click and soft brass harmonic latch.',
    icon: '🎛️',
    category: 'acoustic_pack',
    price: 180,
    rarity: 'rare',
  },
  {
    id: 'acoustic_pulse_pack',
    name: 'Monastic Pulse Pack',
    description: 'Ultra-dry sub-audible studio tap for low-distraction focus.',
    icon: '📻',
    category: 'acoustic_pack',
    price: 120,
    rarity: 'common',
  },
];

// ─── Coin Earning Rates ──────────────────────────────────────
export const COIN_RATES = {
  HABIT_COMPLETE: 5,
  ALL_DAILY_COMPLETE: 20,
  STREAK_7: 50,
  STREAK_30: 200,
  STREAK_100: 500,
  TASK_COMPLETE: 3,
  PERFECT_WEEK: 100,
} as const;

async function getBalance(): Promise<number> {
  const xp = await getOrCreateUserXP();
  if (xp.coins === undefined || xp.coins === null) {
    xp.coins = Math.max(0, Math.floor((xp.total || 0) / 2));
    await db.userXP.update(xp.id, { coins: xp.coins }).catch(() => null);
  }
  return xp.coins;
}

async function addCoins(amount: number, _reason: string): Promise<number> {
  const xp = await getOrCreateUserXP();
  xp.coins = (xp.coins || 0) + amount;
  await db.userXP.put(xp);
  return xp.coins;
}

async function spendCoins(amount: number): Promise<boolean> {
  const xp = await getOrCreateUserXP();
  if ((xp.coins || 0) < amount) return false;
  xp.coins = (xp.coins || 0) - amount;

  await db.userXP.put(xp);

  // Dispatch event so header updates instantly
  window.dispatchEvent(new CustomEvent('coins-updated'));
  window.dispatchEvent(new CustomEvent('xp-updated'));

  return true;
}

function getShopItems(): ShopItem[] {
  return [...SHOP_CATALOG];
}

async function getPurchasedItems(): Promise<ShopPurchase[]> {
  const purchases = await db.shop_purchases.toArray();
  return purchases.map(p => ({
    ...p,
    item_id: normalizeShopItemId(p.item_id),
  }));
}

async function isItemPurchased(itemId: string): Promise<boolean> {
  const normalizedTarget = normalizeShopItemId(itemId);
  const all = await getPurchasedItems();
  return all.some(p => p.item_id === normalizedTarget || p.item_id === itemId);
}

async function purchaseItem(item: ShopItem): Promise<boolean> {
  // Check if already owned (supporting legacy item aliases)
  if (await isItemPurchased(item.id)) return false;

  // Check balance
  const success = await spendCoins(item.price);
  if (!success) return false;

  // Record purchase
  const purchase: ShopPurchase = {
    id: crypto.randomUUID(),
    item_id: item.id,
    purchased_at: new Date().toISOString(),
  };
  await db.shop_purchases.add(purchase);

  // Apply item effects
  if (item.category === 'theme') {
    const xp = await getOrCreateUserXP();
    if (!xp.unlockedThemes) xp.unlockedThemes = [];
    const normalizedTheme = normalizeAccentTheme(item.id);
    if (!xp.unlockedThemes.includes(normalizedTheme)) {
      xp.unlockedThemes.push(normalizedTheme);
      await db.userXP.put(xp);
    }
  }

  return true;
}

export const coinService = {
  getBalance,
  addCoins,
  spendCoins,
  getShopItems,
  getPurchasedItems,
  isItemPurchased,
  purchaseItem,
  COIN_RATES,
};
