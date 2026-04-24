require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    console.log('Testing DB connection to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

test();
