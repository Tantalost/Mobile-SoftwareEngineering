import express from 'express';
import { getOccupiedStalls, getMyApplication, submitApplication, submitPayment } from '../controllers/stallController.js';

const router = express.Router();

router.get('/occupied', getOccupiedStalls);
router.get('/my-application/:deviceId', getMyApplication);
router.post('/apply', submitApplication);
router.post('/pay', submitPayment);

export default router;