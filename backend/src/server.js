import dotenv from 'dotenv';
dotenv.config();


import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import busRoutes from './routes/busRoutes.js';
import stallRoutes from './routes/stallRoutes.js'; 
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = 3000;

app.use(cors());


app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));


mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
 
  
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/bus-routes', busRoutes); 
app.use("/api/auth", authRoutes);
app.use('/api/stalls', stallRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});