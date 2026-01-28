import User from '../models/User.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendEmail } from '../utils/email.js';

dotenv.config(); 

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
  try {
    const { username, email, password, contactNo } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

    user = new User({ username, email, password, contactNo });
    await user.save();

    res.status(201).json({ 
      message: "User registered successfully", 
      token: generateToken(user._id),
      user: { id: user._id, name: user.username, email: user.email } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ $or: [{ email: email }, { username: email }] });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    res.json({ 
      message: "Login successful", 
      token: generateToken(user._id),
      user: { id: user._id, name: user.username, email: user.email, contact: user.contactNo } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });

    user.resetPasswordOtp = generateOTP();
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; 
    
    
    await user.save(); 

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Code',
      text: `Your reset code is: ${user.resetPasswordOtp}`
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired OTP" });

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    
   
    await user.save();
    
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};