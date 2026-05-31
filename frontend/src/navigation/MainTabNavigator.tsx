import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import GuardDashboardScreen from '../screens/guard/GuardDashboardScreen';
import LogNewVisitorScreen from '../screens/guard/LogNewVisitorScreen';
import UpcomingVisitorsScreen from '../screens/guard/UpcomingVisitorsScreen';
import VisitorsListScreen from '../screens/guard/VisitorsListScreen';
import ProfileScreen from '../screens/guard/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

const tabsByRole: Record<string, Array<{ name: string; component: any; label: string; icon: string }>> = {
  guard: [
    { name: 'Dashboard', component: GuardDashboardScreen, label: 'Dashboard', icon: '🏠' },
    { name: 'LogNewVisitor', component: LogNewVisitorScreen, label: 'Log Visitor', icon: '➕' },
    { name: 'UpcomingVisitors', component: UpcomingVisitorsScreen, label: 'Upcoming', icon: '📅' },
    { name: 'VisitorsList', component: VisitorsListScreen, label: 'History', icon: '📋' },
    { name: 'Profile', component: ProfileScreen, label: 'Profile', icon: '👤' },
  ],
  resident: [
    { name: 'Dashboard', component: GuardDashboardScreen, label: 'Dashboard', icon: '🏠' },
    { name: 'UpcomingVisitors', component: UpcomingVisitorsScreen, label: 'Upcoming', icon: '📅' },
    { name: 'VisitorsList', component: VisitorsListScreen, label: 'History', icon: '📋' },
    { name: 'Profile', component: ProfileScreen, label: 'Profile', icon: '👤' },
  ],
  admin: [
    { name: 'Dashboard', component: GuardDashboardScreen, label: 'Dashboard', icon: '🏠' },
    { name: 'LogNewVisitor', component: LogNewVisitorScreen, label: 'Log Visitor', icon: '➕' },
    { name: 'VisitorsList', component: VisitorsListScreen, label: 'History', icon: '📋' },
    { name: 'Profile', component: ProfileScreen, label: 'Profile', icon: '👤' },
  ],
};

const TabBar = ({ state, descriptors, navigation: tabNavigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const tabs = tabsByRole[user?.role || 'guard'];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const config = tabs.find((t) => t.name === route.name);
        if (!config) return null;

        const onPress = () => {
          const event = tabNavigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            tabNavigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, isFocused && { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.tabIcon, isFocused && { opacity: 1 }]}>
                {config.icon}
              </Text>
            </View>
            <Text style={[styles.tabLabel, { color: colors.tabInactive }, isFocused && { color: colors.primary, fontWeight: '700' }]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabNavigator = () => {
  const { user } = useAuth();
  const tabs = tabsByRole[user?.role || 'guard'];

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {tabs.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  tabIcon: { fontSize: 20, opacity: 0.5 },
  tabLabel: { fontSize: 11, fontWeight: '500' },
});

export default MainTabNavigator;
