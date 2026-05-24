const mongoose = require("mongoose");
const Admin = require("./models/Admin");

mongoose.connect("mongodb://localhost:27017/ruha").then(async () => {
  const admins = await Admin.find({}, "-password");
  console.log("=== قائمة الادمنز ===");
  console.log(JSON.stringify(admins, null, 2));
  mongoose.disconnect();
}).catch(err => {
  console.error("خطأ في الاتصال:", err.message);
});
