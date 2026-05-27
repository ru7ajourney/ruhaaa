// src/pages/Home.jsx
// الصفحة الرئيسية

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tripsAPI, galleryAPI } from "../api";
import TripCard from "../components/TripCard";
import LightboxImage from "../components/LightboxImage";
import { getCropImgStyle } from "../utils/cropStyle";
import "./Home.css";

const stars = [
  { x: "10%", y: "7%",  size: "3px", dur: "3s",   delay: "0s"   },
  { x: "24%", y: "5%",  size: "2px", dur: "4s",   delay: "1.2s" },
  { x: "44%", y: "9%",  size: "2px", dur: "2.8s", delay: "0.5s" },
  { x: "60%", y: "4%",  size: "3px", dur: "3.5s", delay: "2s"   },
  { x: "77%", y: "10%", size: "2px", dur: "4s",   delay: "0.8s" },
  { x: "91%", y: "6%",  size: "2px", dur: "3s",   delay: "1.8s" },
  { x: "6%",  y: "20%", size: "2px", dur: "4.5s", delay: "3s"   },
  { x: "52%", y: "16%", size: "3px", dur: "3.2s", delay: "2.5s" },
];

const fireflies = [
  { x: "8%",  y: "72%", dur: "6s",   delay: "-1.2s", dx: "18px",  dy: "-14px" },
  { x: "17%", y: "80%", dur: "8s",   delay: "-5.6s", dx: "-12px", dy: "-20px" },
  { x: "26%", y: "68%", dur: "7s",   delay: "-3.1s", dx: "22px",  dy: "-10px" },
  { x: "35%", y: "76%", dur: "9s",   delay: "-7.4s", dx: "-16px", dy: "-18px" },
  { x: "46%", y: "70%", dur: "6.5s", delay: "-4.8s", dx: "14px",  dy: "-22px" },
  { x: "55%", y: "82%", dur: "7.5s", delay: "-2.3s", dx: "-20px", dy: "-12px" },
  { x: "63%", y: "67%", dur: "8.5s", delay: "-6.9s", dx: "16px",  dy: "-16px" },
  { x: "72%", y: "78%", dur: "6s",   delay: "-0.8s", dx: "-10px", dy: "-24px" },
  { x: "81%", y: "73%", dur: "7s",   delay: "-5.2s", dx: "20px",  dy: "-14px" },
  { x: "90%", y: "79%", dur: "9s",   delay: "-3.7s", dx: "-14px", dy: "-18px" },
  { x: "13%", y: "86%", dur: "8s",   delay: "-1.9s", dx: "12px",  dy: "-20px" },
  { x: "48%", y: "85%", dur: "7.5s", delay: "-6.1s", dx: "-18px", dy: "-10px" },
];


