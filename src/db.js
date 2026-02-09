const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('db start');
  } catch (error) {
    console.error('db nestart', error);
    process.exit(1);
  }
};

module.exports = connectDB;
