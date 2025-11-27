import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { Card, SegmentedButtons, Text, Button, ActivityIndicator, Modal, Portal, TextInput, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator'; 

import { db } from "../../src/firebaseConfig"; 
import { getAuth, signInAnonymously } from "firebase/auth"; 
import { collection, query, where, onSnapshot, setDoc, doc, updateDoc } from 'firebase/firestore';

const BILLING_CONFIG = {
  Permanent: {
    amountLabel: "₱ 6,000.00",
    periodLabel: "30 DAYS",
    rawAmount: 6000
  },
  NightMarket: { 
    amountLabel: "₱ 1,120.00",
    periodLabel: "7 DAYS",
    rawAmount: 1120
  }
};

const PAYMENT_INFO = {
  billerName: "OFFICE OF THE CITY ADMINISTRATOR",
  project: "ZC-IBT PERMANENT / NIGHT MARKET STALLS",
  note: "NO PARTIAL PAYMENT! NO PAYMENT - NO ENTRY / NO OPERATION OF STALL.",
  contactInfo: "(062) 991-1630 / (062) 991-4985"
};

type FileState = {
  permit: DocumentPicker.DocumentPickerAsset | null;
  validId: DocumentPicker.DocumentPickerAsset | null;
  clearance: DocumentPicker.DocumentPickerAsset | null; // Added Clearance
  receipt: DocumentPicker.DocumentPickerAsset | null;
};

type ApplicationData = {
  status: 'VERIFICATION_PENDING' | 'PAYMENT_UNLOCKED' | 'PAYMENT_REVIEW' | 'TENANT';
  targetSlot: string;
  floor: string; 
  contact: string;
  name: string;
  paymentReference?: string;
  [key: string]: any;
} | null;

export default function StallsPage() {
  const [user, setUser] = useState<any>(null);
  
  const [selectedFloor, setSelectedFloor] = useState('Permanent');
  const [selectedStall, setSelectedStall] = useState<string | null>(null);
  const [occupiedStalls, setOccupiedStalls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [applying, setApplying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [myApplication, setMyApplication] = useState<ApplicationData>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    contact: '',
    email: '',
    productType: 'food', 
    otherProduct: '',
  });

  const [paymentData, setPaymentData] = useState({
    referenceNo: '',
    amountPaid: ''
  });

  const [files, setFiles] = useState<FileState>({
    permit: null,
    validId: null,
    clearance: null, 
    receipt: null
  });

  const currentBilling = useMemo(() => {
    
    const floorType = myApplication ? myApplication.floor : selectedFloor;
    
    if (floorType === 'Night Market') {
        return BILLING_CONFIG.NightMarket;
    }
    return BILLING_CONFIG.Permanent;
  }, [selectedFloor, myApplication]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currUser) => {
        setUser(currUser);
        if (currUser) {
            const appRef = doc(db, "waitlist", currUser.uid);
            const unsubApp = onSnapshot(appRef, (docSnap) => {
                if (docSnap.exists()) {
                    setMyApplication(docSnap.data() as ApplicationData);
                } else {
                    setMyApplication(null);
                }
            });
            return () => unsubApp();
        } else {
            signInAnonymously(auth).catch(e => console.error(e));
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "stalls"),
      where("floor", "==", selectedFloor),
      where("status", "==", "Paid")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveStalls: string[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const slot = data.slotNo || data.slotno || data.slotLabel;
        if (slot) liveStalls.push(slot);
      });
      setOccupiedStalls(liveStalls);
      setLoading(false);
      
      if (selectedStall && liveStalls.includes(selectedStall)) {
        setSelectedStall(null);
      }
    }, (error) => {
      console.error("Error fetching stalls:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedFloor, selectedStall]);

  const pickFile = async (fileType: keyof FileState) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'], 
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFiles(prev => ({ ...prev, [fileType]: result.assets[0] }));
      }
    } catch (err) {
      console.log("Error picking file: ", err);
    }
  };

  const convertImageToText = async (uri: string) => {
    try {
        const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 600 } }], 
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        return `data:image/jpeg;base64,${manipulated.base64}`;
    } catch (error) {
        console.error("Compression failed", error);
        throw new Error("Image processing failed");
    }
  };

  const submitApplication = async () => {
    if (!user) { Alert.alert("Wait", "Initializing connection..."); return; }

    if(!formData.fullName || !formData.contact || !selectedStall) {
      Alert.alert("Incomplete", "Please fill in all text fields.");
      return;
    }

   if (!files.permit || !files.validId || !files.clearance) {
      Alert.alert("Missing Photos", "Please upload Permit, Valid ID, and Barangay Clearance.");
      return;
    }

    setApplying(true);

    try {
      const permitBase64 = await convertImageToText(files.permit.uri);
      const idBase64 = await convertImageToText(files.validId.uri);
      const clearanceBase64 = await convertImageToText(files.clearance.uri);

      await setDoc(doc(db, "waitlist", user.uid), {
        uid: user.uid,
        name: formData.fullName,
        contact: formData.contact,
        email: formData.email,
        product: formData.productType === 'other' ? formData.otherProduct : formData.productType,
        targetSlot: selectedStall, 
        floor: selectedFloor, 
        
        status: "VERIFICATION_PENDING", 
        dateRequested: new Date().toISOString(),
        
        permitUrl: permitBase64, 
        validIdUrl: idBase64,
        clearanceUrl: clearanceBase64,
        
        devicePlatform: Platform.OS
      });

      setModalVisible(false);
      Alert.alert("Success", "Application Submitted!");
      setSelectedStall(null);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Submission failed. Try smaller photos.");
    } finally {
      setApplying(false);
    }
  };

  const submitPaymentReceipt = async () => {
    if (!user || !files.receipt) {
        Alert.alert("Missing Receipt", "Please upload the receipt.");
        return;
    }

    if (!paymentData.referenceNo || !paymentData.amountPaid) {
        Alert.alert("Missing Details", "Enter Reference No. and Amount.");
        return;
    }

    setApplying(true);

    try {
      const receiptBase64 = await convertImageToText(files.receipt.uri);
      
      await updateDoc(doc(db, "waitlist", user.uid), {
        receiptUrl: receiptBase64, 
        paymentReference: paymentData.referenceNo,
        paymentAmount: paymentData.amountPaid,
        status: "PAYMENT_REVIEW", 
        paymentSubmittedAt: new Date().toISOString()
      });
      
      Alert.alert("Sent", "Payment submitted for review.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not process receipt.");
    } finally {
      setApplying(false);
    }
  };

  const getSlotLabel = (index: number) => {
    return selectedFloor === 'Permanent' 
      ? `A-${101 + index}` 
      : `NM-${(index + 1).toString().padStart(2, '0')}`;
  };

  const isStallOccupied = (slotLabel: string) => occupiedStalls.includes(slotLabel);

  const handleStallPress = (slotLabel: string) => {
    if (isStallOccupied(slotLabel)) {
      Alert.alert('Occupied', `Slot ${slotLabel} is taken.`);
      return;
    }
    setSelectedStall(prev => prev === slotLabel ? null : slotLabel);
  };

  const availableCount = 30 - occupiedStalls.length;

  if (myApplication?.status === "VERIFICATION_PENDING") {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Icon name="timer-sand" size={64} color="#FFA000" />
        <Text variant="headlineSmall" style={styles.statusTitle}>Application Under Review</Text>
        <Card style={styles.statusCard}>
            <Card.Content>
                <Text style={styles.statusText}>Applying for: <Text style={{fontWeight:'bold', color: "#378842ff"}}>{myApplication.targetSlot}</Text></Text>
                <Text style={styles.statusText}>Section: <Text style={{fontWeight:'bold', color: "#378842ff"}}>{myApplication.floor}</Text></Text>
                <Text style={[styles.statusText, {marginTop:10, fontSize: 12}]}>
                    Our Admin is checking your Permit, ID, and Clearance.
                </Text>
            </Card.Content>
        </Card>
      </SafeAreaView>
    );
  }

  if (myApplication?.status === "PAYMENT_UNLOCKED" || myApplication?.status === "PAYMENT_REVIEW") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{padding: 20}}>
            <View style={{alignItems:'center', marginBottom: 20}}>
                <Icon name="file-document-outline" size={50} color="#1B5E20" />
                <Text variant="headlineSmall" style={{color: '#1B5E20', fontWeight: 'bold', marginTop: 10, textAlign: 'center'}}>
                    STALL ORDER OF PAYMENT
                </Text>
            </View>

            <Card style={styles.paymentCard} mode="elevated">
              <View style={styles.paymentHeaderBg}>
                  <Text style={styles.paymentHeaderTitle}>{PAYMENT_INFO.billerName}</Text>
                  <Text style={styles.paymentHeaderSub}>{PAYMENT_INFO.project}</Text>
              </View>
              
              <Card.Content style={{paddingTop: 15}}>
                <View style={styles.paymentRow}><Text style={styles.paymentLabel}>STALL NUMBER</Text><Text style={styles.paymentValue}>{myApplication.targetSlot}</Text></View>
                <View style={styles.paymentRow}><Text style={styles.paymentLabel}>REGISTERED OWNER</Text><Text style={[styles.paymentValue, {textTransform: 'uppercase'}]}>{myApplication.name}</Text></View>
                
                <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>RENTAL PERIOD</Text>
                    <Text style={[styles.paymentValue, {color: '#1B5E20'}]}>{currentBilling.periodLabel}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={{alignItems: 'center', marginVertical: 10}}>
                    <Text style={{fontSize: 12, fontWeight: 'bold', color: '#444'}}>TOTAL AMOUNT TO BE PAID IN FULL</Text>
                    <Text style={{fontSize: 32, fontWeight: '900', color: '#C62828', marginVertical: 5}}>
                        {currentBilling.amountLabel}
                    </Text>
                    <Text style={{fontSize: 10, color: '#C62828', fontWeight: 'bold', textAlign: 'center'}}>(NO PARTIAL PAYMENT)</Text>
                </View>
                
                <View style={{backgroundColor: '#ffebee', padding: 10, borderRadius: 8, marginTop: 10}}>
                    <Text style={{color: '#b71c1c', textAlign: 'center', fontWeight: 'bold', fontSize: 12}}>{PAYMENT_INFO.note}</Text>
                </View>
              </Card.Content>
            </Card>

            <Text variant="titleMedium" style={{marginBottom: 10, fontWeight: 'bold', marginTop: 20, color: "#1f1d1dff"}}>Verification Details</Text>
            
            <TextInput label="OR / Reference No." value={paymentData.referenceNo} onChangeText={t => setPaymentData({...paymentData, referenceNo: t})} mode="outlined" style={{marginBottom: 10, backgroundColor: 'white'}} activeOutlineColor="#1B5E20" textColor="black" />
            <TextInput label="Amount Paid" value={paymentData.amountPaid} onChangeText={t => setPaymentData({...paymentData, amountPaid: t})} mode="outlined" keyboardType="numeric" style={{marginBottom: 15, backgroundColor: 'white'}} activeOutlineColor="#1B5E20"  textColor="black"/>

            <Button mode="outlined" onPress={() => pickFile('receipt')} icon="camera" textColor="green" style={{marginBottom: 20, borderColor: 'green'}}>
              {files.receipt ? "Receipt Attached" : "Upload Receipt Photo"}
            </Button>

            <Button mode="contained" onPress={submitPaymentReceipt} loading={applying} disabled={myApplication.status === "PAYMENT_REVIEW"} style={{backgroundColor: '#1B5E20'}} textColor="white">
              {myApplication.status === "PAYMENT_REVIEW" ? "Verifying..." : "Submit Payment"}
            </Button>

            {myApplication.status === "PAYMENT_REVIEW" && (
                <Text style={{textAlign:'center', marginTop:15, color:'#F57C00'}}>Waiting for Admin Confirmation...</Text>
            )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text  variant="headlineMedium" style={styles.headerTitle}>Stall Availability</Text>
        <Icon name="storefront-outline" size={28} color="#1B5E20" />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.floorCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Select Location</Text>
            <SegmentedButtons
              value={selectedFloor}
              onValueChange={(val) => { setSelectedFloor(val); setSelectedStall(null); }}
              theme={{colors: {secondaryContainer: 'black', onSecondaryContainer: 'white', }}}
              buttons={[{ value: 'Permanent', label: 'Permanent', uncheckedColor: 'black'}, { value: 'Night Market', label: 'Night Market', uncheckedColor: 'black' }]}
            />
          </Card.Content>
        </Card>

        {loading ? <ActivityIndicator animating={true} color="#1B5E20" style={{marginTop: 20}} /> : (
          <>
            <View style={styles.summaryContainer}>
               <View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#fff', borderWidth:1, borderStyle:'dashed'}]}/><Text style= {{color: "#504e4eff"}}> Available ({availableCount})</Text></View>
               <View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#F44336'}]}/><Text style= {{color: "#504e4eff"}}>Occupied</Text></View>
               <View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#4CAF50'}]}/><Text style= {{color: "#504e4eff"}}>Selected</Text></View>
            </View>

            <Card style={styles.layoutCard}>
              <Card.Content>
                <View style={styles.gridContainer}>
                  {Array.from({ length: 30 }).map((_, i) => {
                    const slotLabel = getSlotLabel(i);
                    const occupied = isStallOccupied(slotLabel);
                    const selected = selectedStall === slotLabel;
                    return (
                      <TouchableOpacity
                        key={slotLabel}
                        style={[styles.stallBase, occupied ? styles.stallOccupied : selected ? styles.stallSelected : styles.stallAvailable]}
                        onPress={() => handleStallPress(slotLabel)}
                        disabled={occupied}
                      >
                        <Text style={[styles.slotLabelMain, occupied || selected ? styles.stallTextWhite : styles.stallTextAvailable]}>{slotLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>

            {selectedStall && (
              <Card style={styles.infoCard}>
                <Card.Content>
                  <Text style={{color: "#0a0a0aff"}} variant="titleMedium">Slot Selected: {selectedStall}</Text>
                  <Button mode="contained" onPress={() => setModalVisible(true)} style={{ marginTop: 15, backgroundColor: '#1B5E20'}}>
                   <Text> Apply for {selectedStall}</Text>
                  </Button>
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <ScrollView>
            <Text variant="headlineSmall" style={{marginBottom: 15, fontWeight:'bold', color: '#1B5E20'}}>New Application</Text>
            
            <View style={{marginBottom: 15, padding: 10, backgroundColor: '#E8F5E9', borderRadius: 8}}>
                <Text style={{fontSize: 12, color: '#444'}}>Selected Section:</Text>
                <Text style={{fontWeight: 'bold', color: '#1B5E20'}}>{selectedFloor}</Text>
                <Text style={{fontSize: 12, color: '#444', marginTop: 5}}>Applicable Rent:</Text>
                <Text style={{fontWeight: 'bold', color: '#1B5E20'}}>
                    {currentBilling.amountLabel} / {currentBilling.periodLabel}
                </Text>
            </View>

            <TextInput label="Full Name" value={formData.fullName} onChangeText={t => setFormData({...formData, fullName: t})} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" 
            activeOutlineColor="black" />
            <TextInput label="Contact" value={formData.contact} onChangeText={t => setFormData({...formData, contact: t})} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" 
            activeOutlineColor="black" keyboardType="phone-pad" />
            <TextInput label="Email" value={formData.email} onChangeText={t => setFormData({...formData, email: t})} style={styles.input} textColor='black'mode="outlined" outlineColor="grey" 
            activeOutlineColor="black" keyboardType="email-address" />
            
            <Text variant="titleMedium" style={{marginTop:10, color: "#000" }}>Product Type</Text>
            <RadioButton.Group onValueChange={val => setFormData({...formData, productType: val})} value={formData.productType}>
              <View style={styles.row}><RadioButton color="black" uncheckedColor="grey" value="food"/><Text style={{color: "#292525ff"}} >Food</Text></View>
              <View style={styles.row}><RadioButton color="black" uncheckedColor="grey" value="clothing"/><Text style={{color: "#292525ff"}}>Clothing</Text></View>
            </RadioButton.Group>

            <Text variant="titleMedium" style={{marginTop:15, marginBottom: 5, color: "#000"}}>Required Documents</Text>
            
            <Button mode="outlined" onPress={() => pickFile('permit')} style={styles.fileButton} icon={files.permit ? "check" : "file-document-outline"}  textColor={files.permit ? "green" : "grey"}>
                {files.permit ? "Business Permit Attached" : "Upload Business Permit"}
            </Button>
            
            <Button mode="outlined" onPress={() => pickFile('validId')} style={styles.fileButton} icon={files.validId ? "check" : "card-account-details-outline"} textColor={files.validId ? "green" : "grey"}>
              {files.validId ? "Valid ID Attached" : "Upload Valid ID"}
            </Button>
            
            <Button mode="outlined" onPress={() => pickFile('clearance')} style={styles.fileButton} icon={files.clearance ? "check" : "file-certificate-outline"} textColor={files.clearance ? "green" : "grey"}>
              {files.clearance ? "Barangay Clearance Attached" : "Upload Brgy. Clearance"}
            </Button>
            
            <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20}}>
              <Button onPress={() => setModalVisible(false)} textColor='grey'>Cancel</Button>
              <Button mode="contained" onPress={submitApplication} loading={applying} buttonColor="#1B5E20"><Text style= {{fontWeight: 'bold'}} >Submit</Text></Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { backgroundColor: '#FFFFFF', padding: 20, flexDirection: 'row', justifyContent: 'space-between' },
  headerTitle: { fontWeight: '700', color: "#0a0a0aff"},
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  floorCard: { marginBottom: 16, backgroundColor: '#FFFFFF' },
  layoutCard: {  marginBottom: 10, backgroundColor: '#FFFFFF' },
  infoCard: { marginTop: 8, backgroundColor: '#E8F5E9', borderColor: '#4CAF50', borderWidth: 1 },
  statusCard: { marginTop: 20, width: '100%', backgroundColor: 'white' },
  statusTitle: { marginTop: 20, fontWeight: 'bold',color: "#4c4b4bff"},
  statusText: { fontSize: 16, textAlign: 'center', color: "#6e6c6cff" },
  paymentCard: { backgroundColor: 'white', marginBottom: 20, overflow: 'hidden' },
  paymentHeaderBg: { backgroundColor: '#1B5E20', padding: 10 },
  paymentHeaderTitle: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  paymentHeaderSub: { color: 'white', textAlign: 'center', fontSize: 12 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentLabel: { color: '#444', fontWeight: '600', fontSize: 12 },
  paymentValue: { fontWeight: 'bold', fontSize: 14, color: "#3f3f3fff" },
  sectionTitle: { fontWeight: '600', marginBottom: 12, color: "#0a0a0aff"},
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  stallBase: { width: '23%', aspectRatio: 1, marginBottom: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stallAvailable: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  stallOccupied: { backgroundColor: '#F44336' },
  stallSelected: { backgroundColor: '#4CAF50' },
  slotLabelMain: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  stallTextAvailable: { color: '#999', fontSize: 12 },
  stallTextWhite: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, maxHeight: '90%' },
  input: { marginBottom: 10, backgroundColor: 'white'},
  fileButton: { marginTop: 10, borderColor: '#ccc' },
  summaryContainer: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center'}
});