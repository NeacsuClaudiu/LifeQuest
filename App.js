import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import CharacterScreen from './src/screens/CharacterScreen';
import StatsScreen from './src/screens/StatsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import MilestonesScreen from './src/screens/MilestonesScreen';
import DailyReviewScreen from './src/screens/DailyReviewScreen';
import WeeklyReviewScreen from './src/screens/WeeklyReviewScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = [
  { name: 'Home', icon: 'home', iconOutline: 'home-outline', activeColor: '#FFD700' },
  { name: 'Tasks', icon: 'checkmark-circle', iconOutline: 'checkmark-circle-outline', activeColor: '#4ECDC4' },
  { name: 'Daily', icon: 'today', iconOutline: 'today-outline', activeColor: '#81C784' },
  { name: 'Weekly', icon: 'calendar', iconOutline: 'calendar-outline', activeColor: '#64B5F6' },
  { name: 'Character', icon: 'person', iconOutline: 'person-outline', activeColor: '#A78BFA' },
  { name: 'Achievements', icon: 'trophy', iconOutline: 'trophy-outline', activeColor: '#FFD700' },
  { name: 'Milestones', icon: 'flag', iconOutline: 'flag-outline', activeColor: '#FF9800' },
  { name: 'Stats', icon: 'stats-chart', iconOutline: 'stats-chart-outline', activeColor: '#FF6B6B' },
];

function TabBarIcon({ iconName, iconOutline, label, activeColor, focused }) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, { damping: 12, stiffness: 200 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabIcon, animStyle]}>
      <Ionicons
        name={focused ? iconName : iconOutline}
        size={24}
        color={focused ? activeColor : '#555'}
      />
      <Text style={[styles.tabLabel, { color: focused ? activeColor : '#555' }]}>{label}</Text>
      {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
    </Animated.View>
  );
}

function MainNavigator() {
  const { loaded, colors } = useTheme();

  const tabBarStyle = {
    backgroundColor: loaded ? colors.tabBar : '#0D0D1A',
    borderTopColor: loaded ? colors.tabBorder : '#1A1A2E',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarShowLabel: false,
      }}
    >
      {TAB_ICONS.map(({ name, icon, iconOutline, activeColor }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={
            name === 'Home' ? HomeScreen :
            name === 'Tasks' ? TasksScreen :
            name === 'Daily' ? DailyReviewScreen :
            name === 'Weekly' ? WeeklyReviewScreen :
            name === 'Character' ? CharacterScreen :
            name === 'Achievements' ? AchievementsScreen :
            name === 'Milestones' ? MilestonesScreen :
            StatsScreen
          }
          options={{
            animation: 'fade',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon iconName={icon} iconOutline={iconOutline} label={name} activeColor={activeColor} focused={focused} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', justifyContent: 'center', minWidth: 44 },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
});
