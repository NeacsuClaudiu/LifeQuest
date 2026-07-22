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

export { KEYS, saveData, loadData, clearAll };
