import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { galleryAPI } from "../api";
import { getCropImgStyle } from "../utils/cropStyle";
import "./Gallery.css";

const SPEED     = 0.5;
const STRIDE_LG = 420;
const STRIDE_SM = 296;

const PARTICLES = [
  { size: 12, top: "18%", left: "8%",  dur: "6s",  delay: "0s"   },
  { size: 8,  top: "65%", left: "14%", dur: "8s",  delay: "1.4s" },
  { size: 16, top: "30%", left: "78%", dur: "7s",  delay: "0.7s" },
  { size: 10, top: "72%", left: "85%", dur: "5.5s",delay: "2.1s" },
  { size: 6,  top: "12%", left: "52%", dur: "9s",  delay: "3s"   },
  { size: 14, top: "55%", left: "44%", dur: "6.5s",delay: "1s"   },
  { size: 9,  top: "40%", left: "92%", dur: "7.5s",delay: "2.8s" },
  { size: 7,  top: "80%", left: "60%", dur: "8.5s",delay: "0.4s" },
];

export default function Gallery() {
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(true);

  const trackRef   = useRef(null);
  const vpRef      = useRef(null);
  const offset     = useRef(0);
  const paused     = useRef(false);
  const navigating = useRef(false);
  const dragging   = useRef(false);
  const drag       = useRef({ x: 0, base: 0 });
  const raf        = useRef(null);
  const navTimer   = useRef(null);
  const meta       = useRef({ N: 0, stride: STRIDE_LG, loopW: 0 });

  const docMove = useRef(null);
  const docUp   = useRef(null);

  useEffect(() => {
    galleryAPI.getAll()
      .then(({ data }) => setPhotos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!photos.length) return;
    const s  = window.innerWidth < 768 ? STRIDE_SM : STRIDE_LG;
    const N  = photos.length;
    meta.current = { N, stride: s, loopW: N * s };
    offset.current = N * s;
    applyMove(false);

    const tick = () => {
      if (!paused.current && !navigating.current && !dragging.current) {
        offset.current -= SPEED;
        wrap();
        applyMove(false);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [photos]); // eslint-disable-line

  function applyMove(animated) {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animated
      ? "transform 0.42s cubic-bezier(0.4,0,0.2,1)"
      : "none";
    el.style.transform = `translateX(${-offset.current}px)`;
  }

  function wrap() {
    const { loopW } = meta.current;
    if (!loopW) return;
    while (offset.current < loopW)        offset.current += loopW;
    while (offset.current >= 2 * loopW)   offset.current -= loopW;
  }

  function navigate(dir) {
    clearTimeout(navTimer.current);
    navigating.current = true;
    const { stride, loopW } = meta.current;
    if (window.innerWidth < 768) {
      offset.current = Math.round(offset.current / stride) * stride;
    }
    offset.current -= dir * stride;
    if (offset.current < 0)            offset.current += loopW;
    if (offset.current >= 3 * loopW)   offset.current -= loopW;
    applyMove(true);
    navTimer.current = setTimeout(() => {
      wrap();
      applyMove(false);
      navigating.current = false;
    }, 450);
  }

  function onMouseEnter() { paused.current = true; }
  function onMouseLeave() { paused.current = false; }

  function onMouseDown(e) {
    paused.current   = true;
    dragging.current = true;
    drag.current = { x: e.clientX, base: offset.current };
    if (vpRef.current) vpRef.current.style.cursor = "grabbing";
    e.preventDefault();

    docMove.current = (ev) => {
      offset.current = drag.current.base + (drag.current.x - ev.clientX);
      wrap();
      applyMove(false);
    };
    docUp.current = () => {
      dragging.current = false;
      paused.current   = false;
      if (vpRef.current) vpRef.current.style.cursor = "grab";
      document.removeEventListener("mousemove", docMove.current);
      document.removeEventListener("mouseup",   docUp.current);
    };
    document.addEventListener("mousemove", docMove.current);
    document.addEventListener("mouseup",   docUp.current);
  }

  function onTouchStart(e) {
    paused.current   = true;
    dragging.current = true;
    drag.current = { x: e.touches[0].clientX, base: offset.current };
  }

  function onTouchMove(e) {
    if (!dragging.current) return;
    offset.current = drag.current.base + (drag.current.x - e.touches[0].clientX);
    wrap();
    applyMove(false);
  }

  function onTouchEnd() {
    dragging.current = false;
    paused.current   = false;
  }

  if (loading) return (
    <div className="gp gp--loading"><div className="spinner" /></div>
  );

  if (!photos.length) return (
    <div className="gp gp--empty"><p>لا توجد صور في المعرض بعد</p></div>
  );

  const tripled = [...photos, ...photos, ...photos];

  return (
    <div className="gp">

      {/* ── Hero ── */}
      <div className="gp-hero">
        <div className="gp-hero__particles" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="gp-particle"
              style={{
                width:  p.size,
                height: p.size,
                top:    p.top,
                left:   p.left,
                animationDuration:  p.dur,
                animationDelay:     p.delay,
              }}
            />
          ))}
        </div>

<h1 className="gp-hero__title">معرض رُحى</h1>
        <p  className="gp-hero__sub">
          مقتطفات من رحلات رُحى السابقه ...
        </p>

        <div className="gp-hero__tags" aria-hidden="true">
          <span>تطوع حقيقي 🤝</span>
          <span>ثقافة واندماج 🌍</span>
        </div>
      </div>

      {/* ── Slider ── */}
      <div
        ref={vpRef}
        className="gp-vp"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="gp-fade gp-fade--r" />
        <div className="gp-fade gp-fade--l" />

        <button
          className="gp-arrow gp-arrow--r"
          onClick={() => navigate(-1)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="السابق"
        >‹</button>
        <button
          className="gp-arrow gp-arrow--l"
          onClick={() => navigate(1)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="التالي"
        >›</button>

        <div className="gp-track" ref={trackRef}>
          {tripled.map((photo, i) => (
            <div
              key={`${photo._id}-${i}`}
              className="gp-slide"
              draggable={false}
            >
              <img
                src={photo.imageUrl}
                alt={photo.title || "صورة من رحلة"}
                draggable={false}
                referrerPolicy="no-referrer"
                style={getCropImgStyle(photo.cropArea)}
              />
              <div className="gp-slide__shine" />
              {photo.title && (
                <div className="gp-slide__cap">{photo.title}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quote ── */}
      <section className="gp-quote">
        <div className="gp-quote__bg" aria-hidden="true" />
        <div className="gp-quote__inner">
          <div className="gp-quote__mark">"</div>
          <p className="gp-quote__text">
            ما تحتاج تزور العالم كله عشان تفهم قيمة رحلة واحدة حقيقية — رحلة واحدة لإيطاليا كمتطوع غيّرت نظرتي للسفر، وهذا سبب وجود رُحى
          </p>
          <div className="gp-quote__line" />
          <span className="gp-quote__author">— مؤسس رُحى</span>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="gp-cta">
        <div className="gp-cta__deco" aria-hidden="true">
          <div className="gp-cta__circle gp-cta__circle--1" />
          <div className="gp-cta__circle gp-cta__circle--2" />
        </div>
        <div className="gp-cta__inner">
          <div className="gp-cta__emoji">✈️</div>
          <h2 className="gp-cta__title">كن من أوائل المسافرين مع رُحى</h2>
          <p className="gp-cta__sub">رُحى مشروع في بدايته — وهذا بالضبط ما يميّزه. أنت ما رح تكون زبون، رح تكون جزء من القصة</p>
          <div className="gp-cta__actions">
            <Link to="/trips" className="btn btn-primary gp-cta__btn">
              اكتشف الرحلات
            </Link>
            <Link to="/register" className="gp-cta__link">
              سجّل اهتمامك وكن من الأوائل ←
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
