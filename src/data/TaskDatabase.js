const DIFFICULTIES = {
  easy: { label: 'Easy', xp: 10, color: '#4CAF50', icon: '🌱' },
  medium: { label: 'Medium', xp: 25, color: '#FF9800', icon: '🔥' },
  hard: { label: 'Hard', xp: 50, color: '#F44336', icon: '💪' },
  epic: { label: 'Epic', xp: 100, color: '#9C27B0', icon: '⚡' },
};

const CATEGORIES = [
  { id: 'phone_detox', label: 'Phone Detox', icon: '📵', color: '#607D8B' },
  { id: 'workout', label: 'Workout', icon: '💪', color: '#FF5722' },
  { id: 'learning', label: 'Learning', icon: '📚', color: '#2196F3' },
  { id: 'reading', label: 'Reading', icon: '📖', color: '#795548' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹', color: '#009688' },
  { id: 'mindfulness', label: 'Mindfulness', icon: '🧘', color: '#9C27B0' },
  { id: 'health', label: 'Health', icon: '🥗', color: '#4CAF50' },
  { id: 'creative', label: 'Creative', icon: '✍️', color: '#E91E63' },
  { id: 'social', label: 'Social', icon: '🤝', color: '#FF9800' },
  { id: 'custom', label: 'Custom', icon: '⭐', color: '#607D8B' },
];

const PRESET_TASKS = [
  { title: 'No phone for 1 hour', category: 'phone_detox', difficulty: 'easy' },
  { title: 'No phone for 3 hours', category: 'phone_detox', difficulty: 'medium' },
  { title: 'No phone for 6 hours', category: 'phone_detox', difficulty: 'hard' },
  { title: 'Full day digital detox', category: 'phone_detox', difficulty: 'epic' },
  { title: '15 min workout', category: 'workout', difficulty: 'easy' },
  { title: '30 min workout', category: 'workout', difficulty: 'medium' },
  { title: '1 hour intense workout', category: 'workout', difficulty: 'hard' },
  { title: '30 min study/learning', category: 'learning', difficulty: 'medium' },
  { title: '1 hour study session', category: 'learning', difficulty: 'hard' },
  { title: 'Complete a course module', category: 'learning', difficulty: 'epic' },
  { title: 'Read 10 pages', category: 'reading', difficulty: 'easy' },
  { title: 'Read 30 pages', category: 'reading', difficulty: 'medium' },
  { title: 'Read a book chapter', category: 'reading', difficulty: 'hard' },
  { title: 'Clean desk / workspace', category: 'cleaning', difficulty: 'easy' },
  { title: 'Clean one room', category: 'cleaning', difficulty: 'medium' },
  { title: 'Deep clean entire space', category: 'cleaning', difficulty: 'hard' },
  { title: '5 min meditation', category: 'mindfulness', difficulty: 'easy' },
  { title: '15 min meditation', category: 'mindfulness', difficulty: 'medium' },
  { title: '30 min meditation', category: 'mindfulness', difficulty: 'hard' },
  { title: 'Drink 8 glasses of water', category: 'health', difficulty: 'easy' },
  { title: 'Cook a healthy meal', category: 'health', difficulty: 'medium' },
  { title: 'Intermittent fast 16h', category: 'health', difficulty: 'hard' },
  { title: 'Write a journal entry', category: 'creative', difficulty: 'easy' },
  { title: 'Write 500 words', category: 'creative', difficulty: 'medium' },
  { title: 'Complete a creative project', category: 'creative', difficulty: 'epic' },
  { title: 'Call a friend/family', category: 'social', difficulty: 'easy' },
  { title: 'Social event / meetup', category: 'social', difficulty: 'medium' },
  { title: 'Volunteer / help someone', category: 'social', difficulty: 'hard' },
  { title: 'Wake up at 6 AM', category: 'health', difficulty: 'medium' },
  { title: 'Cold shower', category: 'health', difficulty: 'hard' },
  { title: 'Stretch for 10 min', category: 'workout', difficulty: 'easy' },
  { title: 'Learn 10 new words', category: 'learning', difficulty: 'easy' },
  { title: 'Practice instrument 30min', category: 'creative', difficulty: 'medium' },
  { title: 'Organize phone apps', category: 'phone_detox', difficulty: 'easy' },
  { title: 'No social media all day', category: 'phone_detox', difficulty: 'hard' },
];

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

const CHARACTER_STAGES = [
  { minLevel: 0, label: 'Seedling', emoji: '🌱', color: '#8BC34A' },
  { minLevel: 3, label: 'Sprout', emoji: '🌿', color: '#4CAF50' },
  { minLevel: 6, label: 'Bloom', emoji: '🌸', color: '#E91E63' },
  { minLevel: 9, label: 'Guardian', emoji: '🌳', color: '#FF9800' },
  { minLevel: 12, label: 'Phoenix', emoji: '🔥', color: '#F44336' },
];

const STREAK_BONUS = { 3: 10, 7: 25, 14: 50, 30: 100, 60: 200 };

export {
  DIFFICULTIES,
  CATEGORIES,
  PRESET_TASKS,
  LEVEL_THRESHOLDS,
  CHARACTER_STAGES,
  STREAK_BONUS,
};
