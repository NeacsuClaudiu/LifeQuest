import { STREAK_BONUS } from './TaskDatabase';

const DEFAULT_CHARACTER = {
  name: 'Hero',
  level: 1,
  evolutionStage: 0,
  currentXp: 0,
  totalXpEarned: 0,
  tasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  consecutiveDays: 0,
  lastActiveDate: null,
  daysSkipped: 0,
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

const EVOLUTION_STAGES = [
  { id: 0, name: 'Seed', description: 'A tiny seed waiting to grow', wiltPenalty: 0, evolveAfter: 0 },
  { id: 1, name: 'Sprout', description: 'A small green shoot emerges', wiltPenalty: 0, evolveAfter: 3 },
  { id: 2, name: 'Sapling', description: 'Growing stronger with leaves', wiltPenalty: 0.1, evolveAfter: 3 },
  { id: 3, name: 'Bud', description: 'A flower bud is forming', wiltPenalty: 0.15, evolveAfter: 3 },
  { id: 4, name: 'Bloom', description: 'A beautiful flower in bloom', wiltPenalty: 0.2, evolveAfter: 4 },
  { id: 5, name: 'Tree', description: 'A sturdy young tree', wiltPenalty: 0.25, evolveAfter: 4 },
  { id: 6, name: 'Ancient Tree', description: 'A wise old tree with fruits', wiltPenalty: 0.3, evolveAfter: 5 },
  { id: 7, name: 'Sacred Tree', description: 'A magical glowing tree', wiltPenalty: 0.4, evolveAfter: 0 },
];

const EVOLUTION_SPRITES = {
  0: require('../../assets/characters/seedling.png'),
  1: require('../../assets/characters/sprout.png'),
  2: require('../../assets/characters/sapling.png'),
  3: require('../../assets/characters/bud.png'),
  4: require('../../assets/characters/bloom.png'),
  5: require('../../assets/characters/tree.png'),
  6: require('../../assets/characters/ancient.png'),
  7: require('../../assets/characters/sacred.png'),
};

const EVOLUTION_COLORS = [
  '#8B7355',
  '#7CB342',
  '#66BB6A',
  '#F48FB1',
  '#E91E63',
  '#4CAF50',
  '#FF9800',
  '#FFD700',
];

function getEvolutionStage(stage) {
  return EVOLUTION_STAGES[Math.min(stage, EVOLUTION_STAGES.length - 1)];
}

function getEvolutionSprite(stage) {
  return EVOLUTION_SPRITES[Math.min(stage, EVOLUTION_STAGES.length - 1)] || EVOLUTION_SPRITES[0];
}

function getEvolutionColor(stage) {
  return EVOLUTION_COLORS[Math.min(stage, EVOLUTION_COLORS.length - 1)];
}

function processDayCheck(character) {
  const now = new Date();
  const today = now.toDateString();
  const c = { ...character };

  if (!c.lastActiveDate) {
    c.lastActiveDate = today;
    c.consecutiveDays = 0;
    c.daysSkipped = 0;
    return c;
  }

  const lastDate = new Date(c.lastActiveDate);
  const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return c;
  }

  if (diffDays === 1) {
    c.consecutiveDays = (c.consecutiveDays || 0) + 1;
    c.daysSkipped = 0;
  } else if (diffDays === 2) {
    c.consecutiveDays = Math.max(0, (c.consecutiveDays || 0) - 1);
    c.daysSkipped = 2;
    c = devolveCharacter(c, 1);
  } else if (diffDays >= 3 && diffDays <= 6) {
    c.consecutiveDays = 0;
    c.daysSkipped = diffDays;
    c = devolveCharacter(c, 2);
  } else {
    c.consecutiveDays = 0;
    c.daysSkipped = diffDays;
    c.evolutionStage = 0;
    c.currentStreak = 0;
  }

  c.lastActiveDate = today;
  return c;
}

function devolveCharacter(character, amount) {
  const c = { ...character };
  c.evolutionStage = Math.max(0, c.evolutionStage - amount);
  return c;
}

function evolveCharacter(character) {
  const c = { ...character };
  const maxStage = EVOLUTION_STAGES.length - 1;
  if (c.evolutionStage < maxStage) {
    const stageInfo = EVOLUTION_STAGES[c.evolutionStage];
    if (c.consecutiveDays >= stageInfo.evolveAfter && stageInfo.evolveAfter > 0) {
      c.evolutionStage = c.evolutionStage + 1;
      c.consecutiveDays = 0;
    }
  }
  return c;
}

