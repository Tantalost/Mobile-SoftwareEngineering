import { StyleSheet } from 'react-native';
import { colors } from '../themes/stallsColors'; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  header: { 
    backgroundColor: colors.white, 
    paddingHorizontal: 20, paddingVertical: 15, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
  },
  headerTitle: { fontWeight: '700', color: colors.black },
  pageTitle: { color: colors.primary, fontWeight: 'bold', marginTop: 10, textAlign: 'center', fontSize: 22 },

  paymentCard: { backgroundColor: colors.white, marginBottom: 20, overflow: 'hidden', borderRadius: 12 },
  paymentHeaderBg: { backgroundColor: colors.primary, padding: 15 },
  paymentHeaderTitle: { color: colors.white, textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  paymentHeaderSub: { color: colors.white, textAlign: 'center', fontSize: 12, opacity: 0.9 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingBottom: 8 },
  paymentLabel: { flex: 0.4, color: colors.textMedium, fontWeight: '600', fontSize: 12, marginTop: 2 },
  paymentValue: { flex: 0.6, textAlign: 'right', fontWeight: 'bold', fontSize: 14, color: colors.textDark, flexWrap: 'wrap' },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  totalBlock: { alignItems: 'center', marginVertical: 10, padding: 10, backgroundColor: '#F9F9F9', borderRadius: 8 },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  totalAmount: { fontSize: 32, fontWeight: '900', color: '#C62828', marginVertical: 5 }, // Keeping hardcoded red for financial emphasis, or use colors.error
  totalNote: { fontSize: 10, color: '#C62828', fontWeight: 'bold' },

  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionHeader: { marginBottom: 10, fontWeight: 'bold', marginTop: 10, color: colors.textDark },
  input: { marginBottom: 15, backgroundColor: colors.white },
  submitButton: { backgroundColor: colors.primary, paddingVertical: 5, borderRadius: 8 },
  fileButton: { marginTop: 10, borderColor: '#ccc' },
  
  statusCard: { marginTop: 20, width: '100%', backgroundColor: colors.white },
  statusTitle: { marginTop: 20, fontWeight: 'bold', color: "#444" },
  statusText: { fontSize: 16, textAlign: 'center', color: "#666" },
  sectionTitle: { fontWeight: '600', marginBottom: 12, color: colors.black },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  stallBase: { width: '23%', aspectRatio: 1, marginBottom: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stallAvailable: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  stallOccupied: { backgroundColor: colors.occupied },
  stallSelected: { backgroundColor: colors.primaryLight },
  slotLabelMain: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  stallTextAvailable: { color: colors.textLight, fontSize: 12 },
  stallTextWhite: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  floorCard: { marginBottom: 16, backgroundColor: colors.white },
  layoutCard: { marginBottom: 10, backgroundColor: colors.white },
  infoCard: { marginTop: 8, backgroundColor: colors.primaryPale, borderColor: colors.primaryLight, borderWidth: 1 },
  modalContent: { backgroundColor: colors.white, padding: 20, margin: 20, borderRadius: 10, maxHeight: '90%' },
  summaryContainer: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center'},
  reviewSection: { padding: 15, backgroundColor: '#FAFAFA', borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  reviewLabel: { fontSize: 11, color: '#777', fontWeight: '600', marginBottom: 2 },
  reviewValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 }
});

export default styles;