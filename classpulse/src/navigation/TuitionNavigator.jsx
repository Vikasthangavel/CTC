import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../theme/tokens';

// Tuition Screens
import DashboardScreen      from '../screens/tuition/DashboardScreen';
import StudentsScreen       from '../screens/tuition/StudentsScreen';
import AddStudentScreen     from '../screens/tuition/AddStudentScreen';
import EditStudentScreen    from '../screens/tuition/EditStudentScreen';
import ActivityReportScreen from '../screens/tuition/ActivityReportScreen';
import AttendanceScreen     from '../screens/tuition/AttendanceScreen';
import FeesScreen           from '../screens/tuition/FeesScreen';
import StudentFeesScreen    from '../screens/tuition/StudentFeesScreen';
import ReportsScreen        from '../screens/tuition/ReportsScreen';
import AnalyticsScreen      from '../screens/tuition/AnalyticsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Stack inside the Students tab ───────────────
function StudentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentsList"    component={StudentsScreen} />
      <Stack.Screen name="AddStudent"      component={AddStudentScreen} />
      <Stack.Screen name="EditStudent"     component={EditStudentScreen} />
      <Stack.Screen name="ActivityReport"  component={ActivityReportScreen} />
    </Stack.Navigator>
  );
}

// ─── Stack inside the Fees tab ────────────────────
function FeesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeesList"    component={FeesScreen} />
      <Stack.Screen name="StudentFees" component={StudentFeesScreen} />
    </Stack.Navigator>
  );
}

// ─── Tab Icon helper ─────────────────────────────
function TabIcon(emoji, focused) {
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

// ─────────────────────────────────────────────────
//  TuitionNavigator — Bottom Tab Navigator for admins
// ─────────────────────────────────────────────────
export default function TuitionNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:   false,
        tabBarStyle:   styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => TabIcon('🏠', focused), tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsStack}
        options={{ tabBarIcon: ({ focused }) => TabIcon('👨‍🎓', focused), tabBarLabel: 'Students' }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ tabBarIcon: ({ focused }) => TabIcon('📋', focused), tabBarLabel: 'Attend' }}
      />
      <Tab.Screen
        name="Fees"
        component={FeesStack}
        options={{ tabBarIcon: ({ focused }) => TabIcon('💰', focused), tabBarLabel: 'Fees' }}
      />
      <Tab.Screen
        name="More"
        component={ReportsScreen}
        options={{ tabBarIcon: ({ focused }) => TabIcon('📊', focused), tabBarLabel: 'Reports' }}
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
