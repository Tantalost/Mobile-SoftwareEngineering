import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, SegmentedButtons, Text, Button, ActivityIndicator } from 'react-native-paper'; // Added Button, ActivityIndicator
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from "../src/firebaseConfig"
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';

export default function StallsPage() {
  const [selectedFloor, setSelectedFloor] = useState('Permanent');
  const [selectedStall, setSelectedStall] = useState<{ row: number; col: number } | null>(null);
  
  const [occupiedStalls, setOccupiedStalls] = useState<{ row: number; col: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const rows = 5;
  const cols = 5;

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "stalls"),
      where("floor", "==", selectedFloor),
      where("status", "==", "Paid")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveStalls = snapshot.docs.map(doc => ({
        row: doc.data().row,
        col: doc.data().col
      }));
      setOccupiedStalls(liveStalls);
      setLoading(false);
      
      if (selectedStall) {
        const isNowTaken = liveStalls.some(s => s.row === selectedStall.row && s.col === selectedStall.col);
        if (isNowTaken) setSelectedStall(null);
      }
    }, (error) => {
      console.error("Error fetching stalls:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedFloor]);

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
    // Toggle selection
    if (isStallSelected(row, col)) {
      setSelectedStall(null);
    } else {
      setSelectedStall({ row, col });
    }
  };

  // --- 2. APPLY FUNCTION ---
  const handleApplyForStall = async () => {
    if (!selectedStall) return;
    
    // In a real app, you would get these details from the logged-in user's profile
    // For now, we'll just simulate sending a request
    Alert.alert(
      "Confirm Application",
      `Apply for ${selectedFloor} Stall ${selectedStall.row}-${selectedStall.col}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Apply Now", 
          onPress: async () => {
            setApplying(true);
            try {
              // Write to 'waitlist' collection for Admin to see
              await addDoc(collection(db, "waitlist"), {
                name: "Mobile User", // Replace with real user data
                contact: "09123456789", // Replace with real user data
                email: "user@example.com",
                preferredType: selectedFloor,
                notes: `Applied via App for Slot Row ${selectedStall.row}, Col ${selectedStall.col}`,
                dateRequested: new Date().toISOString(),
                status: "Pending",
                targetSlot: { row: selectedStall.row, col: selectedStall.col }
              });
              
              Alert.alert("Success", "Application sent! The admin will review your request.");
              setSelectedStall(null);
            } catch (error) {
              Alert.alert("Error", "Could not send application. Try again.");
              console.error(error);
            } finally {
              setApplying(false);
            }
          }
        }
      ]
    );
  };

  const getStallStatus = (row: number, col: number) => {
    if (isStallOccupied(row, col)) return 'occupied';
    if (isStallSelected(row, col)) return 'selected';
    return 'available';
  };

  const getStallColor = (status: string) => {
    switch (status) {
      case 'occupied': return '#F44336';
      case 'selected': return '#4CAF50';
      default: return '#E0E0E0';
    }
  };

  const getStallIcon = (status: string) => {
    switch (status) {
      case 'occupied': return 'close';
      case 'selected': return 'check';
      default: return 'circle-outline';
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
                { value: 'Night Market', label: 'Night Market' }, // Fixed Label to match DB
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {loading ? (
           <View style={{ padding: 20 }}>
             <ActivityIndicator animating={true} color="#1B5E20" />
             <Text style={{ textAlign: 'center', marginTop: 10, color: '#666' }}>Loading Availability...</Text>
           </View>
        ) : (
          <>
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
            </View>

            {/* Stall Layout */}
            <Card style={styles.layoutCard} mode="elevated" elevation={2}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {selectedFloor} - Stall Layout
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
                              {/* Optional: Add Text label back if needed, currently just icons to save space */}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>

            {/* Selected Stall Info & Apply Button */}
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
                    {selectedFloor} - Row {selectedStall.row}, Column {selectedStall.col}
                  </Text>
                  <Text variant="bodySmall" style={styles.infoSubtext}>
                    This stall is available.
                  </Text>
                  
                  <Button 
                    mode="contained" 
                    onPress={handleApplyForStall} 
                    loading={applying}
                    disabled={applying}
                    style={{ marginTop: 15, backgroundColor: '#1B5E20'}}
                  >
                   <Text variant="bodySmall" style={styles.Text}>
                   Apply this slot 
                </Text>
                  </Button>
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ... Keep your existing styles as they were ...
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

  Text: {
    color: '#FFFFFF',
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