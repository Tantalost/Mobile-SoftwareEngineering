import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Avatar, Card, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const locationLabel = 'Normal Road, Baliwasan, Z.C';

  // Dummy data for bus routes available today
  const routes = [
    {
      id: 1,
      routeNumber: 'Route 101',
      name: 'Downtown Express',
      origin: 'Central Station',
      destination: 'University Campus',
      nextDeparture: '08:15 AM',
      status: 'On time',
    },
    {
      id: 2,
      routeNumber: 'Route 202',
      name: 'Coastal Line',
      origin: 'Beach Terminal',
      destination: 'City Center',
      nextDeparture: '08:30 AM',
      status: 'Boarding',
    },
    {
      id: 3,
      routeNumber: 'Route 303',
      name: 'Airport Shuttle',
      origin: 'Airport Terminal',
      destination: 'Downtown',
      nextDeparture: '08:45 AM',
      status: 'Delayed',
    },
    {
      id: 4,
      routeNumber: 'Route 404',
      name: 'Night Service',
      origin: 'Central Station',
      destination: 'Residential Area',
      nextDeparture: '09:00 AM',
      status: 'Scheduled',
    },
  ];

  const currentRoute = routes[0];

  // Dummy data for latest lost and found items
  const lostItems = [
    {
      id: 1,
      title: 'Black Leather Wallet',
      location: 'Main Building - Lobby',
      date: '2024-01-15',
      category: 'Wallet',
    },
    {
      id: 2,
      title: 'Blue Backpack',
      location: 'Library - 2nd Floor',
      date: '2024-01-14',
      category: 'Bag',
    },
    {
      id: 3,
      title: 'iPhone 13 Pro',
      location: 'Cafeteria',
      date: '2024-01-13',
      category: 'Electronics',
    },
    {
      id: 4,
      title: 'Keys with Keychain',
      location: 'Parking Lot B',
      date: '2024-01-12',
      category: 'Keys',
    },
  ];

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) {
      return routes.slice(0, 3);
    }

    const query = searchQuery.toLowerCase();

    return routes
      .filter((route) =>
        [route.routeNumber, route.name, route.origin, route.destination].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
      .slice(0, 4);
  }, [routes, searchQuery]);

  const latestLostItems = lostItems.slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Dashboard
          </Text>
          <Avatar.Text
            size={40}
            label="JD"
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Where To Section */}
        <Card style={[styles.sectionCard, styles.whereCard]} mode="elevated" elevation={3}>
          <Card.Content style={styles.whereContent}>
            <Text variant="titleLarge" style={styles.whereTitle}>
              Where to?
            </Text>

            <View style={styles.locationRow}>
              <View style={styles.locationIconWrapper}>
                <Icon name="map-marker" size={18} color="#1B5E20" />
              </View>
              <Text variant="bodyMedium" style={styles.locationText}>
                {locationLabel}
              </Text>
            </View>

            <View style={styles.searchInputContainer}>
              <Icon name="magnify" size={20} color="#6C7B8A" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for a route or stop..."
                placeholderTextColor="#9AA5B1"
              />
              {!!searchQuery && (
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel="Clear search"
                >
                  <Icon name="close" size={16} color="#1B5E20" />
                </TouchableOpacity>
              )}
            </View>

            {filteredRoutes.length > 0 ? (
              <View style={styles.suggestionList}>
                {filteredRoutes.map((route) => (
                  <View key={route.id} style={styles.suggestionItem}>
                    <View style={styles.suggestionIcon}>
                      <Icon name="bus" size={16} color="#1B5E20" />
                    </View>
                    <View style={styles.suggestionTextWrapper}>
                      <Text variant="bodyMedium" style={styles.suggestionTitle}>
                        {route.routeNumber} · {route.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.suggestionSubtitle}>
                        {route.origin} → {route.destination}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="bodySmall" style={styles.noResultsText}>
                No routes match “{searchQuery}”
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Current Bus Route Section */}
        <Card style={[styles.sectionCard, styles.tripCard]} mode="elevated" elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionHeader}>
              Current Trip
            </Text>
            <View style={styles.tripHeader}>
              <View style={styles.tripBadge}>
                <Icon name="bus" size={20} color="#1B5E20" />
              </View>
              <View style={styles.tripDetails}>
                <Text variant="bodySmall" style={styles.tripRouteId}>
                  {currentRoute.routeNumber}
                </Text>
                <Text variant="titleMedium" style={styles.tripRouteName}>
                  {currentRoute.name}
                </Text>
              </View>
              <Chip style={styles.arrivalChip} textStyle={styles.arrivalChipText}>
                5 min
              </Chip>
            </View>

            <View style={styles.tripDivider} />

            <View style={styles.tripStops}>
              <View style={styles.timelineColumn}>
                <View style={styles.timelineDotActive} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineDot} />
              </View>
              <View style={styles.stopDetails}>
                <View style={styles.stopRow}>
                  <Text variant="titleSmall" style={styles.stopName}>
                    {currentRoute.origin}
                  </Text>
                  <Text variant="bodySmall" style={styles.stopMeta}>
                    {currentRoute.nextDeparture}
                  </Text>
                </View>
                <View style={styles.stopRow}>
                  <Text variant="titleSmall" style={styles.stopNameInactive}>
                    {currentRoute.destination}
                  </Text>
                  <Text variant="bodySmall" style={styles.stopMeta}>
                    Est. 10:37 AM
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Lost & Found Snapshot */}
        <Card style={[styles.sectionCard, styles.lostCard]} mode="elevated" elevation={2}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.sectionHeader}>
                Lost & Found
              </Text>
              <Link href="/lost-found" asChild>
                <TouchableOpacity>
                  <Text variant="bodySmall" style={styles.seeAllText}>
                    See all
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.lostItemsList}>
              {latestLostItems.map((item, index) => (
                <View key={item.id} style={styles.lostItemRow}>
                  <View style={styles.lostItemIconWrapper}>
                    <Icon name="briefcase-outline" size={18} color="#1B5E20" />
                  </View>
                  <View style={styles.lostItemContent}>
                    <Text variant="bodyMedium" style={styles.lostItemTitle}>
                      {item.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.lostItemMeta}>
                      {item.location}, {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  {index < latestLostItems.length - 1 && <View style={styles.lostItemDivider} />}
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  whereCard: {
    shadowColor: '#D0E2FF',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  whereContent: {
    gap: 16,
  },
  whereTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3FF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  locationIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1F8D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  sectionHeader: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  filterButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CDECE1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionList: {
    marginTop: 8,
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTextWrapper: {
    flex: 1,
  },
  suggestionTitle: {
    color: '#0F172A',
    fontWeight: '600',
  },
  suggestionSubtitle: {
    color: '#64748B',
    fontSize: 12,
  },
  noResultsText: {
    color: '#94A3B8',
    marginTop: 8,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  tripBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E0F7EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDetails: {
    flex: 1,
  },
  tripRouteId: {
    color: '#15803D',
    fontWeight: '600',
  },
  tripRouteName: {
    color: '#0F172A',
    fontWeight: '700',
  },
  arrivalChip: {
    backgroundColor: '#CDECE1',
    height: 28,
  },
  arrivalChipText: {
    color: '#0F7842',
    fontWeight: '600',
  },
  tripDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  tripStops: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineColumn: {
    alignItems: 'center',
  },
  timelineDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    borderWidth: 4,
    borderColor: '#D1FADF',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5F5',
    marginVertical: 6,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CBD5F5',
    borderWidth: 4,
    borderColor: '#E2E8F0',
  },
  stopDetails: {
    flex: 1,
    gap: 16,
  },
  stopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: {
    fontWeight: '700',
    color: '#0F172A',
  },
  stopNameInactive: {
    fontWeight: '600',
    color: '#475569',
  },
  stopMeta: {
    color: '#64748B',
    fontSize: 12,
  },
  lostCard: {
    backgroundColor: '#FFFFFF',
  },
  seeAllText: {
    color: '#0F7842',
    fontWeight: '600',
  },
  lostItemsList: {
    gap: 16,
  },
  lostItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
  lostItemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lostItemContent: {
    flex: 1,
  },
  lostItemTitle: {
    fontWeight: '600',
    color: '#0F172A',
  },
  lostItemMeta: {
    color: '#64748B',
    fontSize: 12,
  },
  lostItemDivider: {
    position: 'absolute',
    bottom: 0,
    left: 52,
    right: 0,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
});