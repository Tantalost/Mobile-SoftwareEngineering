import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactNo: { type: String, required: true },

  avatarUrl: { type: String, default: "" },
  
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date }
});


UserSchema.pre('save', async function () {
  
  if (!this.isModified('password')) return;

 
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model('User', UserSchema);