import mongoose from "mongoose";

const StallSchema = new mongoose.Schema({
  slotLabel: { type: String, required: true }, 
  floor: { type: String, required: true },     
  status: { type: String, default: "Paid" },   
  tenantId: { type: String },                  
}, { timestamps: true });

export default mongoose.model("Stall", StallSchema);