// scripts/seedGallery.js
// node scripts/seedGallery.js

require("dotenv").config();
const connectDB = require("../config/db");
const Gallery  = require("../models/Gallery");

const mountains = [
  { imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", title: "قمم الألب السويسرية" },
  { imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", title: "جبال هيمالايا" },
  { imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", title: "الجبال في الشتاء" },
  { imageUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800", title: "قمة ضبابية" },
  { imageUrl: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800", title: "جبال روكي" },
  { imageUrl: "https://images.unsplash.com/photo-1472791108553-c9405341e398?w=800", title: "وادي الجبل" },
  { imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800", title: "الطبيعة الجبلية" },
  { imageUrl: "https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=800", title: "جبال دولوميت" },
  { imageUrl: "https://images.unsplash.com/photo-1439853949212-36089c8d8f8e?w=800", title: "قمة تعلوها الغيوم" },
  { imageUrl: "https://images.unsplash.com/photo-1520208422220-d12a3c588e6c?w=800", title: "غروب الشمس على الجبال" },
];

(async () => {
  await connectDB();
  await Gallery.insertMany(mountains);
  console.log("✅ 10 mountain photos inserted");
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
