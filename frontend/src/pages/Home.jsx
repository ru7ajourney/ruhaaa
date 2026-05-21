// src/pages/Home.jsx
// الصفحة الرئيسية

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tripsAPI } from "../api";
import TripCard from "../components/TripCard";
import "./Home.css";

const particles = [
  { x:"3%",  y:"80%", s:"3px", dur:"9s",  delay:"0s"   },
  { x:"8%",  y:"65%", s:"2px", dur:"11s", delay:"2s"   },
  { x:"14%", y:"88%", s:"4px", dur:"7s",  delay:"0.8s" },
  { x:"20%", y:"72%", s:"2px", dur:"13s", delay:"3.5s" },
  { x:"28%", y:"85%", s:"3px", dur:"8s",  delay:"1.2s" },
  { x:"36%", y:"90%", s:"2px", dur:"10s", delay:"4s"   },
  { x:"44%", y:"78%", s:"3px", dur:"9s",  delay:"2.5s" },
  { x:"50%", y:"82%", s:"2px", dur:"12s", delay:"0.5s" },
  { x:"58%", y:"70%", s:"4px", dur:"8s",  delay:"3s"   },
  { x:"65%", y:"88%", s:"2px", dur:"10s", delay:"1.8s" },
  { x:"72%", y:"75%", s:"3px", dur:"7s",  delay:"4.5s" },
  { x:"80%", y:"83%", s:"2px", dur:"11s", delay:"2.2s" },
  { x:"88%", y:"68%", s:"3px", dur:"9s",  delay:"0.3s" },
  { x:"6%",  y:"50%", s:"2px", dur:"14s", delay:"1s"   },
  { x:"22%", y:"55%", s:"3px", dur:"10s", delay:"5s"   },
  { x:"40%", y:"48%", s:"2px", dur:"12s", delay:"2.8s" },
  { x:"75%", y:"45%", s:"2px", dur:"11s", delay:"4.2s" },
  { x:"90%", y:"58%", s:"4px", dur:"8s",  delay:"0.6s" },
];

const stars = [
  { x:"15%", y:"14%", dur:"3s", delay:"0s"   },
  { x:"30%", y:"7%",  dur:"4s", delay:"1s"   },
  { x:"50%", y:"11%", dur:"2s", delay:"2s"   },
  { x:"70%", y:"5%",  dur:"5s", delay:"0.5s" },
  { x:"85%", y:"17%", dur:"3s", delay:"1.5s" },
  { x:"95%", y:"9%",  dur:"4s", delay:"3s"   },
  { x:"5%",  y:"24%", dur:"3s", delay:"2.5s" },
  { x:"42%", y:"19%", dur:"4s", delay:"1.8s" },
  { x:"62%", y:"13%", dur:"2s", delay:"0.8s" },
  { x:"78%", y:"21%", dur:"5s", delay:"3.5s" },
  { x:"24%", y:"28%", dur:"3s", delay:"4s"   },
  { x:"55%", y:"26%", dur:"4s", delay:"0.2s" },
];

