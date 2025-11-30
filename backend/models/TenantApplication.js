import mongoose from "mongoose";

const TenantApplicationSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true }, // Replaces Firebase UID
  name: String,
  contact: String,
  email: String,
  product: String,
  targetSlot: String,
  floor: String,
  status: { 
    type: String, 
    enum: ['VERIFICATION_PENDING', 'PAYMENT_UNLOCKED', 'PAYMENT_REVIEW', 'TENANT'],
    default: 'VERIFICATION_PENDING'
  },
  
  // Images stored as Base64 strings
  permitUrl: String,
  validIdUrl: String,
  clearanceUrl: String,
  receiptUrl: String,

  // Payment Details
  paymentReference: String,
  paymentAmount: String,
  paymentSubmittedAt: Date,

}, { timestamps: true });

export default mongoose.model("TenantApplication", TenantApplicationSchema);