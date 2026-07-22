import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { getLevelInfo, getEvolutionStage, getEvolutionColor, processDayCheck, UNLOCKABLE_ITEMS, getElement, ELEMENTS } from '../data/CharacterData';
import { loadData, saveData, KEYS } from '../utils/Storage';
import { DEFAULT_CHARACTER } from '../data/CharacterData';
import CharacterView from '../components/CharacterView';
import { THEMES, isThemePurchased, canAffordTheme, purchaseTheme } from '../data/Themes';
import { useTheme } from '../context/ThemeContext';
import PressableScale from '../components/PressableScale';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import Skeleton, { SkeletonCard } from '../components/Skeleton';

function ShopItem({ item, owned, equipped, onPress, delay, colors }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      layout={Layout.springify()}
    >
      <PressableScale
        style={[styles.itemCard, { backgroundColor: colors.cardBg, borderColor: equipped ? colors.accent : colors.cardBorder }, equipped && styles.equippedCard, !owned && styles.lockedCard]}
        onPress={onPress}
      >
        <Ionicons name={item.icon} size={28} color={equipped ? colors.accent : owned ? colors.success : colors.textMuted} />
        <Text style={[styles.itemName, { color: colors.textPrimary }, equipped && { color: colors.accent }]}>{item.name}</Text>
        {owned ? (
          <Text style={[styles.itemStatus, { color: equipped ? colors.accent : colors.success }]}>
            {equipped ? 'EQUIPPED' : 'Tap to equip'}
          </Text>
        ) : (
          <Text style={[styles.lockedStatus, { color: colors.danger }]}>Lv.{item.minLevel}</Text>
        )}
      </PressableScale>
    </Animated.View>
  );
}

