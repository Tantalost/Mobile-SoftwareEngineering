import mongoose from 'mongoose';
import LostFound from './models/LostFound.js'; 


const uri = process.env.MONGODB_URL;

const run = async () => {
  try {
    await mongoose.connect(uri);
    console.log(" Connected to Atlas");

    console.log(" Target Database:", mongoose.connection.name);

    const count = await LostFound.countDocuments();
    console.log(" Documents found:", count);

    if (count === 0) {
      console.log("\n  DIAGNOSIS: Mongoose is looking in the wrong place.");
      console.log("   - Check if your connection string ends with /IBT");
      console.log("   - Check if your collection in Atlas is named 'lostfounds' or 'LostFound'");
    } else {
      console.log("\n SUCCESS: The backend can see the data! The issue was just a server restart needed.");
    }

  } catch (e) {
    console.error(" Connection Error:", e);
  } finally {
    mongoose.connection.close();
  }
};

run();