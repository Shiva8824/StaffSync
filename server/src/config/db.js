const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/staffsync');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    console.error('💡 Troubleshooting Tip for Cloud Deployment:');
    console.error('1. Check MONGODB_URI in your environment variables.');
    console.error('2. Ensure your MongoDB Atlas Network Access has IP 0.0.0.0/0 (Allow Access from Anywhere) whitelisted.');
    console.error('3. Verify your Atlas DB username and password in the connection string.');
    process.exit(1);
  }
};

module.exports = connectDB;
