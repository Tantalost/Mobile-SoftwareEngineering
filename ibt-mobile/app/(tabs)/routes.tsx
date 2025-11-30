import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl, ActivityIndicator, StatusBar } from 'react-native';
import { Card, Chip, Searchbar, Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from '../../src/config';

interface BusTrip {
  _id: string;
  templateNo: string;
  route: string;         
  time: string;         
  departureTime?: string;
  date: string;          
  company: string;       
  status: string;       
  ticketReferenceNo: string;
  isArchived: boolean;
}

export default function RoutesPage() {
  const [trips, setTrips] = useState<BusTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      console.log(`Fetching trips from: ${API_URL}/bus-routes`);
      const response = await fetch(`${API_URL}/bus-routes`);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        setTrips(data);
      } catch (e) {
        console.error("JSON Parse error:", text);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrips();
  }, []);

  const filteredTrips = trips.filter(trip => 
    trip.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.templateNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const s = status ? status.toLowerCase() : 'active';
    if (s === 'active' || s === 'on time') return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
    if (s === 'delayed') return { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' };
    if (s === 'cancelled') return { bg: '#FFEBEE', text: '#C62828', border: '#EF9A9A' };
    return { bg: '#F5F5F5', text: '#616161', border: '#E0E0E0' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text variant="bodyMedium" style={{ marginTop: 16, color: '#666' }}>Loading Schedules...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Surface style={styles.header} elevation={0}>
        <View>
          <Text variant="headlineMedium" style={styles.headerTitle}>Bus Schedules</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>Upcoming Departures</Text>
        </View>
        <View style={styles.headerIconBg}>
           <Icon name="calendar-clock" size={26} color="#1B5E20" />
        </View>
      </Surface>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search destination or company..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#666"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />
        }
      >
        <Text variant="labelMedium" style={styles.resultsText}>
          UPCOMING TRIPS ({filteredTrips.length})
        </Text>

        {filteredTrips.map((trip) => {
          const statusStyle = getStatusColor(trip.status);
          const tripDate = new Date(trip.date);

          return (
            <Card key={trip._id} style={styles.tripCard} mode="elevated">
              <Card.Content>
                
                {/* Top Row: Date & Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.dateBadge}>
                    <Icon name="calendar" size={14} color="#555" />
                    <Text style={styles.dateText}>
                      {tripDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  
                  <Chip style={[styles.statusChip, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                     <Text style={{color: statusStyle.text, fontSize: 10, fontWeight: '700'}}>{trip.status ? trip.status.toUpperCase() : 'ACTIVE'}</Text>
                  </Chip>
                </View>

                {/* Main Info: Time & Route */}
                <View style={styles.mainInfo}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{trip.time}</Text>
                    <Text style={styles.departureLabel}>DEPARTURE</Text>
                  </View>
                  
                  <View style={styles.verticalDivider} />
                  
                  <View style={styles.routeContainer}>
                    <Text variant="titleMedium" style={styles.companyText}>{trip.company}</Text>
                    <View style={styles.routeRow}>
                       <Icon name="map-marker-path" size={16} color="#1B5E20" style={{marginTop: 2}} />
                       <Text style={styles.routeText} numberOfLines={2}>{trip.route}</Text>
                    </View>
                  </View>
                </View>

                {/* Footer: Template No */}
                <View style={styles.footer}>
                   <Text style={styles.footerText}>Ref: {trip.templateNo}</Text>
                   {trip.ticketReferenceNo ? <Text style={styles.footerText}>Ticket: {trip.ticketReferenceNo}</Text> : null}
                </View>

              </Card.Content>
            </Card>
          );
        })}

        {filteredTrips.length === 0 && (
           <View style={styles.emptyContainer}>
              <Icon name="bus-clock" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No upcoming trips found</Text>
           </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F7F9FC'
  },
  
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { 
    fontWeight: '800', 
    color: '#1A1A1A',
    letterSpacing: -0.5 
  },
  headerSubtitle: { 
    color: '#666666', 
    marginTop: 2 
  },
  headerIconBg: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 12,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F7F9FC',
  },
  searchbar: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    height: 48,
  },
  searchInput: {
    minHeight: 0, 
  },

  // Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  resultsText: { 
    color: '#888', 
    marginBottom: 12, 
    marginLeft: 4, 
    fontWeight: '600',
    letterSpacing: 0.5
  },

  // Trip Cards
  tripCard: {
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  statusChip: {
    height: 24,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main Info Section
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    minWidth: 70,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
  },
  departureLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
    marginHorizontal: 16,
  },
  routeContainer: {
    flex: 1,
  },
  companyText: {
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  routeText: {
    color: '#555',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // Footer
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace', 
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
});