// src/pages/Trips.jsx
// صفحة عرض كل الرحلات

import { useState, useEffect } from "react";
import { tripsAPI } from "../api";
import TripCard from "../components/TripCard";
import "./Trips.css";

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data } = await tripsAPI.getAll();
        setTrips(data);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الرحلات. حاول مرة أخرى.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  return (
    <div className="trips-page">
      {/* Header */}
      <div className="trips-header">
        <div className="container">
          <h1>رحلاتنا</h1>
          <p>اكتشف كل الوجهات المتاحة مع رُحى</p>
        </div>
      </div>

      {/* المحتوى */}
      <div className="container trips-content">
        {loading ? (
          <div className="page-loading">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="error-msg">{error}</div>
        ) : trips.length === 0 ? (
          <div className="no-trips-msg">
            <p>لا توجد رحلات متاحة حالياً. تابعنا قريباً! 🌍</p>
          </div>
        ) : (
          <>
            <p className="trips-count">
              {trips.length} رحلة متاحة
            </p>
            <div className="trips-grid-page">
              {trips.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Trips;
