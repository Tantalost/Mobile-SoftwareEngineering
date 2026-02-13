import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { 
  getOccupiedStalls,
  getPendingStalls, 
  getMyApplication, 
  submitApplication, 
  submitPayment,
  uploadContract,
  getSecureDocument 
} from '../controllers/stallController.js';

const router = express.Router();

const uploadDir = path.join(os.homedir(), 'stalls_app_uploads'); 

console.log("[Multer] Shared Upload Path:", uploadDir);

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/doc/:filename', getSecureDocument);
router.get('/occupied', getOccupiedStalls);
router.get('/pending', getPendingStalls);
router.get('/my-application/:userId', getMyApplication);

router.post('/apply', 
  upload.fields([
    { name: 'permit', maxCount: 1 }, 
    { name: 'validId', maxCount: 1 },
    { name: 'clearance', maxCount: 1 }
  ]), 
  submitApplication
);

router.post('/pay', upload.single('receipt'), submitPayment);
router.post('/upload-contract', upload.single('contract'), uploadContract);

export default router;