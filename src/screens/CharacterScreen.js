import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { getLevelInfo, getCharacterStage, UNLOCKABLE_ITEMS } from '../data/CharacterData';
import { loadData, saveData, KEYS } from '../utils/Storage';
import { DEFAULT_CHARACTER } from '../data/CharacterData';
import CharacterView from '../components/CharacterView';

function ShopItem({ item, owned, equipped, onPress, delay }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={[styles.itemCard, equipped && styles.equippedCard, !owned && styles.lockedCard]}
        onPress={onPress}
      >
        <Text style={styles.itemIcon}>{item.icon}</Text>
        <Text style={[styles.itemName, equipped && styles.equippedText]}>{item.name}</Text>
        {owned ? (
          <Text style={[styles.itemStatus, equipped ? styles.equippedStatus : styles.ownedStatus]}>
            {equipped ? 'EQUIPPED' : 'Tap to equip'}
          </Text>
        ) : (
          <Text style={styles.lockedStatus}>Lv.{item.minLevel} 🔒</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CharacterScreen() {
  const [character, setCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState('customize');

  useFocusEffect(useCallback(async () => {
    let c = await loadData(KEYS.CHARACTER);
    if (!c) {
      c = { ...DEFAULT_CHARACTER };
      await saveData(KEYS.CHARACTER, c);
    }
    setCharacter(c);
  }, []));

  const updateCharacter = async (updates) => {
    const updated = { ...character, ...updates };
    setCharacter(updated);
    await saveData(KEYS.CHARACTER, updated);
  };

  const equipItem = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (character.level < item.minLevel) {
      Alert.alert('Level too low', `Reach level ${item.minLevel} to unlock ${item.name}`);
      return;
    }
    const currentEquipped = character.customization?.[item.type];
    const type = item.type;
    const newCustomization = {
      ...character.customization,
      [type]: currentEquipped === item.id ? null : item.id,
    };
    updateCharacter({ customization: newCustomization });
  };

  const renameCharacter = () => {
    Alert.prompt('Rename Hero', 'Enter a new name:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Rename', onPress: (name) => {
        if (name?.trim()) updateCharacter({ name: name.trim() });
      }},
    ]);
  };

  if (!character) {
    return <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>;
  }

  const levelInfo = getLevelInfo(character.level);
  const stage = getCharacterStage(character.level);

  const allItems = UNLOCKABLE_ITEMS.filter(i => {
    if (activeTab === 'customize') return true;
    if (activeTab === 'hats') return i.type === 'hat';
    if (activeTab === 'accessories') return i.type === 'accessory';
    if (activeTab === 'auras') return i.type === 'aura';
    return true;
  });

  const stats = [
    { label: 'Strength', value: character.stats?.strength || 0, icon: 'barbell-outline', color: '#FF5722' },
    { label: 'Intelligence', value: character.stats?.intelligence || 0, icon: 'bulb-outline', color: '#2196F3' },
    { label: 'Discipline', value: character.stats?.discipline || 0, icon: 'shield-checkmark-outline', color: '#FFD700' },
    { label: 'Spirit', value: character.stats?.spirit || 0, icon: 'heart-outline', color: '#9C27B0' },
    { label: 'Creativity', value: character.stats?.creativity || 0, icon: 'color-palette-outline', color: '#E91E63' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <LinearGradient colors={[stage.color + '33', '#0D0D1A']} style={styles.heroGradient}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
          <CharacterView character={character} size="large" />
          <TouchableOpacity onPress={renameCharacter} style={styles.nameWrap}>
            <Text style={styles.charName}>{character.name || 'Hero'}</Text>
            <Text style={styles.tapRename}>tap to rename</Text>
          </TouchableOpacity>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv.{character.level} {levelInfo.title}</Text>
          </View>
          <Text style={styles.stageText}>{stage.label} Evolution</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsCard}>
        <Text style={styles.statsTitle}>Stats</Text>
        {stats.map((stat, i) => (
          <View key={stat.label} style={styles.statRow}>
            <Ionicons name={stat.icon} size={16} color={stat.color} style={{ width: 30 }} />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <View style={styles.statBarBg}>
              <View style={[styles.statBarFill, {
                width: `${Math.min(stat.value * 5, 100)}%`,
                backgroundColor: stat.color,
              }]} />
            </View>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.shopSection}>
        <Text style={styles.sectionTitle}>Cosmetic Shop</Text>

        <View style={styles.tabRow}>
          {['customize', 'hats', 'accessories', 'auras'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'customize' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.shopGrid}>
          {allItems.map((item, i) => (
            <ShopItem
              key={item.id}
              item={item}
              owned={character.level >= item.minLevel}
              equipped={character.customization?.[item.type] === item.id}
              onPress={() => equipItem(item)}
              delay={400 + i * 50}
            />
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' },
  loadingText: { color: '#FFD700', fontSize: 18 },
  scrollContent: { paddingBottom: 100 },
  heroGradient: { paddingTop: 30, paddingBottom: 20 },
  hero: { alignItems: 'center' },
  nameWrap: { alignItems: 'center', marginTop: 12 },
  charName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  tapRename: { color: '#555', fontSize: 11, marginTop: 2 },
  levelBadge: {
    backgroundColor: '#FFD700', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6, marginTop: 12,
  },
  levelBadgeText: { color: '#0D0D1A', fontWeight: '900', fontSize: 14 },
  stageText: { color: '#888', fontSize: 11, marginTop: 8, textTransform: 'uppercase', letterSpacing: 3 },
  statsCard: {
    backgroundColor: '#1A1A2E', marginHorizontal: 16, borderRadius: 20, padding: 20, marginTop: 8,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  statsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statLabel: { color: '#aaa', fontSize: 13, width: 90 },
  statBarBg: { flex: 1, height: 8, backgroundColor: '#2A2A3E', borderRadius: 4, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 4 },
  statValue: { fontSize: 13, fontWeight: '700', width: 30, textAlign: 'right' },
  shopSection: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  tabRow: { flexDirection: 'row', marginBottom: 14 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1A1A2E', marginRight: 8, borderWidth: 1, borderColor: '#2A2A3E',
  },
  activeTab: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#0D0D1A' },
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  itemCard: {
    width: '48%', backgroundColor: '#1A1A2E', borderRadius: 20, padding: 16, marginBottom: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3E',
  },
  equippedCard: { borderColor: '#FFD700', backgroundColor: '#2A2A1E' },
  lockedCard: { opacity: 0.4 },
  itemIcon: { fontSize: 36, marginBottom: 8 },
  itemName: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  itemStatus: { fontSize: 10, marginTop: 6, fontWeight: '600' },
  equippedStatus: { color: '#FFD700' },
  ownedStatus: { color: '#4CAF50' },
  lockedStatus: { color: '#F44336', fontSize: 11, marginTop: 6, fontWeight: '600' },
});
