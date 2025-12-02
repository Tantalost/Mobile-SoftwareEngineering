import express from 'express';
import { 
  getOccupiedStalls, 
  getMyApplication, 
  submitApplication, 
  submitPayment,
  uploadContract // <--- Import this
} from '../controllers/stallController.js';

const router = express.Router();

router.get('/occupied', getOccupiedStalls);
router.get('/my-application/:deviceId', getMyApplication);
router.post('/apply', submitApplication);
router.post('/pay', submitPayment);

// <--- Add this new route
router.post('/upload-contract', uploadContract);

export default router;