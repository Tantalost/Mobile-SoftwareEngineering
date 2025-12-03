import Tenant from '../models/Tenant.js'; 
import TenantApplication from '../models/TenantApplication.js';
import Notification from '../models/Notification.js'; 

// Helper to create notifications internally
const createAdminNotification = async (title, message) => {
  try {
    const newNote = new Notification({
      title,
      message,
      source: "System",
      targetRole: "superadmin", 
      date: new Date().toISOString().split('T')[0]
    });
    await newNote.save();
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

// 1. Get Occupied Stalls (No changes needed here, relies on Tenant model)
export const getOccupiedStalls = async (req, res) => {
  try {
    const { floor } = req.query; 

    const tenants = await Tenant.find({ tenantType: floor });

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

// 2. Get My Application Status (UPDATED: Uses userId)
export const getMyApplication = async (req, res) => {
  try {
    const { userId } = req.params; // Changed from deviceId
    
    // Find application linked to this User ID
    const application = await TenantApplication.findOne({ userId: userId });
    
    res.json(application || null); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Submit New Application (UPDATED: Uses userId)
export const submitApplication = async (req, res) => {
  try {
    const data = req.body; // data contains userId now
    
    // Upsert based on userId
    const newApp = await TenantApplication.findOneAndUpdate(
      { userId: data.userId },
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

// 4. Submit Payment Receipt (UPDATED: Uses userId)
export const submitPayment = async (req, res) => {
  try {
    const { userId, receiptUrl, paymentReference, paymentAmount } = req.body;
    
    const updatedApp = await TenantApplication.findOneAndUpdate(
      { userId: userId },
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
      `Ref: ${paymentReference}. Verify payment for Applicant ID: ${userId.slice(-6)}.`
    );

    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Submit Contract (UPDATED: Uses userId)
export const uploadContract = async (req, res) => {
  try {
    const { userId, contractUrl } = req.body;

    if (!userId || !contractUrl) {
      return res.status(400).json({ message: "Missing userId or contractUrl" });
    }

    const updatedApp = await TenantApplication.findOneAndUpdate(
      { userId: userId },
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