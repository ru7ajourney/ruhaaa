import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tripsAPI, applicationsAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

const fmtDate = (d) => {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
};

const TripDetail = ({ trip, applications, onDelete, isSuper }) => {
  const tripApps      = applications.filter((a) => (a.trip?._id || a.trip) === trip._id);
  const confirmedCount = tripApps.filter((a) => a.depositPaid).length;
  const pendingCount   = tripApps.filter((a) => a.status === "pending").length;

  return (
    <div className="trip-detail-panel">
      <div className="trip-detail-header">
        <div>
          <h2 className="trip-detail-title">{trip.title}</h2>
          <div className="trip-detail-meta">
            <span>📍 {trip.destination}</span>
            <span>🗓 {trip.duration} أيام</span>
            <span>💰 {trip.price} {trip.currency}</span>
            <span className={`badge ${trip.isActive ? "badge-success" : "badge-inactive"}`}>
              {trip.isActive ? "نشطة" : "مخفية"}
            </span>
            {trip.isFeatured && <span className="badge badge-primary">مميزة</span>}
          </div>
        </div>
        <div className="trip-detail-actions">
          <Link to={`/admin/trips/${trip._id}/stats`} className="btn-action"
            style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
            📊 إحصائيات
          </Link>
          {isSuper && (
            <>
              <Link to={`/admin/trips/edit/${trip._id}`} className="btn-action btn-edit">تعديل</Link>
              <button className="btn-action btn-delete" onClick={() => onDelete(trip._id)}>حذف</button>
            </>
          )}
        </div>
      </div>

      <div className="trip-detail-stats">
        <div className="trip-ds-item">
          <span className="trip-ds-num">{tripApps.length}</span>
          <span className="trip-ds-label">إجمالي الطلبات</span>
        </div>
        <div className="trip-ds-item" style={{ color: pendingCount > 0 ? "#f59e0b" : undefined }}>
          <span className="trip-ds-num">{pendingCount}</span>
          <span className="trip-ds-label">طلبات جديدة</span>
        </div>
        <div className="trip-ds-item" style={{ color: "#16a34a" }}>
          <span className="trip-ds-num">{confirmedCount}</span>
          <span className="trip-ds-label">دفعوا العربون</span>
        </div>
      </div>

      {trip.availableDates?.length > 0 && (
        <div className="trip-detail-section">
          <div className="trip-detail-section-title">📅 التواريخ المتاحة</div>
          <div className="trip-dates-list">
            {trip.availableDates.map((d, i) => {
              const dateLabel = `${fmtDate(d.startDate)} - ${fmtDate(d.endDate)}`;
              const taken = tripApps.filter((a) => a.preferredDate === dateLabel && a.status === "accepted" && a.depositPaid).length;
              const total = d.spotsTotal || 0;
              const avail = total - taken;
              const pct   = total > 0 ? Math.round((taken / total) * 100) : 0;
              const isPast = new Date(d.endDate) < new Date();
              const isFull = avail <= 0;
              return (
                <div key={i} className={`trip-date-row ${isPast ? "trip-date-row--past" : ""} ${isFull ? "trip-date-row--full" : ""}`}>
                  <div className="trip-date-range">
                    <span className="trip-date-label">{fmtDate(d.startDate)} — {fmtDate(d.endDate)}</span>
                    {isPast && <span className="trip-date-tag trip-date-tag--past">منتهي</span>}
                    {isFull && !isPast && <span className="trip-date-tag trip-date-tag--full">مكتمل</span>}
                  </div>
                  <div className="trip-date-spots">
                    <div className="trip-spots-bar">
                      <div className="trip-spots-fill" style={{ width: `${pct}%`, background: isFull ? "#dc2626" : pct > 70 ? "#f59e0b" : "#16a34a" }} />
                    </div>
                    <span className="trip-spots-text">
                      <strong style={{ color: isFull ? "#dc2626" : "#16a34a" }}>{taken}</strong>
                      <span style={{ color: "#a0aec0" }}> / {total} 💳</span>
                      {!isFull && <span style={{ color: "#a0aec0", marginRight: "6px" }}>({avail} متاح)</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {trip.shortDescription && (
        <div className="trip-detail-section">
          <div className="trip-detail-section-title">📝 وصف مختصر</div>
          <p style={{ fontSize: "0.9rem", color: "#4a5568", lineHeight: 1.8, margin: 0 }}>{trip.shortDescription}</p>
        </div>
      )}
    </div>
  );
};

const AdminTrips = () => {
  const { isSuper } = useAuth();
  const [trips, setTrips]               = useState([]);
  const [applications, setApplications] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    tripsAPI.getAdminAll()
      .then(({ data }) => setTrips(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setTripsLoading(false));

    applicationsAPI.getAll()
      .then(({ data }) => setApplications(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleDeleteTrip = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرحلة؟")) return;
    try {
      await tripsAPI.delete(id);
      setTrips((prev) => prev.filter((t) => t._id !== id));
      if (selectedTrip?._id === id) setSelectedTrip(null);
    } catch { alert("فشل حذف الرحلة"); }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          الرحلات
          {pendingCount > 0 && (
            <span className="tab-badge" style={{ marginRight: "10px", background: "#f59e0b" }}>
              {pendingCount} طلب جديد
            </span>
          )}
        </h1>
      </div>

      <div className="trips-master-detail">
        <div className="trips-list-col">
          <div className="trips-list-header">
            <span>الرحلات ({trips.length})</span>
            {isSuper && (
              <Link to="/admin/trips/new" className="btn btn-primary" style={{ padding: "7px 16px", fontSize: "0.85rem" }}>
                + جديدة
              </Link>
            )}
          </div>

          {tripsLoading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : trips.length === 0 ? (
            <div className="admin-empty" style={{ padding: "40px 20px" }}><p>لا توجد رحلات.</p></div>
          ) : (
            <div className="trips-list">
              {trips.map((trip) => {
                const tripPending = applications.filter(
                  (a) => (a.trip?._id || a.trip) === trip._id && a.status === "pending"
                ).length;
                return (
                  <button
                    key={trip._id}
                    className={`trip-list-item ${selectedTrip?._id === trip._id ? "trip-list-item--active" : ""}`}
                    onClick={() => setSelectedTrip((prev) => prev?._id === trip._id ? null : trip)}
                  >
                    <div className="trip-list-item-main">
                      <span className="trip-list-item-title">{trip.title}</span>
                      <span className="trip-list-item-dest">📍 {trip.destination}</span>
                    </div>
                    <div className="trip-list-item-badges">
                      <span className={`trip-list-badge ${trip.isActive ? "trip-list-badge--active" : "trip-list-badge--hidden"}`}>
                        {trip.isActive ? "نشطة" : "مخفية"}
                      </span>
                      {tripPending > 0 && (
                        <span className="trip-list-badge trip-list-badge--pending">{tripPending} جديد</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="trips-detail-col">
          {!selectedTrip ? (
            <div className="trips-detail-empty">
              <div className="trips-detail-empty-icon">✈️</div>
              <p>اختر رحلة من القائمة لعرض تفاصيلها</p>
            </div>
          ) : (
            <TripDetail
              trip={selectedTrip}
              applications={applications}
              onDelete={handleDeleteTrip}
              isSuper={isSuper}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTrips;
