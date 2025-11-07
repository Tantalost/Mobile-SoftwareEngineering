import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function RoutesPage() {
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);

  // Dummy data for bus routes
  const routes = [
    {
      id: 1,
      routeNumber: 'Route 101',
      name: 'Downtown Express',
      origin: 'Central Station',
      destination: 'University Campus',
      stops: ['Central Station', 'Main Square', 'Park Avenue', 'University Campus'],
      duration: '25 min',
      frequency: 'Every 15 min',
      status: 'active',
    },
    {
      id: 2,
      routeNumber: 'Route 202',
      name: 'Coastal Line',
      origin: 'Beach Terminal',
      destination: 'City Center',
      stops: ['Beach Terminal', 'Marina Bay', 'Shopping District', 'City Center'],
      duration: '35 min',
      frequency: 'Every 20 min',
      status: 'active',
    },
    {
      id: 3,
      routeNumber: 'Route 303',
      name: 'Airport Shuttle',
      origin: 'Airport Terminal',
      destination: 'Downtown',
      stops: ['Airport Terminal', 'Business District', 'Downtown'],
      duration: '45 min',
      frequency: 'Every 30 min',
      status: 'active',
    },
    {
      id: 4,
      routeNumber: 'Route 404',
      name: 'Night Service',
      origin: 'Central Station',
      destination: 'Residential Area',
      stops: ['Central Station', 'Hospital', 'Residential Area'],
      duration: '30 min',
      frequency: 'Every 45 min',
      status: 'limited',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Bus Routes
        </Text>
        <Icon name="bus" size={28} color="#2196F3" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {routes.map((route, index) => (
          <Card
            key={route.id}
            style={styles.routeCard}
            mode="elevated"
            elevation={2}
            onPress={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
          >
            <Card.Content>
              <View style={styles.routeHeader}>
                <View style={styles.routeInfo}>
                  <Text variant="titleLarge" style={styles.routeNumber}>
                    {route.routeNumber}
                  </Text>
                  <Text variant="titleMedium" style={styles.routeName}>
                    {route.name}
                  </Text>
                </View>
                <Chip
                  icon={() => (
                    <Icon
                      name={route.status === 'active' ? 'check-circle' : 'clock-outline'}
                      size={16}
                      color="#FFFFFF"
                    />
                  )}
                  style={[
                    styles.statusChip,
                    route.status === 'active' ? styles.activeChip : styles.limitedChip,
                  ]}
                  textStyle={styles.chipText}
                >
                  {route.status === 'active' ? 'Active' : 'Limited'}
                </Chip>
              </View>

              <View style={styles.routeDetails}>
                <View style={styles.detailRow}>
                  <Icon name="map-marker" size={18} color="#666666" />
                  <Text variant="bodyMedium" style={styles.detailText}>
                    {route.origin}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="map-marker-check" size={18} color="#666666" />
                  <Text variant="bodyMedium" style={styles.detailText}>
                    {route.destination}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="clock-outline" size={18} color="#666666" />
                  <Text variant="bodySmall" style={styles.detailText}>
                    {route.duration} • {route.frequency}
                  </Text>
                </View>
              </View>

              {selectedRoute === route.id && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.stopsContainer}>
                    <Text variant="titleSmall" style={styles.stopsTitle}>
                      Stops:
                    </Text>
                    {route.stops.map((stop, stopIndex) => (
                      <View key={stopIndex} style={styles.stopItem}>
                        <View style={styles.stopIndicator}>
                          {stopIndex === 0 && <View style={styles.startDot} />}
                          {stopIndex > 0 && stopIndex < route.stops.length - 1 && (
                            <View style={styles.middleDot} />
                          )}
                          {stopIndex === route.stops.length - 1 && <View style={styles.endDot} />}
                          {stopIndex < route.stops.length - 1 && (
                            <View style={styles.stopLine} />
                          )}
                        </View>
                        <Text variant="bodyMedium" style={styles.stopName}>
                          {stop}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  routeCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeNumber: {
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  routeName: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusChip: {
    height: 28,
  },
  activeChip: {
    backgroundColor: '#4CAF50',
  },
  limitedChip: {
    backgroundColor: '#FF9800',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  routeDetails: {
    marginTop: 8,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#666666',
    fontSize: 13,
  },
  divider: {
    marginVertical: 16,
  },
  stopsContainer: {
    marginTop: 8,
  },
  stopsTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
  },
  stopIndicator: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  startDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  middleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  endDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9800',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stopLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginTop: 2,
  },
  stopName: {
    flex: 1,
    color: '#333333',
    fontSize: 14,
  },
});