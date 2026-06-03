// src/pages/About.jsx
// صفحة عن رُحى

import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import LightboxImage from "../components/LightboxImage";
import "./About.css";

const About = () => {
  return (
    <div className="about-page">
      <PageHero title="عن رُحى" subtitle="القصة من البداية" icon="🌍" />

      <div className="container about-content">
        {/* القصة */}
        <section className="about-story">
          <div className="about-story-text">
            <h2>كيف وُلدت رُحى؟</h2>
            <p>
              أدهم حزم حقيبته وطار على إيطاليا ... عشر أيام كمتطوع بريف توسكانا، في مزرعه بيملكها مزارع الماني ، يساعد بالمزرعه ، ياكل على طاولتهم، ويتعلم كلمات إيطالية والمانيه مكسّرة وسط الضحكات. ما كانت سياحة ، كانت حياة حقيقية بقلب ثقافة تانية.
            </p>
            <p>
              رجع أدهم والموضوع ما طلعش من باله . بدّه يكرر التجربة، و يعيشها أكثر من مرة وبأماكن ثانيه. بس الواقع كان أتقل من الحلم — الوقت، الجهد والمصاري. شوي شوي، بلشت تلك التجربة الاستثنائية تضيع بزحمة الحياة اليومية، وبدأ الموضوع ينتسى.
            </p>
            <p>
               بعد كم يوم من رجعته، رن التلفون. ذياب على الخط — صاحبه القديم عم يسأله بفضول عن رحلة إيطاليا. حكوا كثير، واشتعل الحماس من جديد. وبشكل طبيعي، انتقل الحكي على الخطوة الجاية: كيف يسافر ذياب بنفس الفكرة — تطوع بين الجبال بفرنسا.
            </p>
            <p>
             قعدوا يخططوا مع بعض، يدوّروا على المضيفين، يرسموا البرنامج، وذياب بلش يتحمس للفكرة أكثر وأكثر. وبتلك اللحظات بالذات ، وسط الخرائط والمواعيد والأسئلة ، ولدت الفكرة.
            </p>
            <p>
             وبدأ يظهر ايمانهم وشغفهم بهاي الفكره , وبلشوا يحكو اكثر وظهرت فكرة "ليش ما نخلي الاشي يخدم الناس الي حابه تجرب اشي من هالنوع" 
            </p>
             <p>
             من تلك الجملة بلشت الفكرة تكبر. وتكبر. ولحد هسا بعدها بتكبر واليوم وصلت لـ <strong>رُحى</strong>، لانو الكل بستاهل يجرب ويكسر الروتين ويعيش تجربه مش رح ينساها طول العمر.
            </p>
          </div>
          <div className="about-story-img">
            <LightboxImage
              src="https://res.cloudinary.com/du3swcegt/image/upload/v1779522951/WhatsApp_Image_2026-05-14_at_19.38.52_1_w9mlqb.jpg"
              alt="إيطاليا"
              caption="من رحلة ذياب الاستكشافية بين الجبال في فرنسا"
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