export default function CharacterScreen() {
  const [character, setCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState('customize');
  const { colors, refreshTheme, setThemeId } = useTheme();

  useFocusEffect(useCallback(async () => {
    let c = await loadData(KEYS.CHARACTER);
    if (!c) {
      c = { ...DEFAULT_CHARACTER };
      await saveData(KEYS.CHARACTER, c);
    }
    c = processDayCheck(c);
    await saveData(KEYS.CHARACTER, c);
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
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
        <Skeleton width="50%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="30%" height={14} />
        <View style={{ marginTop: 24, paddingHorizontal: 16, width: '100%' }}>
          <SkeletonCard height={80} />
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
        </View>
      </View>
    );
  }

  const levelInfo = getLevelInfo(character.level);
  const currentElement = character.element || 'plant';
  const elementData = getElement(currentElement);
  const stage = getEvolutionStage(currentElement, character.evolutionStage || 0);
  const stageColor = getEvolutionColor(currentElement);

  const switchElement = async (elementId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = { ...character, element: elementId, evolutionStage: 0, consecutiveDays: 0 };
    setCharacter(updated);
    await saveData(KEYS.CHARACTER, updated);
  };

  const allItems = UNLOCKABLE_ITEMS.filter(i => {
    if (activeTab === 'customize') return true;
    if (activeTab === 'themes') return false;
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      <LinearGradient colors={[stageColor + '33', colors.background]} style={styles.heroGradient}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
          <CharacterView character={character} size="large" />
          <PressableScale onPress={renameCharacter} style={styles.nameWrap}>
            <Text style={[styles.charName, { color: colors.textPrimary }]}>{character.name || 'Hero'}</Text>
            <Text style={[styles.tapRename, { color: colors.textMuted }]}>tap to rename</Text>
          </PressableScale>
          <View style={[styles.levelBadge, { backgroundColor: stageColor }]}>
            <Text style={styles.levelBadgeText}>Lv.{character.level} {levelInfo.title}</Text>
          </View>
          <Text style={[styles.stageText, { color: stageColor }]}>{stage.name} Evolution</Text>
          <Text style={[styles.stageDesc, { color: colors.textSecondary }]}>{stage.description}</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(120).springify()} style={[styles.elementSection, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.elementTitle, { color: colors.textPrimary }]}>Choose Element</Text>
        <View style={styles.elementRow}>
          {Object.values(ELEMENTS).map((el) => (
            <PressableScale
              key={el.id}
              style={[styles.elementBtn, { backgroundColor: colors.cardBorder, borderColor: colors.cardBorder }, currentElement === el.id && { backgroundColor: el.color + '33', borderColor: el.color }]}
              onPress={() => switchElement(el.id)}
            >
              <Ionicons name={el.icon} size={20} color={currentElement === el.id ? el.color : colors.textMuted} />
              <Text style={[styles.elementBtnText, { color: currentElement === el.id ? el.color : colors.textMuted }]}>{el.name}</Text>
            </PressableScale>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).springify()} style={[styles.evoTrack, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.evoTrackTitle, { color: colors.textPrimary }]}>{elementData.name} Evolution</Text>
        <View style={styles.evoRow}>
          {elementData.stages.map((s, i) => (
            <View key={s.id} style={styles.evoNodeWrap}>
              <View style={[
                styles.evoNode,
                { backgroundColor: i <= (character.evolutionStage || 0) ? stageColor : colors.cardBorder, borderColor: colors.cardBorder },
                i === (character.evolutionStage || 0) && styles.evoNodeActive,
              ]}>
                <Text style={[styles.evoNodeNum, i <= (character.evolutionStage || 0) && { color: colors.background }]}>
                  {i}
                </Text>
              </View>
              <Text style={[styles.evoNodeLabel, i === (character.evolutionStage || 0) ? { color: stageColor } : { color: colors.textMuted }]}>
                {s.name}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.statsCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>Stats</Text>
        {stats.map((stat, i) => (
          <View key={stat.label} style={styles.statRow}>
            <Ionicons name={stat.icon} size={16} color={stat.color} style={{ width: 30 }} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
<AnimatedProgressBar progress={Math.min(stat.value * 5, 100)} color={stat.color} height={8} backgroundColor={colors.cardBorder} />
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.shopSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Cosmetic Shop</Text>

        <View style={styles.tabRow}>
          {['customize', 'hats', 'accessories', 'auras', 'themes'].map(tab => (
            <PressableScale
              key={tab}
              style={[styles.tab, { backgroundColor: activeTab === tab ? colors.accent : colors.cardBg, borderColor: activeTab === tab ? colors.accent : colors.cardBorder }]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.buttonText : colors.textMuted }]}>
                {tab === 'customize' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </PressableScale>
          ))}
        </View>

        {activeTab === 'themes' ? (
          <View style={styles.shopGrid}>
            {THEMES.map((theme, i) => {
              const owned = isThemePurchased(character, theme.id);
              const equipped = character.selectedTheme === theme.id;
              const affordable = canAffordTheme(character, theme);
              return (
                <Animated.View key={theme.id} entering={FadeInDown.delay(400 + i * 50).springify()} layout={Layout.springify()} style={{ width: '48%' }}>
                  <PressableScale
                    style={[
                      styles.themeCard,
                      equipped && styles.themeEquippedCard,
                      { backgroundColor: colors.cardBg, borderColor: equipped ? theme.colors.accent : colors.cardBorder },
                    ]}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (!owned) {
                        if (!affordable) {
                          Alert.alert('Not enough Gold', `${theme.name} costs ${theme.cost} gold.`);
                          return;
                        }
                        const updated = purchaseTheme(character, theme.id);
                        setCharacter(updated);
                        await saveData(KEYS.CHARACTER, updated);
                        setThemeId(theme.id);
                        refreshTheme();
                      } else if (!equipped) {
                        const updated = { ...character, selectedTheme: theme.id };
                        setCharacter(updated);
                        await saveData(KEYS.CHARACTER, updated);
                        setThemeId(theme.id);
                        refreshTheme();
                      }
                    }}
                  >
                    <View style={[styles.themePreview, { backgroundColor: theme.colors.background }]}>
                      <View style={[styles.themePreviewCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
                        <View style={[styles.themePreviewAccent, { backgroundColor: theme.colors.accent }]} />
                        <View style={[styles.themePreviewBtn, { backgroundColor: theme.colors.buttonBg }]} />
                      </View>
                    </View>
                    <Text style={[styles.themeName, { color: colors.textPrimary }, equipped && { color: theme.colors.accent }]}>{theme.name}</Text>
                    <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>{theme.description}</Text>
                    <View style={styles.themeBadgeRow}>
                      {owned ? (
                        <Text style={[styles.themeBadge, equipped ? styles.themeEquippedBadge : styles.themeOwnedBadge]}>
                          {equipped ? 'ACTIVE' : 'Tap to use'}
                        </Text>
                      ) : (
                        <Text style={[styles.themeBadge, styles.themeCostBadge]}>
                          <Ionicons name="cash" size={10} color="#FF9800" /> {theme.cost}
                        </Text>
                      )}
                    </View>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <View style={styles.shopGrid}>
            {allItems.map((item, i) => (
              <ShopItem
                key={item.id}
                item={item}
                owned={character.level >= item.minLevel}
                equipped={character.customization?.[item.type] === item.id}
                onPress={() => equipItem(item)}
                delay={400 + i * 50}
                colors={colors}
              />
            ))}
          </View>
        )}
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
  levelBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6, marginTop: 12 },
  levelBadgeText: { color: '#0D0D1A', fontWeight: '900', fontSize: 14 },
  stageText: { fontSize: 11, marginTop: 8, textTransform: 'uppercase', letterSpacing: 3 },
  stageDesc: { color: '#666', fontSize: 12, marginTop: 4 },
  elementSection: {
    backgroundColor: '#1A1A2E', marginHorizontal: 16, borderRadius: 20, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  elementTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  elementRow: { flexDirection: 'row', justifyContent: 'space-between' },
  elementBtn: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 12,
    backgroundColor: '#2A2A3E', marginHorizontal: 4, borderWidth: 1, borderColor: '#333',
  },
  elementBtnText: { color: '#666', fontSize: 10, fontWeight: '600', marginTop: 4 },
  evoTrack: {
    backgroundColor: '#1A1A2E', marginHorizontal: 16, borderRadius: 20, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#2A2A3E',
  },
  evoTrackTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  evoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  evoNodeWrap: { alignItems: 'center', width: 36 },
  evoNode: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#2A2A3E',
  },
  evoNodeActive: { borderColor: '#fff', transform: [{ scale: 1.1 }] },
  evoNodeNum: { color: '#666', fontSize: 10, fontWeight: '700' },
  evoNodeLabel: { color: '#555', fontSize: 7, marginTop: 4, textAlign: 'center' },
  statsCard: {
    backgroundColor: '#1A1A2E', marginHorizontal: 16, borderRadius: 20, padding: 20, marginTop: 12,
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
  itemName: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  itemStatus: { fontSize: 10, marginTop: 6, fontWeight: '600' },
  equippedStatus: { color: '#FFD700' },
  ownedStatus: { color: '#4CAF50' },
  lockedStatus: { color: '#F44336', fontSize: 11, marginTop: 6, fontWeight: '600' },
  themeCard: {
    width: '100%', borderRadius: 20, padding: 14, marginBottom: 12,
    alignItems: 'center', borderWidth: 2, backgroundColor: '#1A1A2E',
  },
  themeEquippedCard: { backgroundColor: '#2A2A1E' },
  themePreview: {
    width: '100%', height: 60, borderRadius: 12, overflow: 'hidden',
    padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A3E',
  },
  themePreviewCard: {
    flex: 1, borderRadius: 8, padding: 6, borderWidth: 1,
    justifyContent: 'space-between',
  },
  themePreviewAccent: { height: 6, borderRadius: 3, width: '60%' },
  themePreviewBtn: { height: 6, borderRadius: 3, width: '40%', marginTop: 3 },
  themeName: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  themeDesc: { color: '#666', fontSize: 10, marginTop: 2, textAlign: 'center' },
  themeBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  themeBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  themeEquippedBadge: { color: '#FFD700', backgroundColor: '#FFD70022' },
  themeOwnedBadge: { color: '#4CAF50', backgroundColor: '#4CAF5022' },
  themeCostBadge: { color: '#FF9800', backgroundColor: '#FF980022' },
});