const Home = () => {
  const [featuredTrips, setFeaturedTrips]   = useState([]);
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await tripsAPI.getFeatured();
        setFeaturedTrips(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("خطأ في جلب الرحلات:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPhotos = async () => {
      try {
        const { data } = await galleryAPI.getFeatured();
        setFeaturedPhotos(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch {
        // الصور اختيارية — تجاهل الخطأ
      }
    };

    fetchFeatured();
    fetchPhotos();
  }, []);

  return (
    <div className="home">
      {/* ==============================
          Hero Section
          ============================== */}
      <section className="hero">

        {/* خلفية */}
        <div className="hero-bg" aria-hidden="true">

          {/* توهج شمسي */}
          <div className="hbg-glow hbg-glow--sun" />

          {/* نجوم صغيرة */}
          {stars.map((s, i) => (
            <div key={i} className="hbg-star" style={{
              left: s.x, top: s.y,
              width: s.size, height: s.size,
              animationDuration: s.dur,
              animationDelay: s.delay,
            }} />
          ))}

          {/* غيوم ثابتة */}
          <svg className="hbg-cloud hbg-cloud--1" viewBox="0 0 210 85" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="85"  cy="66" rx="78" ry="25"/>
            <ellipse cx="115" cy="46" rx="50" ry="34"/>
            <ellipse cx="60"  cy="48" rx="42" ry="27"/>
            <ellipse cx="155" cy="54" rx="38" ry="23"/>
          </svg>
          <svg className="hbg-cloud hbg-cloud--2" viewBox="0 0 175 74" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="72"  cy="57" rx="66" ry="22"/>
            <ellipse cx="99"  cy="39" rx="45" ry="30"/>
            <ellipse cx="52"  cy="41" rx="37" ry="24"/>
            <ellipse cx="136" cy="47" rx="33" ry="20"/>
          </svg>
          <svg className="hbg-cloud hbg-cloud--3" viewBox="0 0 145 63" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="58" cy="48" rx="52" ry="19"/>
            <ellipse cx="78" cy="32" rx="34" ry="24"/>
            <ellipse cx="42" cy="34" rx="28" ry="19"/>
            <ellipse cx="108" cy="38" rx="26" ry="17"/>
          </svg>
          <svg className="hbg-cloud hbg-cloud--4" viewBox="0 0 190 80" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="78"  cy="62" rx="72" ry="24"/>
            <ellipse cx="108" cy="42" rx="48" ry="32"/>
            <ellipse cx="56"  cy="44" rx="40" ry="26"/>
            <ellipse cx="148" cy="50" rx="36" ry="22"/>
          </svg>
          <svg className="hbg-cloud hbg-cloud--5" viewBox="0 0 158 68" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="64" cy="52" rx="58" ry="20"/>
            <ellipse cx="88" cy="35" rx="38" ry="27"/>
            <ellipse cx="46" cy="37" rx="32" ry="21"/>
            <ellipse cx="120" cy="43" rx="28" ry="18"/>
          </svg>

          {/* جبال */}
          <svg className="hbg-mountains" viewBox="0 0 1440 240" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path className="hbg-mtn--back" d="M0,240 L0,155 L90,85  L180,145 L300,55  L420,130 L540,80  L660,148 L780,58  L900,118 L1020,72 L1140,138 L1260,88 L1380,120 L1440,100 L1440,240 Z" fill="#1e5e45" opacity="0.55"/>
            <path className="hbg-mtn--mid"  d="M0,240 L0,185 L140,118 L280,172 L440,105 L600,170 L760,115 L920,165 L1080,120 L1240,158 L1440,128 L1440,240 Z" fill="#2d6a4f" opacity="0.65"/>
            <path className="hbg-mtn--front" d="M0,240 L0,210 L200,165 L400,205 L600,160 L800,200 L1000,162 L1200,198 L1440,168 L1440,240 Z" fill="#40916c" opacity="0.75"/>
          </svg>

          {/* يرعات */}
          {fireflies.map((f, i) => (
            <div key={i} className="hbg-firefly" style={{
              left: f.x, top: f.y,
              animationDuration: f.dur,
              animationDelay: f.delay,
              "--dx": f.dx,
              "--dy": f.dy,
            }} />
          ))}
        </div>

        {/* تعتيم خفيف */}
        <div className="hero-overlay" aria-hidden="true" />


        <div className="hero-deco" aria-hidden="true" />

        {/* المحتوى */}
        <div className="container hero-content">
          <div className="hero-badge">
            <span>✈️</span> سفر · تطوع · ثقافة
          </div>

          <h1 className="hero-title">
            سافر مع <span className="highlight">رُحى</span>
            <br />
            وعش التجربة الحقيقية
          </h1>

          <p className="hero-subtitle">
            ما تسافر لحالك. رُحى ترافقك من أول خطوة لآخر خطوة — نلاقي المضيف،
            ننظم البرنامج، ونوصلك هناك بتكاليف بسيطة.
          </p>

          <div className="hero-actions">
            <Link to="/trips" className="btn btn-primary hero-btn">
              اكتشف الرحلات
            </Link>
            <Link to="/about" className="btn btn-white hero-btn">
              كيف يشتغل؟
            </Link>
          </div>
        </div>

        {/* موجة سفلية */}
        <div className="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 125" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,62 C200,125 500,0 720,62 C940,125 1240,0 1440,62 L1440,125 L0,125 Z" fill="#ffffff"/>
          </svg>
        </div>
      </section>

      {/* ==============================
          How it Works - كيف تشتغل رُحى
          ============================== */}
      <section className="how-it-works section">
        <div className="container">
          <h2 className="section-title text-center">كيف تشتغل رُحى؟</h2>
          <p className="section-subtitle text-center">
            أربع خطوات بسيطة وأنت في رحلتك
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">🔍</div>
              <h3>اختار رحلتك</h3>
              <p>تصفح الرحلات المتاحة واختار الوجهة اللي تناسبك وميزانيتك</p>
            </div>
            <div className="step-card">
              <div className="step-icon">📞</div>
              <h3>تواصل معنا</h3>
              <p>رُحى تتواصل معك وتشرحلك كل التفاصيل وتجاوب على أسئلتك</p>
            </div>
            <div className="step-card">
              <div className="step-icon">✈️</div>
              <h3>احجز وسافر</h3>
              <p>نساعدك بحجز الطيران، ونتواصل مع المضيف، وننظم كل شيء</p>
            </div>
            <div className="step-card">
              <div className="step-icon">🌍</div>
              <h3>عش التجربة</h3>
              <p>رُحى معك طول الرحلة كمرافق ودليل — أنت بس استمتع</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          Featured Trips - الرحلات المميزة
          ============================== */}
      {!loading && featuredTrips.length > 0 && (
        <section className="featured-trips section">
          <div className="container">
            <h2 className="section-title">الرحلات المميزة</h2>
            <p className="section-subtitle">اكتشف أجمل وجهاتنا الثقافية</p>

            <div className="trips-grid">
              {featuredTrips.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </div>

            <div className="all-trips-btn">
              <Link to="/trips" className="btn btn-secondary">
                شوف كل الرحلات ←
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ==============================
          Featured Photos - من رحلاتنا
          ============================== */}
      {featuredPhotos.length > 0 && (
        <section className="featured-photos section">
          <div className="fp-grid">
            {featuredPhotos.map((photo) => (
              <div key={photo._id} className="fp-item">
                <LightboxImage
                  src={photo.imageUrl}
                  alt={photo.title || "صورة من رحلة"}
                  caption={photo.title}
                  style={getCropImgStyle(photo.cropArea)}
                />
                {photo.title && <div className="fp-caption">{photo.title}</div>}
              </div>
            ))}
          </div>
          <div className="fp-gallery-btn">
            <Link to="/gallery" className="btn btn-secondary">
              شوف المعرض كاملاً ←
            </Link>
          </div>
        </section>
      )}

      {/* ==============================
          Story Section - قصة رُحى
          ============================== */}
      <section className="story-section">
        <div className="container story-inner">
          <div className="story-text">
            <span className="story-label">القصة</span>
            <h2>مكالمة غيّرت كل شيء</h2>
            <p>
              أدهم رجع من إيطاليا وهو مش نفس الشخص — عشر أيام كمتطوع
              بريف توسكانا حسّسته إنو في سفر تاني بالكل، مش بس سياحة.
              بس الحياة ما بتوقف، والأيام بلشت تمشي، وشوي شوي بدأ
              يتناسى الموضوع...
            </p>
            <p>
              بعد كم يوم، رن التلفون. ذياب على الخط — سأله عن الرحلة،
              وبتلك المحادثة بالذات وُلدت رُحى.
            </p>
            <Link to="/about" className="btn btn-primary">
              اقرأ كيف وُلدت رُحى ←
            </Link>
          </div>
          <div className="story-image">
            <LightboxImage
              src="https://res.cloudinary.com/du3swcegt/image/upload/v1779528975/7d3770d1-3272-4145-8a41-129f731d24b5_kbopud.jpg"
              alt="إيطاليا"
              caption="من تطوع أدهم في مزرعة بطبيعة توسكانا في إيطاليا"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
