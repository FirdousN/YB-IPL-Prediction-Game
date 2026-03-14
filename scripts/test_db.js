
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testDb() {
  console.log('Testing DB connection...');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected successfully to MongoDB');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (e) {
    console.error('Connection failed', e);
    process.exit(1);
  }
}

testDb();
