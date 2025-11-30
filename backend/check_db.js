import mongoose from 'mongoose';
import LostFound from './models/LostFound.js'; 

// 1. Paste your CURRENT connection string here
const uri = "mongodb+srv://axie:EpvjL4VfyKlvUnJX@ibt-backend.tz0eqej.mongodb.net/IBT?appName=IBT-backend";

const run = async () => {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to Atlas");

    // This tells us which Database Mongoose is actually reading from
    console.log("📂 Target Database:", mongoose.connection.name);

    // This tells us if it can find the collection
    const count = await LostFound.countDocuments();
    console.log("📄 Documents found:", count);

    if (count === 0) {
      console.log("\n⚠️  DIAGNOSIS: Mongoose is looking in the wrong place.");
      console.log("   - Check if your connection string ends with /IBT");
      console.log("   - Check if your collection in Atlas is named 'lostfounds' or 'LostFound'");
    } else {
      console.log("\n🎉 SUCCESS: The backend can see the data! The issue was just a server restart needed.");
    }

  } catch (e) {
    console.error("❌ Connection Error:", e);
  } finally {
    mongoose.connection.close();
  }
};

run();