const Home = () => {
  const [featuredTrips, setFeaturedTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await tripsAPI.getFeatured();
        setFeaturedTrips(data);
      } catch (err) {
        console.error("خطأ في جلب الرحلات:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home">
      {/* ==============================
          Hero Section
          ============================== */}
      <section className="hero">

        {/* خلفية كريتيف */}
        <div className="hero-bg" aria-hidden="true">

          {/* أورورا */}
          <div className="hbg-aurora" />

          {/* توهجات */}
          <div className="hbg-glow hbg-glow--sun"  />
          <div className="hbg-glow hbg-glow--warm" />
          <div className="hbg-glow hbg-glow--teal" />

          {/* نجوم تتلألأ */}
          {stars.map((s, i) => (
            <div key={i} className="hbg-star" style={{
              left: s.x, top: s.y,
              animationDuration: s.dur,
              animationDelay: s.delay,
            }} />
          ))}

          {/* جزيئات متطايرة */}
          {particles.map((p, i) => (
            <div key={i} className="hbg-particle" style={{
              left: p.x, top: p.y,
              width: p.s, height: p.s,
              animationDuration: p.dur,
              animationDelay: p.delay,
            }} />
          ))}

          {/* حلقات */}
          <svg className="hbg-rings" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" fill="none">
            <circle cx="120" cy="120" r="150" stroke="rgba(255,140,40,0.12)" strokeWidth="1"/>
            <circle cx="120" cy="120" r="240" stroke="rgba(255,140,40,0.07)" strokeWidth="1"/>
            <circle cx="120" cy="120" r="330" stroke="rgba(255,140,40,0.04)" strokeWidth="1"/>
            <circle cx="120" cy="120" r="420" stroke="rgba(255,120,20,0.02)" strokeWidth="1"/>
          </svg>

          {/* خطوط مسار */}
          <svg className="hbg-paths" viewBox="0 0 1000 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path d="M-50,200 Q200,80  450,200 Q700,320 1050,180" stroke="rgba(255,140,40,0.15)" strokeWidth="1.5" strokeDasharray="6 10"/>
            <path d="M-50,300 Q250,140 500,280 Q750,400 1050,270" stroke="rgba(255,180,80,0.09)" strokeWidth="1"   strokeDasharray="4 12"/>
          </svg>

          {/* جبال */}
          <svg className="hbg-mountains" viewBox="0 0 1440 240" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,240 L0,155 L90,85  L180,145 L300,55  L420,130 L540,80  L660,148 L780,58  L900,118 L1020,72 L1140,138 L1260,88 L1380,120 L1440,100 L1440,240 Z" fill="#1a3020" opacity="0.8"/>
            <path d="M0,240 L0,185 L140,118 L280,172 L440,105 L600,170 L760,115 L920,165 L1080,120 L1240,158 L1440,128 L1440,240 Z" fill="#214030" opacity="0.9"/>
            <path d="M0,240 L0,210 L200,165 L400,205 L600,160 L800,200 L1000,162 L1200,198 L1440,168 L1440,240 Z" fill="#284838"/>
          </svg>
        </div>

        {/* تعتيم اتجاهي لإبراز النص */}
        <div className="hero-overlay" aria-hidden="true" />

        {/* عناصر ديكور خفيفة */}
        <div className="hero-deco" aria-hidden="true">
          <div className="hdeco-ring hdeco-ring--1" />
          <div className="hdeco-dots" />
        </div>

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
          <svg viewBox="0 0 1440 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,35 C240,70 480,0 720,35 C960,70 1200,0 1440,35 L1440,70 L0,70 Z" fill="#ffffff"/>
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
      <section className="featured-trips section">
        <div className="container">
          <h2 className="section-title">الرحلات المميزة</h2>
          <p className="section-subtitle">اكتشف أجمل وجهاتنا الثقافية</p>

          {loading ? (
            <div className="page-loading">
              <div className="spinner" />
            </div>
          ) : featuredTrips.length > 0 ? (
            <div className="trips-grid">
              {featuredTrips.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </div>
          ) : (
            <p className="no-trips">لا توجد رحلات مميزة حالياً</p>
          )}

          <div className="all-trips-btn">
            <Link to="/trips" className="btn btn-secondary">
              شوف كل الرحلات ←
            </Link>
          </div>
        </div>
      </section>

      {/* ==============================
          Story Section - قصة رُحى
          ============================== */}
      <section className="story-section">
        <div className="container story-inner">
          <div className="story-text">
            <span className="story-label">القصة</span>
            <h2>من إيطاليا بدأت رُحى</h2>
            <p>
              سافرت 10 أيام لإيطاليا كمتطوع، وكانت تجربة غيّرت نظرتي للسفر.
              لما رجعت، بدأ أصحابي يسألوني كيف عملتها. فكّرت: مش لازم يسافر
              الواحد لحاله.
            </p>
            <p>
              رُحى هي الإجابة — نخطط، نرافق، ونجعل السفر والتطوع ممكناً لكل
              واحد، بتكاليف بسيطة وبدون تعقيد.
            </p>
            <Link to="/about" className="btn btn-primary">
              اقرأ القصة كاملة
            </Link>
          </div>
          <div className="story-image">
            <img
              src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600"
              alt="إيطاليا"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
