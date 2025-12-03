import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Avatar, Card, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../../src/config'; 

// --- Interfaces matching your Backend ---
interface BusTrip {
  _id: string;
  templateNo: string;
  route: string;
  time: string;
  date: string;
  company: string;
  status: string;
}

interface LostItem {
  _id: string;
  title?: string;
  description: string;
  location: string;
  dateTime: string;
  status: string;
  trackingNo: string;
}

type UserData = { 
  id: string; 
  name: string; 
  email: string; 
  contact: string; 
};

export const Dashboard: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [busTrips, setBusTrips] = useState<BusTrip[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchAllData = async () => {
        try {
          // 1. Check Login Status
          const storedUser = await AsyncStorage.getItem('ibt_user');
          if (isActive) {
             if (storedUser) {
               setUser(JSON.parse(storedUser));
             } else {
               setUser(null);
             }
          }

          // 2. Fetch Dashboard Data
          const [routesRes, lostRes] = await Promise.all([
            fetch(`${API_URL}/bus-routes`),
            fetch(`${API_URL}/lost-found`)
          ]);

          const routesData = await routesRes.json();
          const lostData = await lostRes.json();

          if (isActive) {
            setBusTrips(routesData);
            setLostItems(lostData);
            setLoading(false);
          }
        } catch (error) {
          console.error("Dashboard fetch error:", error);
          if (isActive) setLoading(false);
        }
      };

      fetchAllData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // Filter Bus Routes for Search
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) {
      return busTrips.slice(0, 3);
    }

    const query = searchQuery.toLowerCase();
    return busTrips
      .filter((trip) =>
        trip.route.toLowerCase().includes(query) ||
        trip.company.toLowerCase().includes(query) ||
        trip.templateNo.toLowerCase().includes(query)
      )
      .slice(0, 4);
  }, [busTrips, searchQuery]);

  const latestLostItems = lostItems.slice(0, 3);

  const currentTrip = useMemo(() => {
    if (busTrips.length === 0) return null;
    return busTrips[0]; 
  }, [busTrips]);

  const getUserInitials = (name: string) => {
    if (!name) return "G";
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // --- Navigate with Route ID ---
  const handleRoutePress = (route: BusTrip) => {
    router.push({
      pathname: '/(tabs)/routes',
      params: { tripId: route._id } 
    });
  };

  // --- NEW: Navigate with Lost Item ID ---
  const handleLostItemPress = (item: LostItem) => {
    router.push({
      pathname: '/(tabs)/lost-found',
      params: { itemId: item._id } // Passing the specific ID
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Dashboard
            </Text>
            <Text variant="bodySmall" style={{color: '#666'}}>
                {user ? `Welcome, ${user.name}` : 'Welcome, Guest'}
            </Text>
          </View>
          
          {user ? (
            <Avatar.Text
              size={40}
              label={getUserInitials(user.name)}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
          ) : (
            <Avatar.Icon 
              size={40} 
              icon="account" 
              style={[styles.avatar, { backgroundColor: '#B0BEC5' }]} 
              color="white"
            />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- SEARCH / WHERE TO SECTION --- */}
        <Card style={[styles.sectionCard, styles.whereCard]} mode="elevated" elevation={3}>
          <Card.Content style={styles.whereContent}>
            <Text variant="titleLarge" style={styles.whereTitle}>
              Where to?
            </Text>

            <View style={styles.searchInputContainer}>
              <Icon name="magnify" size={20} color="#6C7B8A" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search destination or company..."
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

            {/* Suggestions List */}
            {filteredRoutes.length > 0 ? (
              <View style={styles.suggestionList}>
                {filteredRoutes.map((route) => (
                  <TouchableOpacity 
                    key={route._id} 
                    style={styles.suggestionItem}
                    onPress={() => handleRoutePress(route)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIcon}>
                      <Icon name="bus" size={16} color="#1B5E20" />
                    </View>
                    <View style={styles.suggestionTextWrapper}>
                      <Text variant="bodyMedium" style={styles.suggestionTitle}>
                        {route.company} · {route.time}
                      </Text>
                      <Text variant="bodySmall" style={styles.suggestionSubtitle}>
                        {route.route}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text variant="bodySmall" style={styles.noResultsText}>
                No routes match “{searchQuery}”
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* --- CURRENT / NEXT TRIP SECTION --- */}
        {currentTrip && (
          <Card style={[styles.sectionCard, styles.tripCard]} mode="elevated" elevation={2}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionHeader}>
                Next Departure
              </Text>
              <View style={styles.tripHeader}>
                <View style={styles.tripBadge}>
                  <Icon name="bus-clock" size={20} color="#1B5E20" />
                </View>
                <View style={styles.tripDetails}>
                  <Text variant="bodySmall" style={styles.tripRouteId}>
                    {currentTrip.templateNo}
                  </Text>
                  <Text variant="titleMedium" style={styles.tripRouteName}>
                    {currentTrip.company}
                  </Text>
                </View>
                <Chip style={styles.arrivalChip} textStyle={styles.arrivalChipText}>
                  {currentTrip.status || 'Active'}
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
                      Zamboanga City (IBT)
                    </Text>
                    <Text variant="bodySmall" style={styles.stopMeta}>
                      {currentTrip.time}
                    </Text>
                  </View>
                  <View style={styles.stopRow}>
                    <Text variant="titleSmall" style={styles.stopNameInactive}>
                      {currentTrip.route.replace('Zamboanga - ', '')}
                    </Text>
                    <Text variant="bodySmall" style={styles.stopMeta}>
                      {new Date(currentTrip.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* --- LOST & FOUND SECTION --- */}
        <Card style={[styles.sectionCard, styles.lostCard]} mode="elevated" elevation={2}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.sectionHeader}>
                Recent Lost Items
              </Text>
              <Link href="/(tabs)/lost-found" asChild>
                <TouchableOpacity>
                  <Text variant="bodySmall" style={styles.seeAllText}>
                    See all
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.lostItemsList}>
              {latestLostItems.length === 0 ? (
                 <Text style={{color: '#999', fontStyle:'italic'}}>No recent lost items reported.</Text>
              ) : (
                latestLostItems.map((item, index) => (
                  <TouchableOpacity 
                    key={item._id} 
                    style={styles.lostItemRow}
                    onPress={() => handleLostItemPress(item)} // Changed to TouchableOpacity with Handler
                    activeOpacity={0.7}
                  >
                    <View style={styles.lostItemIconWrapper}>
                      <Icon name="briefcase-search-outline" size={18} color="#1B5E20" />
                    </View>
                    <View style={styles.lostItemContent}>
                      <Text variant="bodyMedium" style={styles.lostItemTitle}>
                        {item.description.length > 25 ? item.description.substring(0, 25) + "..." : item.description}
                      </Text>
                      <Text variant="bodySmall" style={styles.lostItemMeta}>
                          #{item.trackingNo} • {item.location}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#CBD5E1" />
                    {index < latestLostItems.length - 1 && <View style={styles.lostItemDivider} />}
                  </TouchableOpacity>
                ))
              )}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
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
    backgroundColor: '#1B5E20',
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
    paddingVertical: 8, 
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
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  arrivalChipText: {
    color: '#0F7842',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
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
    backgroundColor: '#E0F7EC',
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