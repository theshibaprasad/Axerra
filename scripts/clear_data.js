const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve('/Users/theshibaprasad/Downloads/saa-s-website-generation/.env.local') });

async function clear() {
    console.log('Connecting to DB...', process.env.MONGODB_URI);
    if (!process.env.MONGODB_URI) {
        console.error('No MONGODB_URI found');
        return;
    }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing connectors...');
  try {
    await mongoose.connection.db.collection('connectors').deleteMany({});
    console.log('Cleared connectors successfully.');
  } catch (e) {
      console.error('Error clearing:', e);
  }
  process.exit(0);
}
clear();
