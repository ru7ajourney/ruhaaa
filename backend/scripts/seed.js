// scripts/seed.js
// سكريبت لإنشاء الآدمن وبيانات تجريبية
// شغّله مرة واحدة: node scripts/seed.js

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Trip = require("../models/Trip");
const connectDB = require("../config/db");

const seedData = async () => {
  await connectDB();

  // امسح البيانات القديمة
  await Admin.deleteMany();
  await Trip.deleteMany();

  // أنشئ الآدمن
  await Admin.create({
    email: process.env.ADMIN_EMAIL || "admin@ruha.com",
    password: process.env.ADMIN_PASSWORD || "ruha_admin_2024",
    name: "Ruha Admin",
  });
  console.log("✅ Admin created");

  // أضف رحلة تجريبية
  await Trip.create([
    {
      title: "رحلة إيطاليا - تطوع وثقافة",
      destination: "إيطاليا",
      country: "Italy",
      shortDescription: "عشرة أيام من التطوع والاستكشاف في قلب إيطاليا - روما وتوسكانا",
      description: `تجربة فريدة جمعت بين التطوع الثقافي والسياحة في إيطاليا.
ستعيش مع عائلة مضيفة، تتعلم اللغة والثقافة، وتستكشف أجمل المدن الإيطالية.
رحى توفر لك كل شيء: التخطيط، التواصل مع المضيف، والمرافقة الكاملة من بداية الرحلة لنهايتها.`,
      duration: 10,
      price: 350,
      currency: "USD",
      coverImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
      isFeatured: true,
      program: [
        { day: 1, title: "السفر والوصول إلى روما", description: "نلتقي في المطار ونتوجه معاً إلى مكان الإقامة في روما" },
        { day: 2, title: "استكشاف روما القديمة", description: "زيارة الكولوسيوم، المنتدى الروماني، ونافورة تريفي" },
        { day: 3, title: "بداية التطوع", description: "أول يوم في المزرعة العضوية - تعرف على المضيف والعمل" },
        { day: 4, title: "التطوع وتعلم الطبخ الإيطالي", description: "عمل صباحي في المزرعة، ودرس طبخ مع العائلة المضيفة مساءً" },
        { day: 5, title: "رحلة إلى فلورنسا", description: "يوم حر لاستكشاف فلورنسا وزيارة متحف الأوفيزي" },
        { day: 6, title: "التطوع والطبيعة", description: "عمل في الحديقة وجولة في الريف التوسكاني" },
        { day: 7, title: "سان جيمينيانو", description: "زيارة قرية القرون الوسطى الساحرة" },
        { day: 8, title: "يوم مع العائلة المضيفة", description: "يوم كامل مع العائلة - سوق محلي وعشاء عائلي" },
        { day: 9, title: "العودة إلى روما والتسوق", description: "آخر يوم في روما - تسوق وزيارة الفاتيكان" },
        { day: 10, title: "العودة إلى الوطن", description: "وداع وعودة محملين بالذكريات" },
      ],
      availableDates: [
        {
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
          spotsTotal: 8,
          spotsTaken: 3,
        },
        {
          startDate: new Date("2024-08-15"),
          endDate: new Date("2024-08-24"),
          spotsTotal: 8,
          spotsTaken: 1,
        },
      ],
      includes: ["الإقامة مع العائلة المضيفة", "المواصلات الداخلية", "المرافق الشخصي (رحى)", "برنامج التطوع", "بعض الوجبات"],
      excludes: ["تذاكر الطيران", "التأمين الطبي", "المصاريف الشخصية"],
    },
    {
      title: "رحلة المغرب - جمال الأندلس",
      destination: "المغرب",
      country: "Morocco",
      shortDescription: "سبعة أيام في مراكش وجبال الأطلس - تطوع في مدرسة قروية",
      description: `اكتشف المغرب من منظور مختلف. تطوع في مدرسة قروية في جبال الأطلس،
وعش تجربة الضيافة المغربية الأصيلة. رحى تنظم كل شيء وترافقك في كل خطوة.`,
      duration: 7,
      price: 250,
      currency: "USD",
      coverImage: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800",
      isFeatured: true,
      program: [
        { day: 1, title: "الوصول إلى مراكش", description: "استقبال في مطار مراكش والإقامة في رياض تقليدي" },
        { day: 2, title: "جامع الفنا والمدينة القديمة", description: "استكشاف الأسواق والساحة الشهيرة" },
        { day: 3, title: "التوجه لجبال الأطلس", description: "رحلة إلى القرية وبداية التطوع في المدرسة" },
        { day: 4, title: "التطوع والحياة القروية", description: "يوم كامل في المدرسة مع الأطفال" },
        { day: 5, title: "الطبيعة والتنزه", description: "رحلة تنزه في جبال الأطلس" },
        { day: 6, title: "العودة لمراكش والتسوق", description: "تسوق في الأسواق وعشاء وداع" },
        { day: 7, title: "العودة إلى الوطن", description: "وداع المغرب الجميل" },
      ],
      availableDates: [
        {
          startDate: new Date("2024-07-10"),
          endDate: new Date("2024-07-16"),
          spotsTotal: 10,
          spotsTaken: 4,
        },
      ],
      includes: ["الإقامة (رياض + قرية)", "المواصلات الداخلية", "المرافق (رحى)", "برنامج التطوع", "الإفطار يومياً"],
      excludes: ["تذاكر الطيران", "التأمين", "وجبات الغداء والعشاء"],
    },
  ]);

  console.log("✅ Sample trips created");
  console.log("\n🎉 Seed completed successfully!");
  console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL || "admin@ruha.com"}`);
  console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD || "ruha_admin_2024"}`);

  process.exit(0);
};

seedData().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
