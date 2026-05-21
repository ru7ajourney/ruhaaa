// src/pages/TripDetail.jsx
// صفحة تفاصيل الرحلة الكاملة

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { tripsAPI } from "../api";
import "./TripDetail.css";

const TripDetail = () => {
  const { slug } = useParams(); // الـ slug من الرابط
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data } = await tripsAPI.getBySlug(slug);
        setTrip(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("الرحلة غير موجودة");
        } else {
          setError("حدث خطأ أثناء تحميل الرحلة");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [slug]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("ar-SA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: "60px 24px" }}>
        <div className="error-msg">{error}</div>
        <Link to="/trips" className="btn btn-primary" style={{ marginTop: 16 }}>
          العودة للرحلات
        </Link>
      </div>
    );
  }

  return (
    <div className="trip-detail">
      {/* ==============================
          Hero - صورة الرحلة
          ============================== */}
      <div className="trip-detail-hero">
        <img src={trip.coverImage} alt={trip.title} />
        <div className="trip-detail-hero-overlay" />
        <div className="container trip-detail-hero-content">
          <Link to="/trips" className="back-link">
            ← العودة للرحلات
          </Link>
          <h1>{trip.title}</h1>
          <div className="trip-detail-meta">
            <span>📍 {trip.destination}</span>
            <span>🗓 {trip.duration} أيام</span>
            <span>💰 {trip.price} {trip.currency}</span>
          </div>
        </div>
      </div>

      <div className="container trip-detail-body">
        <div className="trip-detail-grid">
          {/* ==============================
              العمود الرئيسي - المحتوى
              ============================== */}
          <div className="trip-detail-main">
            {/* الوصف */}
            <section className="detail-section">
              <h2>عن الرحلة</h2>
              <p className="trip-full-desc">{trip.description}</p>
            </section>

            {/* البرنامج اليومي */}
            {trip.program?.length > 0 && (
              <section className="detail-section">
                <h2>البرنامج اليومي</h2>
                <div className="program-list">
                  {trip.program.map((day) => (
                    <div key={day._id} className="program-day">
                      <div className="day-number">يوم {day.day}</div>
                      <div className="day-content">
                        <h4>{day.title}</h4>
                        <p>{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* يشمل / لا يشمل */}
            <section className="detail-section includes-section">
              {trip.includes?.length > 0 && (
                <div className="includes-col">
                  <h3 className="includes-title">✅ السعر يشمل</h3>
                  <ul>
                    {trip.includes.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {trip.excludes?.length > 0 && (
                <div className="includes-col">
                  <h3 className="excludes-title">❌ السعر لا يشمل</h3>
                  <ul>
                    {trip.excludes.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* ==============================
              العمود الجانبي - الحجز
              ============================== */}
          <aside className="trip-detail-sidebar">
            <div className="booking-card">
              <div className="booking-price">
                <span className="big-price">{trip.price}</span>
                <span className="price-unit">{trip.currency} / شخص</span>
              </div>

              {/* التواريخ المتاحة */}
              <div className="booking-dates">
                <h4>التواريخ المتاحة</h4>
                {trip.availableDates?.filter(
                  (d) => new Date(d.startDate) > new Date()
                ).length > 0 ? (
                  trip.availableDates
                    .filter((d) => new Date(d.startDate) > new Date())
                    .map((date, i) => (
                      <div key={i} className="date-item">
                        <div className="date-range">
                          {formatDate(date.startDate)} — {formatDate(date.endDate)}
                        </div>
                        <div className="spots-left">
                          {date.spotsTotal - date.spotsTaken} مكان متبقي
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="no-dates">لا توجد تواريخ متاحة حالياً</p>
                )}
              </div>

              {/* زر التسجيل */}
              <Link
                to={`/register?trip=${trip._id}`}
                className="btn btn-primary booking-btn"
              >
                📝 سجّل في هذه الرحلة
              </Link>
              <p className="booking-note">
                لا تدفع الآن — سنتواصل معك لتأكيد التفاصيل
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
