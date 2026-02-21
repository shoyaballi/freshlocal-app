import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Button } from '@/components/ui';
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
  const { orders } = useOrders();

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
                📍 {user?.postcode || 'Blackburn BB1'}
              </Text>
              <Text style={styles.memberSince}>Member since {memberSince}</Text>
            </View>
          </View>
        </Card>

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
            onPress={() => console.log('My Orders')}
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
            onPress={() => console.log('Notifications')}
          />
        </Card>

        <Card style={styles.menuCard} noPadding>
          <MenuItem
            emoji="🏠"
            title="Saved Addresses"
            onPress={() => console.log('Addresses')}
          />
          <MenuItem
            emoji="💳"
            title="Payment Methods"
            onPress={() => console.log('Payment')}
          />
          <MenuItem
            emoji="🥗"
            title="Dietary Preferences"
            onPress={() => console.log('Dietary')}
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
            onPress={() => console.log('Help')}
          />
        </Card>

        <Card style={styles.menuCard} noPadding>
          <MenuItem
            emoji="🚪"
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
          />
        </Card>
      </ScrollView>
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
