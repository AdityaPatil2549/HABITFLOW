/**
 * Coin Service — Manages the HabitFlow economy
 * Users earn coins alongside XP and spend them in the Rewards Shop.
 */
import { db, getOrCreateUserXP } from '@/db';
import type { ShopItem, ShopPurchase } from '@/types';

// ─── Shop Catalog ────────────────────────────────────────────
const SHOP_CATALOG: ShopItem[] = [
  // Themes
  {
    id: 'neon',
    name: 'Neon Pulse',
    description: 'Electric neon accents that glow in the dark',
    icon: '💜',
    category: 'theme',
    price: 200,
    rarity: 'rare',
    preview: 'neon',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic cyber aesthetic with sharp edges',
    icon: '🤖',
    category: 'theme',
    price: 300,
    rarity: 'epic',
    preview: 'cyberpunk',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm sunset gradients for a cozy feel',
    icon: '🌅',
    category: 'theme',
    price: 200,
    rarity: 'rare',
    preview: 'sunset',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Calm ocean depths with aqua accents',
    icon: '🌊',
    category: 'theme',
    price: 150,
    rarity: 'common',
    preview: 'ocean',
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    description: 'Mystical green tones of the deep woods',
    icon: '🌲',
    category: 'theme',
    price: 150,
    rarity: 'common',
    preview: 'forest',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Shimmering northern lights across your UI',
    icon: '🌌',
    category: 'theme',
    price: 500,
    rarity: 'legendary',
    preview: 'aurora',
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    description: 'Delicate pink petals and soft hues',
    icon: '🌸',
    category: 'theme',
    price: 250,
    rarity: 'rare',
    preview: 'cherry',
  },
  {
    id: 'volcanic',
    name: 'Volcanic Core',
    description: 'Molten lava intensity for maximum focus',
    icon: '🌋',
    category: 'theme',
    price: 350,
    rarity: 'epic',
    preview: 'volcanic',
  },

  // Avatar Frames
  {
    id: 'frame_gold',
    name: 'Gold Frame',
    description: 'Prestigious gold border for your avatar',
    icon: '👑',
    category: 'avatar',
    price: 100,
    rarity: 'rare',
  },
  {
    id: 'frame_fire',
    name: 'Fire Frame',
    description: 'Burning streak frame — show your dedication',
    icon: '🔥',
    category: 'avatar',
    price: 150,
    rarity: 'epic',
  },
  {
    id: 'frame_diamond',
    name: 'Diamond Frame',
    description: 'Sparkling diamond edge — ultimate flex',
    icon: '💎',
    category: 'avatar',
    price: 400,
    rarity: 'legendary',
  },
  {
    id: 'frame_emerald',
    name: 'Emerald Frame',
    description: 'Lush green gemstone border',
    icon: '💚',
    category: 'avatar',
    price: 120,
    rarity: 'rare',
  },

  // Icon Packs
  {
    id: 'icons_minimal',
    name: 'Minimal Pack',
    description: '20 clean minimal habit icons',
    icon: '✨',
    category: 'icon_pack',
    price: 75,
    rarity: 'common',
  },
  {
    id: 'icons_kawaii',
    name: 'Kawaii Pack',
    description: 'Adorable Japanese-style icons',
    icon: '🌸',
    category: 'icon_pack',
    price: 100,
    rarity: 'rare',
  },
  {
    id: 'icons_space',
    name: 'Space Pack',
    description: 'Cosmic and astronaut-themed icons',
    icon: '🚀',
    category: 'icon_pack',
    price: 120,
    rarity: 'rare',
  },

  // Badge Frames
  {
    id: 'badge_neon',
    name: 'Neon Badge Frame',
    description: 'Make your badges glow with neon',
    icon: '💡',
    category: 'badge_frame',
    price: 80,
    rarity: 'common',
  },
  {
    id: 'badge_royal',
    name: 'Royal Badge Frame',
    description: 'Royal purple and gold badge border',
    icon: '🏰',
    category: 'badge_frame',
    price: 200,
    rarity: 'epic',
  },

  // --- New Additions ---
  {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Missed a day? Use this to save your streak!',
    icon: '🧊',
    category: 'consumable',
    price: 150,
    rarity: 'epic',
  },
  {
    id: 'midnight',
    name: 'Midnight Dark',
    description: 'Pure black background for OLED screens',
    icon: '🌙',
    category: 'theme',
    price: 300,
    rarity: 'epic',
    preview: 'midnight',
  },
  {
    id: 'pastel',
    name: 'Pastel Dream',
    description: 'Soft and soothing pastel colors',
    icon: '🎨',
    category: 'theme',
    price: 150,
    rarity: 'common',
    preview: 'pastel',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Minimalist black and white elegance',
    icon: '⬛',
    category: 'theme',
    price: 250,
    rarity: 'rare',
    preview: 'monochrome',
  },
  {
    id: 'galaxy',
    name: 'Deep Galaxy',
    description: 'Stars and nebulae across your app',
    icon: '⭐',
    category: 'theme',
    price: 450,
    rarity: 'legendary',
    preview: 'galaxy',
  },
  {
    id: 'icons_pixel',
    name: 'Pixel Art Pack',
    description: 'Retro 8-bit style icons',
    icon: '👾',
    category: 'icon_pack',
    price: 150,
    rarity: 'rare',
  },
  {
    id: 'icons_3d',
    name: '3D Render Pack',
    description: 'Beautifully rendered 3D habit icons',
    icon: '🧊',
    category: 'icon_pack',
    price: 300,
    rarity: 'epic',
  },
  {
    id: 'icons_nature',
    name: 'Nature Pack',
    description: 'Leaves, trees, and organic shapes',
    icon: '🌿',
    category: 'icon_pack',
    price: 100,
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
  return xp.total || 0;
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
  return db.shop_purchases.toArray();
}

async function isItemPurchased(itemId: string): Promise<boolean> {
  const purchase = await db.shop_purchases.where('item_id').equals(itemId).first();
  return !!purchase;
}

async function purchaseItem(item: ShopItem): Promise<boolean> {
  // Check if already owned
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
    if (!xp.unlockedThemes.includes(item.id)) {
      xp.unlockedThemes.push(item.id);
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
