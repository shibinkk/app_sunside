import { Tabs } from 'expo-router';
import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE_COLOR = '#FF385C';
const INACTIVE_COLOR = '#757575';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 70 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom - 5 : 5,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="center"
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={styles.centerButton}>
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 0,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 25,
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 5,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ACTIVE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -45, // Pulls the center button up
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    // Ensure the container doesn't clip the overflowing button
    zIndex: 100,
  },
});