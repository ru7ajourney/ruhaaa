// config/db.js
// الاتصال بقاعدة بيانات MongoDB

const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // حذفنا process.exit عشان السيرفر ما يوقف
    }
};

module.exports = connectDB;
