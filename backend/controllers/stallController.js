import Stall from '../models/Stall.js';
import TenantApplication from '../models/TenantApplication.js';

// 1. Get Occupied Stalls (Public)
export const getOccupiedStalls = async (req, res) => {
  try {
    const { floor } = req.query;
    // Find all stalls that are PAID (Occupied)
    const stalls = await Stall.find({ floor, status: 'Paid' });
    // Return just the labels (e.g. ["A-101", "A-102"])
    const occupiedLabels = stalls.map(s => s.slotLabel);
    res.json(occupiedLabels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Get My Application Status
export const getMyApplication = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const application = await TenantApplication.findOne({ deviceId });
    res.json(application || null); // Return null if no app found
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Submit New Application
export const submitApplication = async (req, res) => {
  try {
    const data = req.body; // Contains deviceId, images, etc.
    
    // Upsert: Update if exists, Create if not
    const newApp = await TenantApplication.findOneAndUpdate(
      { deviceId: data.deviceId },
      { ...data, status: 'VERIFICATION_PENDING' },
      { new: true, upsert: true }
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

    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};