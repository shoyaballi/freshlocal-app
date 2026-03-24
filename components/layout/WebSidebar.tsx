import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';

interface NavItem {
  path: string;
  label: string;
  emoji: string;
  tabName: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Today', emoji: '🍽️', tabName: 'index' },
  { path: '/schedule', label: 'Schedule', emoji: '📅', tabName: 'schedule' },
  { path: '/vendors', label: 'Vendors', emoji: '👨‍🍳', tabName: 'vendors' },
  { path: '/profile', label: 'Profile', emoji: '👤', tabName: 'profile' },
];

const VENDOR_NAV: NavItem = {
  path: '/dashboard',
  label: 'Dashboard',
  emoji: '📊',
  tabName: 'dashboard',
};

export function WebSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isVendor, sidebarCollapsed, toggleSidebar, notificationCount } = useAppStore();

  const items = isVendor ? [...NAV_ITEMS, VENDOR_NAV] : NAV_ITEMS;
  const sidebarWidth = sidebarCollapsed ? 68 : 240;

  const isActive = (item: NavItem) => {
    if (item.path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(item.path);
  };

  return (
    <View style={[styles.sidebar, { width: sidebarWidth }]}>
      {/* Logo */}
      <Pressable onPress={() => router.push('/')} style={styles.logoContainer}>
        {sidebarCollapsed ? (
          <View style={styles.logoCollapsed}>
            <Text style={styles.logoCollapsedText}>FL</Text>
          </View>
        ) : (
          <Text style={styles.logoText}>FreshLocal</Text>
        )}
      </Pressable>

      {/* Nav items */}
      <View style={styles.navList}>
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Pressable
              key={item.path}
              onPress={() => router.push(item.path as any)}
              style={({ hovered }: any) => [
                styles.navItem,
                sidebarCollapsed && styles.navItemCollapsed,
                active && styles.navItemActive,
                !active && hovered && styles.navItemHovered,
              ]}
            >
              <View style={styles.emojiContainer}>
                <Text style={styles.navEmoji}>{item.emoji}</Text>
                {item.tabName === 'profile' && notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
              {!sidebarCollapsed && (
                <Text
                  style={[
                    styles.navLabel,
                    active && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Toggle button */}
      <Pressable
        onPress={toggleSidebar}
        style={({ hovered }: any) => [
          styles.toggleButton,
          hovered && styles.toggleButtonHovered,
        ]}
      >
        <Text style={styles.toggleEmoji}>
          {sidebarCollapsed ? '▶' : '◀'}
        </Text>
        {!sidebarCollapsed && (
          <Text style={styles.toggleLabel}>Collapse</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: colors.backgroundWhite,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: '100%' as any,
    paddingVertical: spacing.lg,
    justifyContent: 'flex-start',
    ...shadows.sm,
  },
  logoContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.sm,
    cursor: 'pointer' as any,
  },
  logoText: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.primary,
  },
  logoCollapsed: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoCollapsedText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.backgroundWhite,
  },
  navList: {
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    cursor: 'pointer' as any,
    gap: spacing.md,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: colors.primaryPale,
  },
  navItemHovered: {
    backgroundColor: colors.grey100,
  },
  emojiContainer: {
    position: 'relative',
    width: 24,
    alignItems: 'center',
  },
  navEmoji: {
    fontSize: 18,
  },
  navLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  navLabelActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.backgroundWhite,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    cursor: 'pointer' as any,
  },
  toggleButtonHovered: {
    backgroundColor: colors.grey100,
  },
  toggleEmoji: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 24,
    textAlign: 'center',
  },
  toggleLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});

export default WebSidebar;
