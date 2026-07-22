import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring, withRepeat, Easing, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const REWARD_TIERS = [
  { minStreak: 0, xp: [15, 25], gold: [5, 10], label: 'Daily' },
  { minStreak: 2, xp: [25, 40], gold: [10, 15], label: 'Warming Up' },
  { minStreak: 5, xp: [40, 60], gold: [15, 25], label: 'On Fire' },
  { minStreak: 10, xp: [60, 90], gold: [25, 40], label: 'Unstoppable' },
  { minStreak: 20, xp: [90, 130], gold: [40, 60], label: 'Legendary' },
  { minStreak: 30, xp: [130, 200], gold: [60, 100], label: 'Mythic' },
];

const BONUSES = [
  { id: 'xp_boost', label: '+50% XP next task', icon: 'flash', color: '#FFD700' },
  { id: 'gold_bonus', label: 'Bonus Gold', icon: 'cash', color: '#FF9800' },
  { id: 'streak_protect', label: 'Streak Shield', icon: 'shield', color: '#4CAF50' },
  { id: 'xp_double', label: 'Double XP next task', icon: 'thunderstorm', color: '#A78BFA' },
  { id: 'free_reroll', label: 'Free task reroll', icon: 'refresh', color: '#2196F3' },
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRewardTier(streak) {
  let tier = REWARD_TIERS[0];
  for (const t of REWARD_TIERS) {
    if (streak >= t.minStreak) tier = t;
  }
  return tier;
}

function generateRewards(streak) {
  const tier = getRewardTier(streak);
  const xp = rand(tier.xp[0], tier.xp[1]) * (1 + Math.floor(streak / 7) * 0.1);
  const gold = rand(tier.gold[0], tier.gold[1]);
  const bonus = BONUSES[rand(0, BONUSES.length - 1)];
  return { xp: Math.round(xp), gold, bonus, tier: tier.label };
}

function getTimeRemaining(lastClaim) {
  if (!lastClaim) return 0;
  const elapsed = Date.now() - new Date(lastClaim).getTime();
  const remaining = 24 * 60 * 60 * 1000 - elapsed;
  return Math.max(0, remaining);
}

function formatCountdown(ms) {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function DailyReward({ character, onClaim, style }) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(character?.lastDailyReward));
  const [showModal, setShowModal] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [animPhase, setAnimPhase] = useState('idle');

  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  const rewardScale = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(character?.lastDailyReward));
    }, 1000);
    return () => clearInterval(interval);
  }, [character?.lastDailyReward]);

  const canClaim = timeLeft <= 0;

  useEffect(() => {
    if (canClaim) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.2, { duration: 800 })
        ),
        -1, true
      );
    }
  }, [canClaim]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const rewardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
  }));

  const handleClaim = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const gen = generateRewards(character?.dailyRewardStreak || 0);
    setRewards(gen);
    setShowModal(true);
    setClaimed(true);

    scaleAnim.value = withSequence(
      withSpring(1.3, { damping: 3, stiffness: 200 }),
      withSpring(1, { damping: 10 })
    );

    setTimeout(() => {
      rewardScale.value = withSpring(1, { damping: 8, stiffness: 150 });
      setAnimPhase('reveal');
    }, 300);

    setTimeout(() => setAnimPhase('complete'), 1200);

    if (onClaim) onClaim(gen);
  };

  const closeModal = () => {
    setShowModal(false);
    setAnimPhase('idle');
    rewardScale.value = 0;
  };

  const canClaimNow = canClaim && !claimed;

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style, { backgroundColor: colors.cardBg, borderColor: canClaimNow ? colors.accent + '44' : colors.cardBorder }, canClaimNow && styles.containerReady]}
        onPress={handleClaim}
        disabled={!canClaimNow}
        activeOpacity={0.7}
      >
        {canClaimNow && (
          <Animated.View style={[styles.glowRing, { backgroundColor: colors.accent }, glowStyle]} />
        )}
        <Animated.View style={[styles.content, pulseStyle]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.cardBorder }, canClaimNow && { backgroundColor: colors.accent }]}>
            <Ionicons
              name={canClaimNow ? 'gift' : 'time'}
              size={22}
              color={canClaimNow ? colors.buttonText : colors.textMuted}
            />
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: canClaimNow ? colors.accent : colors.textMuted }, canClaimNow && styles.titleReady]}>
              {canClaimNow ? 'Daily Reward Ready!' : 'Daily Reward'}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              {canClaimNow
                ? 'Tap to claim your rewards'
                : `Next reward in ${formatCountdown(timeLeft)}`}
            </Text>
          </View>
          {!canClaimNow && (
            <Text style={[styles.timer, { color: colors.accent }]}>{formatCountdown(timeLeft)}</Text>
          )}
        </Animated.View>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modal, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, rewardAnimStyle]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: colors.accent + '22' }]}>
                <Ionicons name="gift" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.accent }]}>Daily Reward</Text>
              <Text style={[styles.modalStreak, { color: colors.textSecondary }]}>
                Day {character?.dailyRewardStreak ? character.dailyRewardStreak + 1 : 1} streak
              </Text>
            </View>

            {rewards && (
              <>
                {animPhase === 'complete' && (
                  <View style={styles.modalStars}>
                    {[0, 1, 2].map(i => (
                      <Ionicons key={i} name="star" size={16} color={colors.accent} />
                    ))}
                  </View>
                )}

                <View style={styles.rewardRow}>
                  <View style={[styles.rewardItem, { backgroundColor: colors.cardBorder, borderColor: colors.accent + '33' }]}>
                    <Ionicons name="flash" size={22} color={colors.accent} />
                    <Text style={[styles.rewardValue, { color: colors.textPrimary }]}>+{rewards.xp}</Text>
                    <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>XP</Text>
                  </View>
                  <View style={[styles.rewardItem, { backgroundColor: colors.cardBorder, borderColor: '#FF980033' }]}>
                    <Ionicons name="cash" size={22} color="#FF9800" />
                    <Text style={[styles.rewardValue, { color: colors.textPrimary }]}>+{rewards.gold}</Text>
                    <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>Gold</Text>
                  </View>
                  <View style={[styles.rewardItem, { backgroundColor: colors.cardBorder, borderColor: rewards.bonus.color + '33' }]}>
                    <Ionicons name={rewards.bonus.icon} size={22} color={rewards.bonus.color} />
                    <Text style={[styles.rewardValue, { color: rewards.bonus.color, fontSize: 9 }]} numberOfLines={2}>
                      {rewards.bonus.label}
                    </Text>
                    <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>Bonus</Text>
                  </View>
                </View>

                <Text style={[styles.rewardTier, { color: colors.accentSecondary }]}>{rewards.tier} Tier</Text>

                {animPhase === 'complete' ? (
                  <TouchableOpacity style={[styles.claimBtn, { backgroundColor: colors.accent }]} onPress={closeModal}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.buttonText} />
                    <Text style={[styles.claimBtnText, { color: colors.buttonText }]}>Collected!</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.claimingText}>
                    <Ionicons name="hourglass" size={18} color={colors.accent} />
                    <Text style={[styles.claimingLabel, { color: colors.accent }]}>Claiming...</Text>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16, marginTop: 8, borderRadius: 16,
    backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2A2A3E',
    overflow: 'hidden',
  },
  containerReady: {
    borderColor: '#FFD70044', backgroundColor: '#1A1A2E',
  },
  glowRing: {
    position: 'absolute', top: -20, left: -20, right: -20, bottom: -20,
    borderRadius: 40, backgroundColor: '#FFD700',
  },
  content: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#2A2A3E', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapReady: {
    backgroundColor: '#FFD700',
  },
  info: { flex: 1 },
  title: { color: '#888', fontSize: 13, fontWeight: '700' },
  titleReady: { color: '#FFD700' },
  sub: { color: '#555', fontSize: 11, marginTop: 2 },
  timer: { color: '#FFD700', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modal: {
    backgroundColor: '#1A1A2E', borderRadius: 24, padding: 24,
    width: 300, borderWidth: 1, borderColor: '#2A2A3E',
    alignItems: 'center',
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFD70022', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: { color: '#FFD700', fontSize: 22, fontWeight: '900' },
  modalStreak: { color: '#666', fontSize: 12, marginTop: 4 },
  modalStars: { flexDirection: 'row', marginBottom: 12, gap: 4 },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  rewardItem: {
    flex: 1, backgroundColor: '#2A2A3E', borderRadius: 14, padding: 12,
    alignItems: 'center', marginHorizontal: 4, borderWidth: 1,
  },
  rewardValue: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 6 },
  rewardLabel: { color: '#666', fontSize: 9, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  rewardTier: { color: '#A78BFA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700',
    borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
  },
  claimBtnText: { color: '#0D0D1A', fontSize: 16, fontWeight: '900', marginLeft: 8 },
  claimingText: { flexDirection: 'row', alignItems: 'center' },
  claimingLabel: { color: '#FFD700', fontSize: 14, fontWeight: '700', marginLeft: 8 },
});
