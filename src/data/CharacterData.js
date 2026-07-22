import { LEVEL_THRESHOLDS, CHARACTER_STAGES, STREAK_BONUS } from './TaskDatabase';

const DEFAULT_CHARACTER = {
  name: 'Hero',
  level: 1,
  currentXp: 0,
  totalXpEarned: 0,
  tasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  customization: {
    hat: null,
    accessory: null,
    aura: null,
    color: '#4CAF50',
  },
  stats: {
    strength: 0,
    intelligence: 0,
    discipline: 0,
    spirit: 0,
    creativity: 0,
  },
  unlockedItems: ['base_form'],
  achievements: [],
};

function getLevel(totalXp) {
  let level = 1;
  for (const t of LEVEL_THRESHOLDS) {
    if (totalXp >= t.xpRequired) level = t.level;
    else break;
  }
  return Math.min(level, LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level);
}

function getLevelInfo(level) {
  const current = LEVEL_THRESHOLDS.find(t => t.level === level) || LEVEL_THRESHOLDS[0];
  const next = LEVEL_THRESHOLDS.find(t => t.level === level + 1);
  const currentXpRequired = current ? current.xpRequired : 0;
  const nextXpRequired = next ? next.xpRequired : currentXpRequired + 1000;
  const progress = next
    ? ((level - currentXpRequired) / (nextXpRequired - currentXpRequired)) * 100
    : 100;
  return {
    level: level || 1,
    title: current ? current.title : 'Legend',
    currentXpRequired,
    nextXpRequired,
    progress: Math.min(progress, 100),
    multiplier: current ? current.multiplier : 1.5,
  };
}

function getCharacterStage(level) {
  let stage = CHARACTER_STAGES[0];
  for (const s of CHARACTER_STAGES) {
    if (level >= s.minLevel) stage = s;
  }
  return stage;
}

function getStreakBonus(days) {
  const keys = Object.keys(STREAK_BONUS).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (days >= k) return STREAK_BONUS[k];
  }
  return 0;
}

function calculateReward(difficultyXp, levelMultiplier, streakDays) {
  const base = difficultyXp * levelMultiplier;
  const streakBonus = getStreakBonus(streakDays);
  return Math.round(base + streakBonus);
}

const UNLOCKABLE_ITEMS = [
  { id: 'hat_leaf', name: 'Leaf Hat', type: 'hat', minLevel: 2, cost: 50, icon: '🍃' },
  { id: 'hat_crown', name: 'Crown', type: 'hat', minLevel: 5, cost: 150, icon: '👑' },
  { id: 'hat_wizard', name: 'Wizard Hat', type: 'hat', minLevel: 8, cost: 300, icon: '🎩' },
  { id: 'hat_flame', name: 'Flame Crown', type: 'hat', minLevel: 11, cost: 500, icon: '🔥' },
  { id: 'acc_shield', name: 'Shield', type: 'accessory', minLevel: 3, cost: 100, icon: '🛡️' },
  { id: 'acc_sword', name: 'Sword', type: 'accessory', minLevel: 4, cost: 120, icon: '⚔️' },
  { id: 'acc_book', name: 'Tome of Wisdom', type: 'accessory', minLevel: 6, cost: 200, icon: '📕' },
  { id: 'acc_wings', name: 'Angelic Wings', type: 'accessory', minLevel: 10, cost: 400, icon: '👼' },
  { id: 'aura_glow', name: 'Soft Glow', type: 'aura', minLevel: 4, cost: 100, icon: '✨' },
  { id: 'aura_fire', name: 'Fire Aura', type: 'aura', minLevel: 7, cost: 250, icon: '🔥' },
  { id: 'aura_galaxy', name: 'Galaxy Aura', type: 'aura', minLevel: 10, cost: 450, icon: '🌌' },
  { id: 'aura_divine', name: 'Divine Light', type: 'aura', minLevel: 12, cost: 700, icon: '☀️' },
];

export {
  DEFAULT_CHARACTER,
  getLevel,
  getLevelInfo,
  getCharacterStage,
  getStreakBonus,
  calculateReward,
  UNLOCKABLE_ITEMS,
};
