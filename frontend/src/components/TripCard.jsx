// src/components/TripCard.jsx
// بطاقة عرض الرحلة الواحدة

import { Link } from "react-router-dom";
import "./TripCard.css";

const TripCard = ({ trip }) => {
  return (
    <Link to={`/trips/${trip.slug}`} className="trip-card">
      {/* صورة الرحلة */}
      <div className="trip-card-image">
        <img
          src={trip.coverImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600"}
          alt={trip.title}
          loading="lazy"
        />
        {trip.isFeatured && (
          <span className="trip-card-badge">مميزة ⭐</span>
        )}
      </div>

      {/* محتوى البطاقة */}
      <div className="trip-card-body">
        {/* الوجهة والمدة */}
        <div className="trip-card-meta">
          <span className="trip-destination">📍 {trip.destination}</span>
          <span className="trip-duration">🗓 {trip.duration} أيام</span>
        </div>

        {/* العنوان */}
        <h3 className="trip-card-title">{trip.title}</h3>

        {/* الوصف المختصر */}
        <p className="trip-card-desc">{trip.shortDescription}</p>

        {/* السعر */}
        <div className="trip-card-footer">
          <div className="trip-price">
            <span className="price-amount">{trip.price}</span>
            <span className="price-currency">{trip.currency}</span>
          </div>
        </div>

        {/* زر التفاصيل */}
        <div className="trip-card-cta">
          <span className="btn btn-primary">اعرف أكثر ←</span>
        </div>
      </div>
    </Link>
  );
};

export default TripCard;
