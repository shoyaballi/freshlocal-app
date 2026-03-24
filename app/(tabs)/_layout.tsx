import { Platform, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { TabIcon, WebSidebar } from '@/components/layout';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';
import { useResponsive } from '@/hooks/useResponsive';

export default function TabsLayout() {
  const { isVendor, notificationCount } = useAppStore();
  const { isDesktop } = useResponsive();
  const showSidebar = Platform.OS === 'web' && isDesktop;

  return (
    <View style={styles.container}>
      {showSidebar && <WebSidebar />}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: showSidebar
              ? { display: 'none' }
              : {
                  backgroundColor: colors.backgroundWhite,
                  borderTopColor: colors.border,
                  borderTopWidth: 1,
                  height: 80,
                  paddingBottom: 20,
                  paddingTop: 8,
                },
            tabBarShowLabel: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.grey400,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Today',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="🍽️" label="Today" focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="schedule"
            options={{
              title: 'Schedule',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="📅" label="Schedule" focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="vendors"
            options={{
              title: 'Vendors',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="👨‍🍳" label="Vendors" focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ focused }) => (
                <TabIcon
                  emoji="👤"
                  label="Profile"
                  focused={focused}
                  badge={notificationCount > 0 ? notificationCount : undefined}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Dashboard',
              href: isVendor ? '/dashboard' : null,
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="📊" label="Dashboard" focused={focused} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});
