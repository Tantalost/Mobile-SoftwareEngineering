import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import busRoutes from './routes/busRoutes.js'

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://axie:EpvjL4VfyKlvUnJX@ibt-backend.tz0eqej.mongodb.net/IBT?appName=IBT-backend"
mongoose.connect(uri)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/bus-routes', busRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});