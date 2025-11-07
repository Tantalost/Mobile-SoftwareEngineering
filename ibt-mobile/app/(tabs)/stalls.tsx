import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, SegmentedButtons, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StallsPage() {
  const [selectedFloor, setSelectedFloor] = useState('Permanent');
  const [selectedStall, setSelectedStall] = useState<{ row: number; col: number } | null>(null);

  const rows = 5
  const cols = 5;

  // Dummy data for occupied stalls (row, col)
  const occupiedStalls = [
    { row: 1, col: 2 },
    { row: 1, col: 4 },
    { row: 2, col: 1 },
    { row: 3, col: 3 },
    { row: 4, col: 2 },
    { row: 4, col: 4 },
    { row: 5, col: 1 },
  ];

  const isStallOccupied = (row: number, col: number) => {
    return occupiedStalls.some((stall) => stall.row === row && stall.col === col);
  };

  const isStallSelected = (row: number, col: number) => {
    return selectedStall?.row === row && selectedStall?.col === col;
  };

  const handleStallPress = (row: number, col: number) => {
    if (isStallOccupied(row, col)) {
      Alert.alert('Stall Occupied', `Stall ${row}-${col} is currently occupied.`);
      return;
    }
    setSelectedStall({ row, col });
  };

  const getStallStatus = (row: number, col: number) => {
    if (isStallOccupied(row, col)) return 'occupied';
    if (isStallSelected(row, col)) return 'selected';
    return 'available';
  };

  const getStallColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return '#F44336';
      case 'selected':
        return '#4CAF50';
      default:
        return '#E0E0E0';
    }
  };

  const getStallIcon = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'close';
      case 'selected':
        return 'check';
      default:
        return 'circle-outline';
    }
  };

  const availableCount = rows * cols - occupiedStalls.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Stall Availability
        </Text>
        <Icon name="storefront-outline" size={28} color="#1B5E20" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.floorCard} mode="elevated" elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select Location
            </Text>
            <SegmentedButtons
              value={selectedFloor}
              onValueChange={setSelectedFloor}
              buttons={[
                { value: 'Permanent', label: 'Permanent' },
                { value: 'Nightmarket', label: 'Nightmarket' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E0E0E0' }]} />
            <Text variant="bodySmall" style={styles.legendText}>
              Available ({availableCount})
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text variant="bodySmall" style={styles.legendText}>
              Occupied ({occupiedStalls.length})
            </Text>
          </View>
          {selectedStall && (
            <View style={styles.summaryItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text variant="bodySmall" style={styles.legendText}>
                Selected (Stall {selectedStall.row}-{selectedStall.col})
              </Text>
            </View>
          )}
        </View>

        {/* Stall Layout */}
        <Card style={styles.layoutCard} mode="elevated" elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location {selectedFloor} - Stall Layout
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Tap on an available stall to select it
            </Text>

            <View style={styles.stallContainer}>
              {/* Column Headers */}
              <View style={styles.rowHeader}>
                <View style={styles.headerCell} />
                {Array.from({ length: cols }, (_, i) => (
                  <View key={i} style={styles.headerCell}>
                    <Text variant="labelSmall" style={styles.headerText}>
                      {i + 1}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Stall Rows */}
              {Array.from({ length: rows }, (_, rowIndex) => {
                const row = rowIndex + 1;
                return (
                  <View key={row} style={styles.stallRow}>
                    <View style={styles.rowLabel}>
                      <Text variant="labelMedium" style={styles.rowLabelText}>
                        Row {row}
                      </Text>
                    </View>

                    {Array.from({ length: cols }, (_, colIndex) => {
                      const col = colIndex + 1;
                      const status = getStallStatus(row, col);
                      const color = getStallColor(status);
                      const icon = getStallIcon(status);

                      return (
                        <TouchableOpacity
                          key={col}
                          style={[
                            styles.stall,
                            { backgroundColor: color },
                            status === 'occupied' && styles.stallDisabled,
                          ]}
                          onPress={() => handleStallPress(row, col)}
                          disabled={status === 'occupied'}
                        >
                          <Icon
                            name={icon}
                            size={status === 'selected' ? 20 : 16}
                            color={status === 'occupied' ? '#FFFFFF' : '#666666'}
                          />
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.stallLabel,
                              status === 'occupied' && styles.stallLabelWhite,
                            ]}
                          >
                            {row}-{col}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionRow}>
                <Icon name="information" size={18} color="#1B5E20" />
                <Text variant="bodySmall" style={styles.instructionText}>
                  Green stalls are available for selection
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Icon name="alert-circle" size={18} color="#F44336" />
                <Text variant="bodySmall" style={styles.instructionText}>
                  Red stalls are currently occupied
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Selected Stall Info */}
        {selectedStall && (
          <Card style={styles.infoCard} mode="elevated" elevation={2}>
            <Card.Content>
              <View style={styles.infoHeader}>
                <Icon name="check-circle" size={24} color="#4CAF50" />
                <Text variant="titleMedium" style={styles.infoTitle}>
                  Stall Selected
                </Text>
              </View>
              <Text variant="bodyLarge" style={styles.infoText}>
                Location {selectedFloor} - Row {selectedStall.row}, Column {selectedStall.col}
              </Text>
              <Text variant="bodySmall" style={styles.infoSubtext}>
                This stall is available for use
              </Text>
            </Card.Content>
          </Card>
        )}
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
  floorCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    color: '#666666',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    color: '#666666',
    fontSize: 12,
  },
  layoutCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  stallContainer: {
    marginTop: 16,
  },
  rowHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 60,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerText: {
    fontWeight: '600',
    color: '#666666',
  },
  stallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: {
    width: 60,
    paddingRight: 8,
  },
  rowLabelText: {
    fontWeight: '600',
    color: '#666666',
  },
  stall: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  stallDisabled: {
    opacity: 0.7,
  },
  stallLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  stallLabelWhite: {
    color: '#FFFFFF',
  },
  instructionsContainer: {
    marginTop: 20,
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    color: '#666666',
    fontSize: 12,
  },
  infoCard: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  infoText: {
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  infoSubtext: {
    color: '#666666',
  },
});