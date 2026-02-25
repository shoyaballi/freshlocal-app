import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '@/components/layout';
import { Card, Button, SearchInput, ErrorState } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts, fontSizes, spacing, borderRadius } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VendorRow {
  id: string;
  user_id: string;
  business_name: string;
  handle: string;
  description: string | null;
  business_type: string | null;
  avatar: string | null;
  phone: string | null;
  postcode: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

type Tab = 'pending' | 'all';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Vendor Management Screen
// ---------------------------------------------------------------------------

export default function VendorManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [pendingVendors, setPendingVendors] = useState<VendorRow[]>([]);
  const [allVendors, setAllVendors] = useState<VendorRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pending vendors (is_active = false)
      const { data: pending, error: pendingErr } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', false)
        .order('created_at', { ascending: false });

      if (pendingErr) throw pendingErr;

      // Fetch all vendors
      const { data: all, error: allErr } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (allErr) throw allErr;

      setPendingVendors(pending ?? []);
      setAllVendors(all ?? []);
    } catch (err: any) {
      console.error('Vendor fetch error:', err);
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleApprove = useCallback(async (vendorId: string) => {
    setActionLoading(vendorId);
    try {
      const { error: updateErr } = await supabase
        .from('vendors')
        .update({ is_active: true })
        .eq('id', vendorId);

      if (updateErr) throw updateErr;

      // Update local state
      setPendingVendors((prev) => prev.filter((v) => v.id !== vendorId));
      setAllVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, is_active: true } : v))
      );

      Alert.alert('Success', 'Vendor has been approved.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to approve vendor');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleReject = useCallback(
    (vendorId: string, businessName: string) => {
      Alert.alert(
        'Reject Vendor',
        `Are you sure you want to reject "${businessName}"? This will permanently delete the vendor.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async () => {
              setActionLoading(vendorId);
              try {
                const { error: deleteErr } = await supabase
                  .from('vendors')
                  .delete()
                  .eq('id', vendorId);

                if (deleteErr) throw deleteErr;

                setPendingVendors((prev) => prev.filter((v) => v.id !== vendorId));
                setAllVendors((prev) => prev.filter((v) => v.id !== vendorId));

                Alert.alert('Done', 'Vendor has been rejected and removed.');
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to reject vendor');
              } finally {
                setActionLoading(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleToggleActive = useCallback(
    async (vendorId: string, newValue: boolean) => {
      setActionLoading(vendorId);
      try {
        const { error: updateErr } = await supabase
          .from('vendors')
          .update({ is_active: newValue })
          .eq('id', vendorId);

        if (updateErr) throw updateErr;

        setAllVendors((prev) =>
          prev.map((v) => (v.id === vendorId ? { ...v, is_active: newValue } : v))
        );

        // If deactivated, also remove from pending if present
        if (!newValue) {
          setPendingVendors((prev) => {
            if (!prev.find((v) => v.id === vendorId)) {
              const vendor = allVendors.find((v) => v.id === vendorId);
              return vendor ? [...prev, { ...vendor, is_active: false }] : prev;
            }
            return prev;
          });
        } else {
          setPendingVendors((prev) => prev.filter((v) => v.id !== vendorId));
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to update vendor status');
      } finally {
        setActionLoading(null);
      }
    },
    [allVendors]
  );

  const filteredVendors = allVendors.filter((v) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.business_name.toLowerCase().includes(query) ||
      v.handle.toLowerCase().includes(query) ||
      (v.postcode && v.postcode.toLowerCase().includes(query))
    );
  });

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Vendor Management"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Vendor Management"
          leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
          onLeftPress={() => router.back()}
        />
        <ErrorState
          emoji="👨‍🍳"
          title="Failed to load vendors"
          message={error}
          onRetry={fetchVendors}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Vendor Management"
        leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
        onLeftPress={() => router.back()}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('pending')}
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending Approval
            {pendingVendors.length > 0 ? ` (${pendingVendors.length})` : ''}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('all')}
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Vendors ({allVendors.length})
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'pending' ? (
          <>
            {pendingVendors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>✅</Text>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptyText}>
                  No vendors pending approval right now.
                </Text>
              </View>
            ) : (
              pendingVendors.map((vendor) => (
                <Card key={vendor.id} style={styles.vendorCard}>
                  <View style={styles.vendorHeader}>
                    <View style={styles.vendorAvatar}>
                      <Text style={styles.vendorAvatarText}>
                        {vendor.business_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>{vendor.business_name}</Text>
                      <Text style={styles.vendorHandle}>@{vendor.handle}</Text>
                      <Text style={styles.vendorDate}>
                        Applied {formatDate(vendor.created_at)}
                      </Text>
                    </View>
                  </View>

                  {vendor.description && (
                    <Text style={styles.vendorDescription} numberOfLines={2}>
                      {vendor.description}
                    </Text>
                  )}

                  <View style={styles.vendorMeta}>
                    {vendor.business_type && (
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{vendor.business_type}</Text>
                      </View>
                    )}
                    {vendor.postcode && (
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{vendor.postcode}</Text>
                      </View>
                    )}
                    {vendor.phone && (
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{vendor.phone}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.vendorActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      style={styles.rejectButton}
                      textStyle={styles.rejectButtonText}
                      onPress={() => handleReject(vendor.id, vendor.business_name)}
                      loading={actionLoading === vendor.id}
                      disabled={actionLoading === vendor.id}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      style={styles.approveButton}
                      onPress={() => handleApprove(vendor.id)}
                      loading={actionLoading === vendor.id}
                      disabled={actionLoading === vendor.id}
                    >
                      Approve
                    </Button>
                  </View>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Search vendors..."
              containerStyle={styles.searchContainer}
            />

            {filteredVendors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No vendors found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'No vendors have signed up yet.'}
                </Text>
              </View>
            ) : (
              filteredVendors.map((vendor) => (
                <Card key={vendor.id} style={styles.vendorCard}>
                  <View style={styles.vendorRowFull}>
                    <View style={styles.vendorAvatar}>
                      <Text style={styles.vendorAvatarText}>
                        {vendor.business_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.vendorInfoFull}>
                      <Text style={styles.vendorName}>{vendor.business_name}</Text>
                      <Text style={styles.vendorHandle}>@{vendor.handle}</Text>
                      <Text style={styles.vendorDate}>
                        Joined {formatDate(vendor.created_at)}
                      </Text>
                    </View>
                    <View style={styles.toggleContainer}>
                      <Text style={[
                        styles.toggleLabel,
                        { color: vendor.is_active ? colors.success : colors.error },
                      ]}>
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </Text>
                      <Switch
                        value={vendor.is_active}
                        onValueChange={(val) => handleToggleActive(vendor.id, val)}
                        trackColor={{ false: colors.grey300, true: colors.successPale }}
                        thumbColor={vendor.is_active ? colors.success : colors.grey400}
                        disabled={actionLoading === vendor.id}
                      />
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fffdf9',
  },

  // Search
  searchContainer: {
    marginBottom: spacing.md,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Vendor Card
  vendorCard: {
    marginBottom: spacing.md,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vendorAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  vendorHandle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vendorDate: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  vendorDescription: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  // Meta Badges
  vendorMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaBadge: {
    backgroundColor: colors.grey100,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  metaBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },

  // Actions
  vendorActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectButton: {
    flex: 1,
    borderColor: colors.error,
  },
  rejectButtonText: {
    color: colors.error,
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.success,
  },

  // All Vendors Row
  vendorRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorInfoFull: {
    flex: 1,
  },
  toggleContainer: {
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  toggleLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
  },
});
