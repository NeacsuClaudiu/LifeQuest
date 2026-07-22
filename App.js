import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import CharacterScreen from './src/screens/CharacterScreen';
import StatsScreen from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = [
  { name: 'Home', icon: 'home', iconOutline: 'home-outline', activeColor: '#FFD700' },
  { name: 'Tasks', icon: 'checkmark-circle', iconOutline: 'checkmark-circle-outline', activeColor: '#4ECDC4' },
  { name: 'Character', icon: 'person', iconOutline: 'person-outline', activeColor: '#A78BFA' },
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

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
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
                name === 'Character' ? CharacterScreen :
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
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D0D1A',
    borderTopColor: '#1A1A2E',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabIcon: { alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
});
