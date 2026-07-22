import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CHARACTER: '@lifequest_character',
  TASKS: '@lifequest_tasks',
  COMPLETED_TASKS: '@lifequest_completed_tasks',
  COINS: '@lifequest_coins',
};

async function saveData(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Save error:', e);
    return false;
  }
}

async function loadData(key, defaultValue = null) {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Load error:', e);
    return defaultValue;
  }
}

async function clearAll() {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    return true;
  } catch (e) {
    console.error('Clear error:', e);
    return false;
  }
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

async function recordTaskCompleted(xpEarned) {
  const today = getTodayKey();
  const week = getWeekKey();

  const dailyLog = await loadData('@lifequest_daily_log', {});
  if (!dailyLog[today]) {
    dailyLog[today] = { completed: 0, xpEarned: 0, tasks: [] };
  }
  dailyLog[today].completed += 1;
  dailyLog[today].xpEarned += xpEarned;
  dailyLog[today].tasks.push({ time: new Date().toISOString(), xp: xpEarned });
  await saveData('@lifequest_daily_log', dailyLog);

  const weeklyLog = await loadData('@lifequest_weekly_log', {});
  if (!weeklyLog[week]) {
    weeklyLog[week] = { completed: 0, xpEarned: 0 };
  }
  weeklyLog[week].completed += 1;
  weeklyLog[week].xpEarned += xpEarned;
  await saveData('@lifequest_weekly_log', weeklyLog);
}

async function getTodayStats() {
  const today = getTodayKey();
  const dailyLog = await loadData('@lifequest_daily_log', {});
  return dailyLog[today] || { completed: 0, xpEarned: 0, tasks: [] };
}

async function getWeeklyStats() {
  const week = getWeekKey();
  const weeklyLog = await loadData('@lifequest_weekly_log', {});
  return weeklyLog[week] || { completed: 0, xpEarned: 0 };
}

async function logAchievement(achievement) {
  const log = await loadData('@lifequest_achievements_log', []);
  const exists = log.find(a => a.id === achievement.id);
  if (!exists) {
    log.push({ ...achievement, earnedAt: new Date().toISOString() });
    await saveData('@lifequest_achievements_log', log);
  }
}

async function getRecentAchievements(limit = 5) {
  const log = await loadData('@lifequest_achievements_log', []);
  return log.slice(-limit).reverse();
}

export {
  KEYS,
  saveData,
  loadData,
  clearAll,
  getTodayKey,
  getWeekKey,
  recordTaskCompleted,
  getTodayStats,
  getWeeklyStats,
  logAchievement,
  getRecentAchievements,
};
