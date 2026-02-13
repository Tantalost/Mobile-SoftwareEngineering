import Tenant from '../models/Tenant.js'; 
import TenantApplication from '../models/TenantApplication.js';
import Notification from '../models/Notification.js'; 
import fs from 'fs';
import path from 'path';
import CryptoJS from 'crypto-js';
import os from 'os';

const SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || " "; 

export const getSecureDocument = async (req, res) => {
    try {
        const { filename } = req.params;
        const safeFilename = path.basename(filename);
        const uploadDir = path.join(os.homedir(), 'stalls_app_uploads');
        let filePath = path.join(uploadDir, safeFilename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).send("Document not found.");
        }

        const encryptedFileContent = fs.readFileSync(filePath, 'utf8');

        const bytes = CryptoJS.AES.decrypt(encryptedFileContent, SECRET_KEY);
        const originalBase64 = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalBase64) {
             throw new Error("Decryption result empty. Key mismatch?");
        }

        const fileBuffer = Buffer.from(originalBase64, 'base64');

        const ext = path.extname(safeFilename).toLowerCase();
        let contentType = 'application/octet-stream';
       
        if (filename.includes('.jpg') || filename.includes('.jpeg')) contentType = 'image/jpeg';
        if (filename.includes('.png')) contentType = 'image/png';
        if (filename.includes('.pdf')) contentType = 'application/pdf';

        res.setHeader('Content-Type', contentType);
        res.send(fileBuffer);
    } catch (error) {
        console.error("Decryption Error:", error);
        res.status(500).send("Could not display document.");
    }
};

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
    res.status(500).json({ message: error.message });
  }
};

export const getMyApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    const applications = await TenantApplication.find({ userId })
        .select('-permitUrl -validIdUrl -clearanceUrl -receiptUrl -contractUrl')
        .lean();
    const userEmails = applications.map(app => app.email).filter(e => e);
    const tenants = await Tenant.find({ $or: [{ uid: userId }, { email: { $in: userEmails } }] }).lean();

    const results = applications.map(app => {
        const matchingTenant = tenants.find(t => t.slotNo === app.targetSlot);
        if (matchingTenant) {
            return {
                ...app, status: 'TENANT', start: matchingTenant.StartDateTime,
                due: matchingTenant.DueDateTime, paymentHistory: matchingTenant.paymentHistory || []
            };
        }
        return app;
    });
    tenants.forEach(t => {
        const alreadyInList = results.find(r => r.targetSlot === t.slotNo);
        if (!alreadyInList) {
            results.push({
                userId: userId, status: 'TENANT', targetSlot: t.slotNo,
                floor: t.tenantType, name: t.tenantName, start: t.StartDateTime,
                due: t.DueDateTime, paymentHistory: t.paymentHistory || []
            });
        }
    });
    res.json(results); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitApplication = async (req, res) => {
  try {
    const data = req.body; 
    const existingTenant = await Tenant.findOne({ slotNo: data.targetSlot });
    if (existingTenant) return res.status(400).json({ message: "Sorry, this slot is already occupied." });
    
    const duplicateApp = await TenantApplication.findOne({ userId: data.userId, targetSlot: data.targetSlot, status: { $ne: 'TENANT' } });
    if (duplicateApp) return res.status(400).json({ message: "You already have a pending application for this slot." });

    const pendingApp = await TenantApplication.findOne({ targetSlot: data.targetSlot, status: { $in: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'CONTRACT_PENDING', 'CONTRACT_REVIEW'] } });
    if (pendingApp) return res.status(400).json({ message: "Someone else is currently applying for this slot." });

    const processUpload = (fieldName) => {
        if (req.files && req.files[fieldName]) {
            return req.files[fieldName][0].filename; 
        }
        return null;
    };

    const newApp = new TenantApplication({
      ...data, status: 'VERIFICATION_PENDING',
      permitUrl: processUpload('permit'),
      validIdUrl: processUpload('validId'),
      clearanceUrl: processUpload('clearance')
    });
    
    await newApp.save();
    await createAdminNotification("New Application Received", `Applicant ${data.name} has applied for slot ${data.targetSlot}.`);
    res.json(newApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitPayment = async (req, res) => {
  try {
    const { userId, targetSlot, paymentReference, paymentAmount } = req.body;
    let receiptFilename = null;
    if (req.file) {
        
        receiptFilename = req.file.filename; 
    }
    if (!receiptFilename) return res.status(400).json({ message: "Receipt file is required." });

    const updatedApp = await TenantApplication.findOneAndUpdate(
      { userId: userId, targetSlot: targetSlot }, 
      { receiptUrl: receiptFilename, paymentReference, paymentAmount, status: 'PAYMENT_REVIEW', paymentSubmittedAt: new Date() },
      { new: true }
    );
    if (!updatedApp) return res.status(404).json({ message: "Application not found for this slot." });

    await createAdminNotification("Payment Receipt Uploaded", `Ref: ${paymentReference}. Verify payment for Slot: ${targetSlot}.`);
    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadContract = async (req, res) => {
  try {
    const { userId, targetSlot } = req.body;
    let contractFilename = null;
    if (req.file) {
      
        contractFilename = req.file.filename;
    }
    if (!userId || !contractFilename || !targetSlot) return res.status(400).json({ message: "Missing required fields or file." });

    const updatedApp = await TenantApplication.findOneAndUpdate(
      { userId: userId, targetSlot: targetSlot },
      { contractUrl: contractFilename, status: 'CONTRACT_REVIEW', contractSubmittedAt: new Date() },
      { new: true }
    );
    if (!updatedApp) return res.status(404).json({ message: "Application not found for this slot." });
    
    await createAdminNotification("Contract Signed", `Signed contract uploaded for Slot: ${targetSlot}. Please review.`);
    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingStalls = async (req, res) => {
  try {
    const { floor } = req.query; 
    const activeStatuses = ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'CONTRACT_PENDING', 'CONTRACT_REVIEW'];
    const pendingApps = await TenantApplication.find({ floor: floor, status: { $in: activeStatuses } });
    const pendingLabels = pendingApps.map(app => app.targetSlot);
    res.json(pendingLabels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};