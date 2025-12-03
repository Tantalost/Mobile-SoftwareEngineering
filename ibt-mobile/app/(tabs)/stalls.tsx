import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, Platform, RefreshControl, KeyboardAvoidingView } from 'react-native';
import { Card, SegmentedButtons, Text, Button, ActivityIndicator, Modal, Portal, TextInput, RadioButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator'; 
// @ts-ignore 
import * as FileSystem from 'expo-file-system/legacy'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../../src/config';

// 1. IMPORT PRINT AND SHARING
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import AuthScreen from '../../src/components/AuthScreen';

// --- CONFIGURATION ---
const BILLING_CONFIG = {
  Permanent: { amountLabel: "₱ 6,000.00", periodLabel: "30 DAYS", rawAmount: 6000 },
  NightMarket: { amountLabel: "₱ 1,120.00", periodLabel: "7 DAYS", rawAmount: 1120 }
};

const PAYMENT_INFO = {
  billerName: "OFFICE OF THE CITY ADMINISTRATOR",
  project: "ZC-IBT PERMANENT / NIGHT MARKET STALLS",
  note: "NO PARTIAL PAYMENT! NO PAYMENT - NO ENTRY / NO OPERATION OF STALL.",
  contactInfo: "(062) 991-1630 / (062) 991-4985"
};

// ... (Keep your existing Types: UserData, FileState, ApplicationData) ...
type UserData = { id: string; name: string; email: string; contact: string; };
type FileState = { permit: any; validId: any; clearance: any; receipt: any; contract: any; };
type ApplicationData = { status: string; targetSlot: string; floor: string; contact: string; name: string; paymentReference?: string; [key: string]: any; } | null;

export default function StallsPage() {
  // ... (Keep existing state variables: user, selectedFloor, etc.) ...
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedFloor, setSelectedFloor] = useState('Permanent');
  const [selectedStall, setSelectedStall] = useState<string | null>(null);
  const [occupiedStalls, setOccupiedStalls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<'form' | 'review'>('form'); 
  const [myApplication, setMyApplication] = useState<ApplicationData>(null);
  const [formData, setFormData] = useState({ firstName: '', middleName: '', lastName: '', contact: '', email: '', productType: 'food', otherProduct: '' });
  const [paymentData, setPaymentData] = useState({ referenceNo: '' });
  const [files, setFiles] = useState<FileState>({ permit: null, validId: null, clearance: null, receipt: null, contract: null });

  // ... (Keep existing hooks: currentBilling, useEffects) ...
  const currentBilling = useMemo(() => {
    const floorType = myApplication ? myApplication.floor : selectedFloor;
    return floorType === 'Night Market' ? BILLING_CONFIG.NightMarket : BILLING_CONFIG.Permanent;
  }, [selectedFloor, myApplication]);

  useEffect(() => { checkLogin(); }, []);
  // ... (Keep checkLogin, handleLoginSuccess, handleLogout, fetchData) ...
  const checkLogin = async () => { try { const storedUser = await AsyncStorage.getItem('ibt_user'); if (storedUser) { handleLoginSuccess(JSON.parse(storedUser)); } } catch (e) { console.error("Auth Error", e); } };
  const handleLoginSuccess = (userData: UserData) => { setUser(userData); fetchData(userData.id); };
  const handleLogout = async () => { await AsyncStorage.removeItem('ibt_user'); setUser(null); setMyApplication(null); };
  const fetchData = async (userId: string) => { 
    if (!userId) return; setLoading(true); 
    try { 
      const stallsRes = await fetch(`${API_URL}/stalls/occupied?floor=${selectedFloor}`);
      const stallsData = await stallsRes.json(); setOccupiedStalls(stallsData);
      const myAppRes = await fetch(`${API_URL}/stalls/my-application/${userId}`);
      const myAppData = await myAppRes.json(); setMyApplication(myAppData);
    } catch (error) { console.error("Fetch error:", error); } finally { setLoading(false); }
  };
  useEffect(() => { if (!user) return; const interval = setInterval(() => fetchData(user.id), 10000); return () => clearInterval(interval); }, [user, selectedFloor]);

  // ... (Keep file handling: pickFile, convertPdfToText, convertImageToText) ...
  const pickFile = async (fileType: keyof FileState) => {
    try {
      const docType = fileType === 'contract' ? 'application/pdf' : ['image/*'];
      const result = await DocumentPicker.getDocumentAsync({ type: docType, copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) { setFiles(prev => ({ ...prev, [fileType]: result.assets[0] })); }
    } catch (err) { console.log("Error picking file: ", err); }
  };
  const convertPdfToText = async (uri: string) => { try { const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }); return `data:application/pdf;base64,${base64}`; } catch (error) { throw new Error("PDF processing failed"); } };
  const convertImageToText = async (uri: string) => { try { const manipulated = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }); return `data:image/jpeg;base64,${manipulated.base64}`; } catch (error) { throw new Error("Image processing failed"); } };

  // ... (Keep submission handlers: handleReview, submitApplication, submitPaymentReceipt, submitContract) ...
  const handleReview = () => { if (!formData.firstName || !formData.contact || !selectedStall) return Alert.alert("Incomplete", "Fill all fields."); if (!files.permit || !files.validId || !files.clearance) return Alert.alert("Missing Photos", "Upload required docs."); setModalStep('review'); };
  const submitApplication = async () => { if (!user) return; setApplying(true); try { const permitBase64 = await convertImageToText(files.permit!.uri); const idBase64 = await convertImageToText(files.validId!.uri); const clearanceBase64 = await convertImageToText(files.clearance!.uri); const payload = { userId: user.id, name: `${formData.firstName} ${formData.middleName} ${formData.lastName}`, contact: formData.contact, email: formData.email, product: formData.productType, targetSlot: selectedStall, floor: selectedFloor, permitUrl: permitBase64, validIdUrl: idBase64, clearanceUrl: clearanceBase64, devicePlatform: Platform.OS }; const res = await fetch(`${API_URL}/stalls/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) throw new Error(await res.text()); setModalVisible(false); setModalStep('form'); Alert.alert("Success", "Application Submitted!"); fetchData(user.id); setSelectedStall(null); } catch (error: any) { Alert.alert("Failed", error.message); } finally { setApplying(false); } };
  const submitPaymentReceipt = async () => { if (!user || !files.receipt) return Alert.alert("Missing Receipt", "Upload receipt."); if (!paymentData.referenceNo) return Alert.alert("Missing Details", "Enter Reference No."); setApplying(true); try { const receiptBase64 = await convertImageToText(files.receipt.uri); const payload = { userId: user.id, receiptUrl: receiptBase64, paymentReference: paymentData.referenceNo, paymentAmount: currentBilling.rawAmount }; const res = await fetch(`${API_URL}/stalls/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) throw new Error("Server error"); Alert.alert("Sent", "Payment submitted."); fetchData(user.id); } catch (error) { Alert.alert("Error", "Processing failed."); } finally { setApplying(false); } };
  const submitContract = async () => { if (!user || !files.contract) return Alert.alert("Missing Contract", "Upload PDF."); setApplying(true); try { const contractBase64 = await convertPdfToText(files.contract.uri); const res = await fetch(`${API_URL}/stalls/upload-contract`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, contractUrl: contractBase64 }) }); if (!res.ok) throw new Error(await res.text()); Alert.alert("Success", "Contract submitted."); fetchData(user.id); } catch (error: any) { Alert.alert("Failed", error.message); } finally { setApplying(false); } };

  const isStallOccupied = (slotLabel: string) => occupiedStalls.includes(slotLabel);
  const handleStallPress = (slotLabel: string) => { if (isStallOccupied(slotLabel)) return Alert.alert('Occupied', `Slot ${slotLabel} is taken.`); setSelectedStall(prev => prev === slotLabel ? null : slotLabel); };
  const availableCount = 30 - occupiedStalls.length;

  const handleContactChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    setFormData({ ...formData, contact: numericOnly });
  };

  // --- 2. NEW FUNCTION: GENERATE PDF ---
  const generateContractPDF = async () => {
    try {
      setApplying(true);
      
      // Auto-fill data from the application
      const currentName = myApplication?.name || user?.name || "________";
      const currentAddress = "Zamboanga City"; // You can make this dynamic if address is stored
      const currentSlot = myApplication?.targetSlot || "________";
      const currentRent = currentBilling.amountLabel;
      const currentDate = new Date().toLocaleDateString();

      // HTML Template that mimics the LaTeX look
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
              h1 { text-align: center; font-size: 18px; text-transform: uppercase; margin-bottom: 20px; }
              .section { margin-top: 15px; font-weight: bold; text-transform: uppercase; }
              .content { margin-left: 20px; }
              .center { text-align: center; }
              .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
              .sig-line { border-top: 1px solid black; width: 45%; text-align: center; padding-top: 5px; }
            </style>
          </head>
          <body>
            <h1>COMMERCIAL LEASE AND STALL MANAGEMENT AGREEMENT</h1>
            
            <p><strong>THIS LEASE AGREEMENT</strong> is made and entered into this <u>${currentDate}</u>, by and between:</p>

            <p><strong>LESSOR:</strong><br/>
            <strong>IBT COMPANY</strong>, with principal office at Zamboanga City, represented by the City Administrator.</p>

            <p class="center"><strong>- AND -</strong></p>

            <p><strong>LESSEE:</strong><br/>
            <strong>${currentName}</strong>, of legal age, with address at <u>${currentAddress}</u>.</p>

            <hr/>

            <div class="section">1. PREMISES</div>
            <div class="content">
              The LESSOR hereby leases to the LESSEE the commercial stall described as:<br/>
              <strong>Stall Number:</strong> ${currentSlot}<br/>
              <strong>Location:</strong> ZC-IBT Terminal
            </div>

            <div class="section">2. RENT</div>
            <div class="content">
              The LESSEE agrees to pay a monthly rent of <strong>${currentRent}</strong>.
            </div>

            <div class="section">3. RULES AND REGULATIONS</div>
            <div class="content">
              The LESSEE agrees to abide by all rules set forth by IBT Company regarding fire safety, waste disposal, and noise control.
            </div>

            <div class="signature-block">
              <div class="sig-line">
                <strong>IBT Representative</strong><br/>LESSOR
              </div>
              <div class="sig-line">
                <strong>${currentName}</strong><br/>LESSEE
              </div>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Share/Save PDF
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error) {
      Alert.alert("Error", "Could not generate PDF");
      console.error(error);
    } finally {
      setApplying(false);
    }
  };

  if (!user) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;

  // ... (Keep existing VERIFICATION_PENDING view) ...
  if (myApplication?.status === "VERIFICATION_PENDING") {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <View style={styles.header}><Text variant="headlineSmall" style={{fontWeight:'bold', color: '#1B5E20'}}>Status</Text><TouchableOpacity onPress={handleLogout}><Icon name="logout" size={24} color="#D32F2F" /></TouchableOpacity></View>
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Icon name="timer-sand" size={64} color="#FFA000" /><Text variant="headlineSmall" style={styles.statusTitle}>Under Review</Text><Card style={styles.statusCard}><Card.Content><Text style={styles.statusText}>Applying for: {myApplication.targetSlot}</Text><Text style={[styles.statusText, {marginTop:10}]}>Pending Admin Approval.</Text></Card.Content></Card><Button mode="text" onPress={() => fetchData(user.id)} style={{marginTop: 20}}>Check Updates</Button></View>
      </SafeAreaView>
    );
  }

  // --- 3. MODIFIED: CONTRACT VIEW WITH DOWNLOAD BUTTON ---
  if (myApplication?.status === "CONTRACT_PENDING" || myApplication?.status === "CONTRACT_REVIEW") {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={{fontWeight:'bold', color: '#1B5E20'}}>Contract</Text>
                <TouchableOpacity onPress={handleLogout}><Icon name="logout" size={24} color="#D32F2F" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding: 20, alignItems:'center'}}>
                <Icon name="pen" size={64} color="#1B5E20" />
                <Text variant="headlineSmall" style={{color: '#1B5E20', fontWeight: 'bold', marginTop: 10, textAlign: 'center'}}>Contract Signing</Text>
                
                <Card style={[styles.statusCard, {marginTop: 20}]}>
                    <Card.Content>
                        <Text style={{textAlign:'center', marginBottom: 15, color: '#444', fontWeight: 'bold', fontSize: 16}}>
                            Step 1: Download & Sign Contract
                        </Text>
                        <Text style={{textAlign:'center', marginBottom: 20, color: '#666', fontSize: 12}}>
                             Click the button below to generate your lease agreement. Sign it, scan it (or take a photo), and upload it back here.
                        </Text>

                        {/* NEW DOWNLOAD BUTTON */}
                        <Button 
                            mode="contained" 
                            icon="download" 
                            onPress={generateContractPDF} 
                            style={{marginBottom: 25, backgroundColor: '#0288D1'}}
                        >
                            Download Contract PDF
                        </Button>

                        <Divider style={{marginBottom: 20}} />

                        <Text style={{textAlign:'center', marginBottom: 15, color: '#444', fontWeight: 'bold', fontSize: 16}}>
                            Step 2: Upload Signed Document
                        </Text>
                        
                        <Button mode="outlined" onPress={() => pickFile('contract')} icon="file-pdf-box" textColor="green" style={{marginBottom: 20, borderColor: 'green'}}>
                            {files.contract ? "File Attached" : "Upload Signed PDF"}
                        </Button>

                        <Button mode="contained" onPress={submitContract} loading={applying} disabled={myApplication.status === "CONTRACT_REVIEW"} style={{backgroundColor: '#1B5E20'}}>
                            {myApplication.status === "CONTRACT_REVIEW" ? "Under Review..." : "Submit Contract"}
                        </Button>
                    </Card.Content>
                </Card>
                <Button mode="text" onPress={() => fetchData(user.id)} style={{marginTop: 20}}>Refresh Status</Button>
            </ScrollView>
        </SafeAreaView>
    );
  }


  if (myApplication?.status === "PAYMENT_UNLOCKED" || myApplication?.status === "PAYMENT_REVIEW") {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}><Text variant="headlineSmall" style={{fontWeight:'bold', color: '#1B5E20'}}>Payment</Text><TouchableOpacity onPress={handleLogout}><Icon name="logout" size={24} color="#D32F2F" /></TouchableOpacity></View>
          <ScrollView contentContainerStyle={{padding: 20}}>
              <View style={{alignItems:'center', marginBottom: 20}}><Icon name="file-document-outline" size={50} color="#1B5E20" /><Text variant="headlineSmall" style={{color: '#1B5E20', fontWeight: 'bold', marginTop: 10, textAlign: 'center'}}>STALL ORDER OF PAYMENT</Text></View>
              <Card style={styles.paymentCard} mode="elevated">
                <View style={styles.paymentHeaderBg}><Text style={styles.paymentHeaderTitle}>{PAYMENT_INFO.billerName}</Text><Text style={styles.paymentHeaderSub}>{PAYMENT_INFO.project}</Text></View>
                <Card.Content style={{paddingTop: 15}}>
                  <View style={styles.paymentRow}><Text style={styles.paymentLabel}>STALL NUMBER</Text><Text style={styles.paymentValue}>{myApplication.targetSlot}</Text></View>
                  <View style={styles.paymentRow}><Text style={styles.paymentLabel}>REGISTERED OWNER</Text><Text style={[styles.paymentValue, {textTransform: 'uppercase'}]}>{myApplication.name}</Text></View>
                  <View style={styles.paymentRow}><Text style={styles.paymentLabel}>RENTAL PERIOD</Text><Text style={[styles.paymentValue, {color: '#1B5E20'}]}>{currentBilling.periodLabel}</Text></View>
                  <View style={styles.divider} />
                  <View style={{alignItems: 'center', marginVertical: 10}}><Text style={{fontSize: 12, fontWeight: 'bold', color: '#444'}}>TOTAL AMOUNT TO BE PAID IN FULL</Text><Text style={{fontSize: 32, fontWeight: '900', color: '#C62828', marginVertical: 5}}>{currentBilling.amountLabel}</Text><Text style={{fontSize: 10, color: '#C62828', fontWeight: 'bold', textAlign: 'center'}}>(NO PARTIAL PAYMENT)</Text></View>
                </Card.Content>
              </Card>
              <Text variant="titleMedium" style={{marginBottom: 10, fontWeight: 'bold', marginTop: 20, color: "#1f1d1dff"}}>Verification Details</Text>
              <TextInput label="OR / Reference No." value={paymentData.referenceNo} onChangeText={t => setPaymentData({...paymentData, referenceNo: t})} mode="outlined" style={{marginBottom: 10, backgroundColor: 'white'}} activeOutlineColor="#1B5E20" textColor="black" />
              <Button mode="outlined" onPress={() => pickFile('receipt')} icon="camera" textColor="green" style={{marginBottom: 20, borderColor: 'green'}}> {files.receipt ? "Receipt Attached" : "Upload Receipt Photo"} </Button>
              <Button mode="contained" onPress={submitPaymentReceipt} loading={applying} disabled={myApplication.status === "PAYMENT_REVIEW"} style={{backgroundColor: '#1B5E20'}} textColor="white"> {myApplication.status === "PAYMENT_REVIEW" ? "Verifying..." : "Submit Payment"} </Button>
              <Button mode="text" onPress={() => fetchData(user.id)} style={{marginTop: 20}}>Refresh Status</Button>
          </ScrollView>
        </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text variant="headlineMedium" style={styles.headerTitle}>Stall Availability</Text><TouchableOpacity onPress={handleLogout} style={{flexDirection:'row', alignItems:'center', gap:5}}><Text style={{color:'#666', fontSize:12}}>{user.name}</Text><Icon name="logout" size={24} color="#D32F2F" /></TouchableOpacity></View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchData(user.id)} colors={['#1B5E20']} />}>
        <Card style={styles.floorCard} mode="elevated"><Card.Content><Text variant="titleMedium" style={styles.sectionTitle}>Select Location</Text><SegmentedButtons value={selectedFloor} onValueChange={(val) => { setSelectedFloor(val); setSelectedStall(null); }} theme={{colors: {secondaryContainer: 'black', onSecondaryContainer: 'white', }}} buttons={[{ value: 'Permanent', label: 'Permanent', uncheckedColor: 'black'}, { value: 'Night Market', label: 'Night Market', uncheckedColor: 'black' }]} /></Card.Content></Card>
        {loading ? <ActivityIndicator animating={true} color="#1B5E20" style={{marginTop: 20}} /> : (
          <View> 
            <View style={styles.summaryContainer}><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#fff', borderWidth:1, borderStyle:'dashed'}]}/><Text style= {{color: "#504e4eff"}}> Available ({availableCount})</Text></View><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#F44336'}]}/><Text style= {{color: "#504e4eff"}}>Occupied</Text></View><View style={styles.summaryItem}><View style={[styles.legendDot, {backgroundColor: '#4CAF50'}]}/><Text style= {{color: "#504e4eff"}}>Selected</Text></View></View>
            <Card style={styles.layoutCard}><Card.Content><View style={styles.gridContainer}>{Array.from({ length: 30 }).map((_, i) => { const slotLabel = selectedFloor === 'Permanent' ? `A-${101 + i}` : `NM-${(i + 1).toString().padStart(2, '0')}`; const occupied = isStallOccupied(slotLabel); const selected = selectedStall === slotLabel; return (<TouchableOpacity key={slotLabel} style={[styles.stallBase, occupied ? styles.stallOccupied : selected ? styles.stallSelected : styles.stallAvailable]} onPress={() => handleStallPress(slotLabel)} disabled={occupied}><Text style={[styles.slotLabelMain, occupied || selected ? styles.stallTextWhite : styles.stallTextAvailable]}>{slotLabel}</Text></TouchableOpacity>); })}</View></Card.Content></Card>
            {selectedStall && (<Card style={styles.infoCard}><Card.Content><Text style={{color: "#0a0a0aff"}} variant="titleMedium">Slot Selected: {selectedStall}</Text><Button mode="contained" onPress={() => { setModalStep('form'); setModalVisible(true); }} style={{ marginTop: 15, backgroundColor: '#1B5E20'}}> <Text> Apply for {selectedStall}</Text> </Button></Card.Content></Card>)}
          </View> 
        )}
      </ScrollView>
      <Portal><Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}><ScrollView>{modalStep === 'form' ? (<View><Text variant="headlineSmall" style={{marginBottom: 15, fontWeight:'bold', color: '#1B5E20'}}>New Application</Text><View style={{marginBottom: 15, padding: 10, backgroundColor: '#E8F5E9', borderRadius: 8}}><Text style={{fontSize: 12, color: '#444'}}>Selected Section:</Text><Text style={{fontWeight: 'bold', color: '#1B5E20'}}>{selectedFloor}</Text><Text style={{fontSize: 12, color: '#444', marginTop: 5}}>Applicable Rent:</Text><Text style={{fontWeight: 'bold', color: '#1B5E20'}}>{currentBilling.amountLabel} / {currentBilling.periodLabel}</Text></View><TextInput label="First Name" value={formData.firstName} onChangeText={t => setFormData({...formData, firstName: t})} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" activeOutlineColor="black" /><TextInput label="Middle Name" value={formData.middleName} onChangeText={t => setFormData({...formData, middleName: t})} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" activeOutlineColor="black" /><TextInput label="Last Name" value={formData.lastName} onChangeText={t => setFormData({...formData, lastName: t})} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" activeOutlineColor="black" /><TextInput label="Contact (09XXXXXXXXX)" value={formData.contact} onChangeText={handleContactChange} style={styles.input} textColor='black' mode="outlined" outlineColor="grey" activeOutlineColor="black" keyboardType="number-pad" maxLength={11} right={<TextInput.Affix text="/11" />} /><TextInput label="Email" value={formData.email} onChangeText={t => setFormData({...formData, email: t})} style={styles.input} textColor='black'mode="outlined" outlineColor="grey" activeOutlineColor="black" keyboardType="email-address" /><Text variant="titleMedium" style={{marginTop:10, color: "#000" }}>Product Type</Text><RadioButton.Group onValueChange={val => setFormData({...formData, productType: val})} value={formData.productType}><View style={styles.row}><RadioButton color="black" uncheckedColor="grey" value="food"/><Text style={{color: "#292525ff"}} >Food</Text></View><View style={styles.row}><RadioButton color="black" uncheckedColor="grey" value="clothing"/><Text style={{color: "#292525ff"}}>Clothing</Text></View><View style={styles.row}><RadioButton color="black" uncheckedColor="grey" value="other"/><Text style={{color: "#292525ff"}}>Others, please specify</Text></View></RadioButton.Group>{formData.productType === 'other' && (<TextInput label="Specify Product" value={formData.otherProduct} onChangeText={t => setFormData({...formData, otherProduct: t})} style={[styles.input, {marginTop: 5}]} textColor='black' mode="outlined" activeOutlineColor="black" />)}<Text variant="titleMedium" style={{marginTop:15, marginBottom: 5, color: "#000"}}>Required Documents</Text><Button mode="outlined" onPress={() => pickFile('permit')} style={styles.fileButton} icon={files.permit ? "check" : "file-document-outline"} textColor={files.permit ? "green" : "grey"}>{files.permit ? "Business Permit Attached" : "Upload Business Permit"}</Button><Button mode="outlined" onPress={() => pickFile('validId')} style={styles.fileButton} icon={files.validId ? "check" : "card-account-details-outline"} textColor={files.validId ? "green" : "grey"}>{files.validId ? "Valid ID Attached" : "Upload Valid ID"}</Button><Button mode="outlined" onPress={() => pickFile('clearance')} style={styles.fileButton} icon={files.clearance ? "check" : "file-certificate-outline"} textColor={files.clearance ? "green" : "grey"}>{files.clearance ? "Barangay Clearance Attached" : "Upload Brgy. Clearance"}</Button><View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20}}><Button onPress={() => setModalVisible(false)} textColor='grey'>Cancel</Button><Button mode="contained" onPress={handleReview} buttonColor="#1B5E20"><Text style= {{fontWeight: 'bold'}}>Review Application</Text></Button></View></View>) : (<View><Text variant="headlineSmall" style={{marginBottom: 15, fontWeight:'bold', color: '#1B5E20', textAlign:'center'}}>Confirm Application</Text><Text style={{textAlign:'center', color:'grey', marginBottom: 20}}>Please review your details before submitting.</Text><View style={styles.reviewSection}><Text style={styles.reviewLabel}>APPLICANT NAME:</Text><Text style={styles.reviewValue}>{formData.firstName} {formData.middleName} {formData.lastName}</Text><Divider style={{marginVertical:5}}/><Text style={styles.reviewLabel}>CONTACT NUMBER:</Text><Text style={styles.reviewValue}>{formData.contact}</Text><Divider style={{marginVertical:5}}/><Text style={styles.reviewLabel}>EMAIL:</Text><Text style={styles.reviewValue}>{formData.email || "N/A"}</Text><Divider style={{marginVertical:5}}/><Text style={styles.reviewLabel}>PRODUCT TYPE:</Text><Text style={styles.reviewValue}>{formData.productType === 'other' ? formData.otherProduct : formData.productType.toUpperCase()}</Text><Divider style={{marginVertical:5}}/><Text style={styles.reviewLabel}>TARGET SLOT:</Text><Text style={[styles.reviewValue, {color: '#1B5E20'}]}>{selectedStall} ({selectedFloor})</Text></View><View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}><Button mode="outlined" onPress={() => setModalStep('form')} textColor='grey' style={{borderColor:'grey'}}>Edit Details</Button><Button mode="contained" onPress={submitApplication} loading={applying} buttonColor="#1B5E20">Confirm & Submit</Button></View></View>)}</ScrollView></Modal></Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5',},
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { backgroundColor: '#FFFFFF', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems:'center' },
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
  row: { flexDirection: 'row', alignItems: 'center'},
  reviewSection: { padding: 15, backgroundColor: '#FAFAFA', borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  reviewLabel: { fontSize: 11, color: '#777', fontWeight: '600', marginBottom: 2 },
  reviewValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 }
});