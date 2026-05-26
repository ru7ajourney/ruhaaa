// src/components/PageHero.jsx
import "./PageHero.css";

const stars = [
  { x: "8%",  y: "18%", size: "2px", dur: "3.5s", delay: "0s"   },
  { x: "20%", y: "10%", size: "3px", dur: "4s",   delay: "1s"   },
  { x: "48%", y: "8%",  size: "2px", dur: "3s",   delay: "0.5s" },
  { x: "72%", y: "14%", size: "2px", dur: "4.5s", delay: "2s"   },
  { x: "88%", y: "22%", size: "3px", dur: "3.2s", delay: "1.5s" },
  { x: "35%", y: "30%", size: "2px", dur: "3.8s", delay: "2.8s" },
  { x: "60%", y: "28%", size: "2px", dur: "4.2s", delay: "1.2s" },
];

const PageHero = ({ title, subtitle, icon, children, waveColor = "#faf8f5" }) => {
  return (
    <div className="page-hero">
      <div className="page-hero-bg" aria-hidden="true">
        {stars.map((s, i) => (
          <div
            key={i}
            className="ph-star"
            style={{
              left: s.x, top: s.y,
              width: s.size, height: s.size,
              animationDuration: s.dur,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      <div className="page-hero-overlay" aria-hidden="true" />

      <div className="container page-hero-content">
        {children}
        {icon && <div className="ph-icon">{icon}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="page-hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 92" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,46 C200,92 500,0 720,46 C940,92 1240,0 1440,46 L1440,92 L0,92 Z" fill={waveColor}/>
        </svg>
      </div>
    </div>
  );
};

export default PageHero;
