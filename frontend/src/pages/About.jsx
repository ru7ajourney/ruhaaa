// src/pages/About.jsx
// صفحة عن رُحى

import { Link } from "react-router-dom";
import "./About.css";

const About = () => {
  return (
    <div className="about-page">
      {/* Header */}
      <div className="about-header">
        <div className="container">
          <h1>عن رُحى</h1>
          <p>القصة من البداية</p>
        </div>
      </div>

      <div className="container about-content">
        {/* القصة */}
        <section className="about-story">
          <div className="about-story-text">
            <h2>كيف بدأت رُحى؟</h2>
            <p>
              في يوم من الأيام، حزمت حقيبتي وطرت لإيطاليا. 10 أيام بالكامل كمتطوع
              (Workawayer)، أعيش مع عائلة إيطالية، أساعدهم في مزرعتهم، وأستكشف
              الريف التوسكاني.
            </p>
            <p>
              كانت تجربة غيّرت طريقة تفكيري بالسفر. مش بس سياحة — حياة حقيقية،
              ناس حقيقيين، تبادل ثقافي حقيقي.
            </p>
            <p>
              لما رجعت، لاحظت إنه ما قدرت أكرر التجربة بسهولة. الشغل، المصاري،
              الإجراءات... كل هاد بيوقف الواحد.
            </p>
            <p>
              وبعد فترة، صاحبي سألني: "كيف سافرت هيك؟ بدي أساعدك تساعدني أعمل
              نفس الشيء!" — ساعتها فكّرت: هاد مشروع!
            </p>
            <p>
              <strong>رُحى</strong> هي الإجابة لكل من بده يسافر ويتطوع بس مش عارف
              من وين يبدأ. نحن نبدأ عنك.
            </p>
          </div>
          <div className="about-story-img">
            <img
              src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600"
              alt="إيطاليا"
            />
          </div>
        </section>

        {/* ماذا نقدم */}
        <section className="about-what">
          <h2>شو بتقدم رُحى؟</h2>
          <div className="what-grid">
            <div className="what-card">
              <span className="what-icon">🗺️</span>
              <h3>تخطيط كامل</h3>
              <p>من اختيار الوجهة للمضيف للبرنامج — كل شيء جاهز</p>
            </div>
            <div className="what-card">
              <span className="what-icon">🤝</span>
              <h3>مضيف موثوق</h3>
              <p>نتواصل مع المضيفين مسبقاً ونضمن لك تجربة آمنة</p>
            </div>
            <div className="what-card">
              <span className="what-icon">🚗</span>
              <h3>مرافق ومواصلات</h3>
              <p>المرافق معك طول الرحلة، والسيارة جاهزة للمجموعة</p>
            </div>
            <div className="what-card">
              <span className="what-icon">💰</span>
              <h3>تكاليف بسيطة</h3>
              <p>تدفع تكلفة المرافق والخبرة فقط — بدون أسعار مبالغ</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <h2>جاهز تسافر؟</h2>
          <p>تصفح الرحلات المتاحة وتواصل معنا</p>
          <Link to="/trips" className="btn btn-primary">
            اكتشف الرحلات ←
          </Link>
        </section>
      </div>
    </div>
  );
};

export default About;
