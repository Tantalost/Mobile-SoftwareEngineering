import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Searchbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LostFoundPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Dummy data for lost items
  const lostItems = [
    {
      id: 1,
      title: 'Black Leather Wallet',
      description: 'Found near the main entrance. Contains ID and credit cards.',
      location: 'Main Building - Lobby',
      date: '2025-01-15',
      category: 'wallet',
      status: 'found',
      contact: 'ibt@university.edu',
    },
    {
      id: 2,
      title: 'Blue Backpack',
      description: 'Medium-sized blue backpack with laptop compartment.',
      location: 'Library - 2nd Floor',
      date: '2025-01-14',
      category: 'bag',
      status: 'found',
      contact: 'ibt@university.edu',
    },
    {
      id: 3,
      title: 'iPhone 13 Pro',
      description: 'Silver iPhone with black case. Lock screen shows family photo.',
      location: 'Cafeteria',
      date: '2025-01-13',
      category: 'electronics',
      status: 'found',
      contact: 'ibt@university.edu',
    },
    {
      id: 4,
      title: 'Red Water Bottle',
      description: 'Stainless steel water bottle with university logo.',
      location: 'Gym - Locker Room',
      date: '2025-01-12',
      category: 'personal',
      status: 'found',
      contact: 'ibt@university.edu',
    },
    {
      id: 5,
      title: 'Keys with Keychain',
      description: 'Set of keys with a small teddy bear keychain.',
      location: 'Parking Lot B',
      date: '2025-01-11',
      category: 'keys',
      status: 'found',
      contact: 'ibt@university.edu',
    },
    {
      id: 6,
      title: 'Glasses Case',
      description: 'Brown leather glasses case with prescription glasses inside.',
      location: 'Student Center',
      date: '2025-01-10',
      category: 'personal',
      status: 'found',
      contact: 'ibt@university.edu',
    },
  ];

  const categories = [
    { id: 'all', label: 'All', icon: 'view-grid' },
    { id: 'wallet', label: 'Wallet', icon: 'wallet' },
    { id: 'bag', label: 'Bag', icon: 'bag-personal' },
    { id: 'electronics', label: 'Electronics', icon: 'cellphone' },
    { id: 'keys', label: 'Keys', icon: 'key' },
    { id: 'personal', label: 'Personal', icon: 'account' },
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    return cat?.icon || 'help-circle';
  };

  const filteredItems = lostItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Lost & Found
        </Text>
        <Icon name="magnify" size={28} color="#1B5E20" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Searchbar
          placeholder="Search items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#666666"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
              icon={() => (
                <Icon
                  name={category.icon as keyof typeof Icon.glyphMap}
                  size={18}
                  color={selectedCategory === category.id ? '#FFFFFF' : '#666666'}
                />
              )}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              textStyle={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextSelected,
              ]}
            >
              {category.label}
            </Chip>
          ))}
        </ScrollView>

        {/* Results Count */}
        <Text variant="bodySmall" style={styles.resultsText}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
        </Text>

        {/* Lost Items List */}
        {filteredItems.map((item) => (
          <Card key={item.id} style={styles.itemCard} mode="elevated" elevation={2}>
            <Card.Content>
              <View style={styles.itemHeader}>
                <View style={styles.itemIconContainer}>
                  <Icon name={getCategoryIcon(item.category) as keyof typeof Icon.glyphMap} size={24} color="#31694E" />
                </View>
                <View style={styles.itemInfo}>
                  <Text variant="titleMedium" style={styles.itemTitle}>
                    {item.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemDate}>
                    Found on {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Chip
                  icon={() => <Icon name="check-circle" size={14} color="#FFFFFF" />}
                  style={styles.statusChip}
                  textStyle={styles.statusChipText}
                >
                  Found
                </Chip>
              </View>

              <Text variant="bodyMedium" style={styles.itemDescription}>
                {item.description}
              </Text>

              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Icon name="map-marker" size={16} color="#666666" />
                  <Text variant="bodySmall" style={styles.detailText}>
                    {item.location}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="email" size={16} color="#666666" />
                  <Text variant="bodySmall" style={styles.detailText}>
                    {item.contact}
                  </Text>
                </View>
              </View>

              <Button
                mode="contained"
                buttonColor='#31694E'
                icon={() => <Icon name="email-outline" size={18} color="#FFFFFF" />}
                style={styles.contactButton}
                onPress={() => {
                }}
              >
                Contact
              </Button>
            </Card.Content>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="magnify" size={64} color="#CCCCCC" />
            <Text variant="titleMedium" style={styles.emptyText}>
              No items found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Try adjusting your search or filter
            </Text>
          </View>
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
  searchbar: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 0,
    backgroundColor: '#FFFFFF',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  categoryChipText: {
    color: '#666666',
    fontSize: 12,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  resultsText: {
    color: '#666666',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  itemCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemDate: {
    color: '#999999',
    fontSize: 11,
  },
  statusChip: {
    height: 35,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 5,
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemDescription: {
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  itemDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#1B5E20',
    fontSize: 12,
  },
  contactButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#666666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#999999',
    marginTop: 8,
  },
});