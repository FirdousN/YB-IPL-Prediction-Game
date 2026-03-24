const { loadEnvConfig } = require('@next/env');
loadEnvConfig('./');
const mongoose = require('mongoose');

async function drop() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  try { await mongoose.connection.collection('matches').drop(); console.log("Matches dropped"); } catch(e){}
  try { await mongoose.connection.collection('predictions').drop(); console.log("Predictions dropped"); } catch(e){}
  process.exit(0);
}
drop();
