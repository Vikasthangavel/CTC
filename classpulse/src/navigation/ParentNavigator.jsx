import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../theme/tokens';

import ParentHomeScreen     from '../screens/parent/ParentHomeScreen';
import ParentActivityScreen from '../screens/parent/ParentActivityScreen';
import ParentFeesScreen     from '../screens/parent/ParentFeesScreen';
import ParentReportScreen   from '../screens/parent/ParentReportScreen';

const Tab = createBottomTabNavigator();

export default function ParentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:   false,
        tabBarStyle:   styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor:   Colors.secondary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIconStyle: { display: 'none' }, // Hides the empty icon space
      }}
    >
      <Tab.Screen
        name="Home"
        component={ParentHomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Activity"
        component={ParentActivityScreen}
        options={{ tabBarLabel: 'Activities' }}
      />
      <Tab.Screen
        name="Fees"
        component={ParentFeesScreen}
        options={{ tabBarLabel: 'Fees' }}
      />
      <Tab.Screen
        name="Contact"
        component={ParentReportScreen}
        options={{ tabBarLabel: 'Message' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:   Colors.bgCard,
    borderTopColor:    Colors.border,
    borderTopWidth:    1,
    height:            62,
    paddingBottom:     8,
    paddingTop:        6,
  },
  tabLabel: {
    fontSize:   FontSize.xs,
    fontWeight: '500',
  },
});
