// 1. IMPORT THE TENANT MODEL
import Tenant from '../models/Tenant.js'; 
import TenantApplication from '../models/TenantApplication.js';

import Notification from '../models/Notification.js'; // Import the model

// Helper to create notifications internally
const createAdminNotification = async (title, message) => {
  try {
    const newNote = new Notification({
      title,
      message,
      source: "System",
      targetRole: "superadmin", // Explicitly target superadmin
      date: new Date().toISOString().split('T')[0]
    });
    await newNote.save();
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};
// (You can keep or remove 'import Stall' depending on if you still use it elsewhere)

// 1. Get Occupied Stalls (UPDATED)
export const getOccupiedStalls = async (req, res) => {
  try {
    const { floor } = req.query; // This will be "Permanent" or "Night Market"

    // CHANGE: Look inside the 'Tenant' collection instead of 'Stall'
    // We assume anyone in the Tenant list is "Occupied"
    const tenants = await Tenant.find({ 
      tenantType: floor 
    });

    // Extract slot numbers (handling potential comma-separated slots like "A-101, A-102")
    let occupiedLabels = [];
    tenants.forEach(t => {
      if (t.slotNo) {
        const slots = t.slotNo.split(',').map(s => s.trim());
        occupiedLabels.push(...slots);
      }
    });

    res.json(occupiedLabels);
  } catch (error) {
    console.error("Error fetching occupied stalls:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Get My Application Status
export const getMyApplication = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const application = await TenantApplication.findOne({ deviceId });
    res.json(application || null); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Submit New Application
export const submitApplication = async (req, res) => {
  try {
    const data = req.body; 
    const newApp = await TenantApplication.findOneAndUpdate(
      { deviceId: data.deviceId },
      { ...data, status: 'VERIFICATION_PENDING' },
      { new: true, upsert: true }
    );

    await createAdminNotification(
      "New Application Received",
      `Applicant ${data.name} has applied for slot ${data.targetSlot}.`
    );

    res.json(newApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Submit Payment Receipt
export const submitPayment = async (req, res) => {
  try {
    const { deviceId, receiptUrl, paymentReference, paymentAmount } = req.body;
    
    const updatedApp = await TenantApplication.findOneAndUpdate(
      { deviceId },
      { 
        receiptUrl, 
        paymentReference, 
        paymentAmount, 
        status: 'PAYMENT_REVIEW',
        paymentSubmittedAt: new Date()
      },
      { new: true }
    );

    await createAdminNotification(
      "Payment Receipt Uploaded",
      `Ref: ${paymentReference}. Verify payment for device/user ID: ${deviceId.slice(-6)}.`
    );

    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Submit Contract
export const uploadContract = async (req, res) => {
  try {
    const { deviceId, contractUrl } = req.body;

    if (!deviceId || !contractUrl) {
      return res.status(400).json({ message: "Missing deviceId or contractUrl" });
    }

    const updatedApp = await TenantApplication.findOneAndUpdate(
      { deviceId },
      { 
        contractUrl, 
        status: 'CONTRACT_REVIEW', 
        contractSubmittedAt: new Date()
      },
      { new: true }
    );
    
    await createAdminNotification(
      "Contract Signed",
      "A new signed contract has been uploaded. Please review for final approval."
    );

    if (!updatedApp) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(updatedApp);
  } catch (error) {
    console.error("Contract Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};