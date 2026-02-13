import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
 
  firstName: String,     
  middleName: String,    
  lastName: String,      
  tenantName: { type: String, required: true }, 

 
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  
 
  referenceNo: { type: String, required: true, unique: true },
  slotNo: { type: String, required: true }, 
  tenantType: { type: String, required: true }, 
  products: String,
  
  
  rentAmount: Number,
  utilityAmount: Number,
  totalAmount: Number,
  

  StartDateTime: Date,
  DueDateTime: Date,
  
  
  status: { type: String, default: "Paid" }, 
  
 
  documents: {
    businessPermit: String,
    validID: String,
    barangayClearance: String,
    proofOfReceipt: String,
    contract: String 
  },

 
  paymentHistory: [{
    referenceNo: String,
    amount: Number,
    receiptUrl: String,
    datePaid: { type: Date, default: Date.now }
  }],
 
  
  uid: String, 
  transferWaitlistId: String, 
  
}, { timestamps: true });

export default mongoose.model('Tenant', TenantSchema);