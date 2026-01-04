import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE_COLOR = '#FF385C'; // Pinkish-red from image designs
const INACTIVE_COLOR = '#757575';

/**
 * Custom Tab Bar Button
 * Handles the special styling for the center button and normal tabs
 */
const TabButton = (props: any) => {
  const { item, accessibilityState, onPress } = props;
  const focused = accessibilityState?.selected;

  // Special rendering for the center '+' button
  if (item.isCenter) {
    return (
      <View style={styles.tabItemContainer}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={styles.centerButton}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.invisibleLabel}>Go</Text>
      </View>
    );
  }

  // Standard tab button (Home, Search, History, Profile)
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabItemContainer}
    >
      <Ionicons
        name={focused ? item.activeIcon : item.inactiveIcon}
        size={22}
        color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
      />
      <Text style={[
        styles.tabLabel,
        { color: focused ? ACTIVE_COLOR : INACTIVE_COLOR }
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 70 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 10
          }
        ],
        tabBarShowLabel: false,
      }}>

      <Tabs.Screen
        name="index"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              item={{
                label: 'Home',
                activeIcon: 'home',
                inactiveIcon: 'home-outline'
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              item={{
                label: 'Search',
                activeIcon: 'search',
                inactiveIcon: 'search-outline'
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="center"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              item={{
                label: '',
                isCenter: true
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              item={{
                label: 'History',
                activeIcon: 'time',
                inactiveIcon: 'time-outline'
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarButton: (props) => (
            <TabButton
              {...props}
              item={{
                label: 'Profile',
                activeIcon: 'person',
                inactiveIcon: 'person-outline'
              }}
            />
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
    // Elevation/Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 25,
    // Ensure it touches sides
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ACTIVE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -35, // Pull it up so it overlaps the top edge
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  invisibleLabel: {
    fontSize: 11,
    color: 'transparent',
    marginTop: 4,
  }
});