function getXpPenalty(character) {
  const skipped = character.daysSkipped || 0;
  if (skipped === 0) return 0;
  if (skipped === 1) return 0.10;
  if (skipped === 2) return 0.25;
  if (skipped <= 6) return 0.50;
  return 0.75;
}

function calculateReward(baseXp, levelMultiplier, streakDays, character) {
  const base = baseXp * levelMultiplier;
  const streakBonus = getStreakBonus(streakDays);
  const penalty = getXpPenalty(character);
  const total = (base + streakBonus) * (1 - penalty);
  return Math.round(Math.max(total, 1));
}

function getStreakBonus(days) {
  const keys = Object.keys(STREAK_BONUS).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (days >= k) return STREAK_BONUS[k];
  }
  return 0;
}

const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Novice', multiplier: 1.0 },
  { level: 2, xpRequired: 100, title: 'Apprentice', multiplier: 1.0 },
  { level: 3, xpRequired: 250, title: 'Striver', multiplier: 1.0 },
  { level: 4, xpRequired: 450, title: 'Focused', multiplier: 1.0 },
  { level: 5, xpRequired: 700, title: 'Determined', multiplier: 1.1 },
  { level: 6, xpRequired: 1000, title: 'Disciplined', multiplier: 1.1 },
  { level: 7, xpRequired: 1400, title: 'Warrior', multiplier: 1.1 },
  { level: 8, xpRequired: 1900, title: 'Champion', multiplier: 1.2 },
  { level: 9, xpRequired: 2500, title: 'Elite', multiplier: 1.2 },
  { level: 10, xpRequired: 3200, title: 'Legend', multiplier: 1.3 },
  { level: 11, xpRequired: 4000, title: 'Mythic', multiplier: 1.3 },
  { level: 12, xpRequired: 5000, title: 'Ascended', multiplier: 1.5 },
];

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
  return {
    level: level || 1,
    title: current ? current.title : 'Legend',
    currentXpRequired,
    nextXpRequired,
    multiplier: current ? current.multiplier : 1.5,
  };
}

const UNLOCKABLE_ITEMS = [
  { id: 'hat_leaf', name: 'Leaf Hat', type: 'hat', minLevel: 2, cost: 50, icon: 'leaf' },
  { id: 'hat_crown', name: 'Crown', type: 'hat', minLevel: 5, cost: 150, icon: 'diamond' },
  { id: 'hat_wizard', name: 'Wizard Hat', type: 'hat', minLevel: 8, cost: 300, icon: 'moon' },
  { id: 'hat_flame', name: 'Flame Crown', type: 'hat', minLevel: 11, cost: 500, icon: 'flame' },
  { id: 'acc_shield', name: 'Shield', type: 'accessory', minLevel: 3, cost: 100, icon: 'shield' },
  { id: 'acc_sword', name: 'Sword', type: 'accessory', minLevel: 4, cost: 120, icon: 'flash' },
  { id: 'acc_book', name: 'Tome of Wisdom', type: 'accessory', minLevel: 6, cost: 200, icon: 'book' },
  { id: 'acc_wings', name: 'Angelic Wings', type: 'accessory', minLevel: 10, cost: 400, icon: 'heart' },
  { id: 'aura_glow', name: 'Soft Glow', type: 'aura', minLevel: 4, cost: 100, icon: 'sunny' },
  { id: 'aura_fire', name: 'Fire Aura', type: 'aura', minLevel: 7, cost: 250, icon: 'flame' },
  { id: 'aura_galaxy', name: 'Galaxy Aura', type: 'aura', minLevel: 10, cost: 450, icon: 'planet' },
  { id: 'aura_divine', name: 'Divine Light', type: 'aura', minLevel: 12, cost: 700, icon: 'star' },
];

export {
  DEFAULT_CHARACTER,
  EVOLUTION_STAGES,
  EVOLUTION_SPRITES,
  EVOLUTION_COLORS,
  getEvolutionStage,
  getEvolutionSprite,
  getEvolutionColor,
  processDayCheck,
  evolveCharacter,
  devolveCharacter,
  getXpPenalty,
  calculateReward,
  getStreakBonus,
  getLevel,
  getLevelInfo,
  LEVEL_THRESHOLDS,
  UNLOCKABLE_ITEMS,
};
