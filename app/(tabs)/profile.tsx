import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { Card, Button } from '@/components/ui';
import { ProfileEditSheet } from '@/components/profile';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';

interface MenuItemProps {
  emoji: string;
  title: string;
  subtitle?: string;
  badge?: number;
  onPress: () => void;
  variant?: 'default' | 'danger';
}

function MenuItem({
  emoji,
  title,
  subtitle,
  badge,
  onPress,
  variant = 'default',
}: MenuItemProps) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <View style={styles.menuContent}>
        <Text
          style={[
            styles.menuTitle,
            variant === 'danger' && styles.menuTitleDanger,
          ]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { isVendor, notificationCount, favourites } = useAppStore();
  const { orders, refetch: refetchOrders } = useOrders();

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const [refreshing, setRefreshing] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchOrders();
    setRefreshing(false);
  }, [refetchOrders]);

  // Find active orders (not collected, delivered, or cancelled)
  const activeOrders = orders.filter(
    (order) => !['collected', 'delivered', 'cancelled'].includes(order.status)
  );
  const mostRecentActiveOrder = activeOrders[0];

  const handleTrackOrder = () => {
    if (mostRecentActiveOrder) {
      router.push(`/order/${mostRecentActiveOrder.id}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInEmoji}>👋</Text>
          <Text style={styles.notLoggedInTitle}>Welcome to FreshLocal</Text>
          <Text style={styles.notLoggedInText}>
            Sign in to place orders, save favourites, and support local vendors.
          </Text>
          <Button
            onPress={() => router.push('/auth/login')}
            style={styles.signInButton}
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push('/auth/signup')}
          >
            Create Account
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : 'January 2024';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Pressable onPress={() => setIsEditProfileOpen(true)}>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userLocation}>
                  📍 {user?.postcode || 'Set your location'}
                </Text>
                <Text style={styles.memberSince}>Member since {memberSince}</Text>
              </View>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </Card>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>£89.50</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favourites.length}</Text>
            <Text style={styles.statLabel}>Favourites</Text>
          </View>
        </View>

        <Card style={styles.menuCard} noPadding>
          <MenuItem
            emoji="📦"
            title="My Orders"
            subtitle="View order history"
            onPress={() => router.push('/orders')}
          />
          {mostRecentActiveOrder && (
            <MenuItem
              emoji="📍"
              title="Track Active Order"
              subtitle={`#${mostRecentActiveOrder.id.slice(0, 8).toUpperCase()}`}
              onPress={handleTrackOrder}
            />
          )}
          <MenuItem
            emoji="🔔"
            title="Notifications"
            badge={notificationCount}
            onPress={() => router.push('/notifications')}
          />
        </Card>

        <Card style={styles.menuCard} noPadding>
          <MenuItem
            emoji="🏠"
            title="Saved Addresses"
            subtitle="Manage delivery addresses"
            onPress={() => setIsEditProfileOpen(true)}
          />
          <MenuItem
            emoji="💳"
            title="Payment Methods"
            subtitle="Coming soon"
            onPress={() => {}}
          />
          <MenuItem
            emoji="🥗"
            title="Dietary Preferences"
            subtitle="Set your dietary filters"
            onPress={() => router.push('/(tabs)')}
          />
        </Card>

        <Card style={styles.menuCard} noPadding>
          {isVendor ? (
            <MenuItem
              emoji="📊"
              title="Vendor Dashboard"
              subtitle="Manage your meals and orders"
              onPress={() => router.push('/dashboard')}
            />
          ) : (
            <MenuItem
              emoji="👨‍🍳"
              title="Become a Vendor"
              subtitle="Start selling your homemade food"
              onPress={() => router.push('/vendor/signup')}
            />
          )}
          <MenuItem
            emoji="❓"
            title="Help & Support"
            onPress={() => router.push('/legal/terms')}
          />
          <MenuItem
            emoji="📄"
            title="Terms of Service"
            onPress={() => router.push('/legal/terms')}
          />
          <MenuItem
            emoji="🔒"
            title="Privacy Policy"
            onPress={() => router.push('/legal/privacy')}
          />
        </Card>

        {user?.role === 'admin' && (
          <Card style={styles.menuCard} noPadding>
            <MenuItem
              emoji="🛡️"
              title="Admin Panel"
              subtitle="Manage vendors, orders, analytics"
              onPress={() => router.push('/admin')}
            />
          </Card>
        )}

        <Card style={styles.menuCard} noPadding>
          <MenuItem
            emoji="🚪"
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
          />
        </Card>
      </ScrollView>

      <ProfileEditSheet
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onProfileUpdated={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes['2xl'],
    color: colors.backgroundWhite,
  },
  profileInfo: {
    flex: 1,
  },
  editIcon: {
    fontSize: fontSizes.lg,
    marginLeft: spacing.sm,
  },
  userName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  userLocation: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  memberSince: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menuCard: {
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuEmoji: {
    fontSize: fontSizes.xl,
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  menuTitleDanger: {
    color: colors.error,
  },
  menuSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.sm,
  },
  menuBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.backgroundWhite,
  },
  menuChevron: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xl,
    color: colors.grey300,
  },

  // Not logged in state
  notLoggedIn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  notLoggedInEmoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  notLoggedInTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes['2xl'],
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  notLoggedInText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    lineHeight: 24,
  },
  signInButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
});
