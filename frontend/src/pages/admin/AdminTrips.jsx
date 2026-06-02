// src/pages/admin/AdminTrips.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tripsAPI, applicationsAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import "./AdminStyles.css";

const STATUS_MAP = {
  pending:  { label: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©", color: "#f59e0b", bg: "#fffbeb" },
  accepted: { label: "ØªÙ… Ø§Ù„Ù‚Ø¨ÙˆÙ„",    color: "#16a34a", bg: "#f0fdf4" },
  rejected: { label: "ØªÙ… Ø§Ù„Ø±ÙØ¶",     color: "#dc2626", bg: "#fef2f2" },
};

const APP_FOLDERS = [
  { key: "pending",  label: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©", emoji: "ðŸ•" },
  { key: "accepted", label: "ØªÙ… Ø§Ù„Ù‚Ø¨ÙˆÙ„",    emoji: "âœ…" },
  { key: "rejected", label: "ØªÙ… Ø§Ù„Ø±ÙØ¶",     emoji: "âŒ" },
];

const STATUSES_NEED_REASON = ["rejected"];

const fmtDate = (d) => {
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// â”€â”€ Client Notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ClientNotesSection = ({ app, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(app.clientNotes || "");
  const [saving, setSaving]   = useState(false);

  useEffect(() => { setDraft(app.clientNotes || ""); setEditing(false); }, [app._id]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="app-detail-section client-notes-section">
      <div className="client-notes-header">
        <div className="detail-label">ðŸ“ Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø¹Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„ <span className="optional-tag">(Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</span></div>
        {!editing && (
          <button className="client-notes-edit-btn" onClick={() => setEditing(true)}>
            {app.clientNotes ? "ØªØ¹Ø¯ÙŠÙ„" : "+ Ø¥Ø¶Ø§ÙØ©"}
          </button>
        )}
      </div>
      {editing ? (
        <div className="client-notes-editor">
          <textarea
            className="status-reason-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ù…Ø«Ø§Ù„: Ù„Ø¯ÙŠÙ‡ Ø­Ø³Ø§Ø³ÙŠØ© Ù…Ù† Ø§Ù„Ù…ÙƒØ³Ø±Ø§Øª..."
            rows={4} autoFocus
          />
          <div className="status-reason-actions">
            <button className="btn-reason-confirm" style={{ background: "#0ea5e9" }} onClick={handleSave} disabled={saving}>
              {saving ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : "Ø­ÙØ¸ Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø©"}
            </button>
            <button className="btn btn-secondary" onClick={() => { setDraft(app.clientNotes || ""); setEditing(false); }}>
              Ø¥Ù„ØºØ§Ø¡
            </button>
          </div>
        </div>
      ) : app.clientNotes ? (
        <div className="client-notes-display">{app.clientNotes}</div>
      ) : (
        <div className="client-notes-empty">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø¨Ø¹Ø¯</div>
      )}
    </div>
  );
};

// â”€â”€ Assign Date Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AssignDateSection = ({ app, availableDates = [], onAssign }) => {
  const fmt = (d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`; };
  const [selectedId, setSelectedId] = useState(app.selectedDateId || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSelectedId(app.selectedDateId || ""); }, [app._id, app.selectedDateId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    if (selectedId === "__unset__") {
      await onAssign(app._id, "__unset__", "ØºÙŠØ± Ù…ØªØ£ÙƒØ¯");
    } else {
      const date = availableDates.find((d) => d._id === selectedId);
      if (!date) { setSaving(false); return; }
      await onAssign(app._id, selectedId, `${fmt(date.startDate)} - ${fmt(date.endDate)}`);
    }
    setSaving(false);
  };

  const currentLabel = app.preferredDate || "ØºÙŠØ± Ù…Ø­Ø¯Ø¯";
  const isAssigned = !!app.selectedDateId;
  const hasPaid = app.depositPaid;

  return (
    <div className="app-detail-section">
      <div className="detail-label">
        ðŸ“… Ø§Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ÙØ¶Ù‘Ù„
        {isAssigned && <span style={{ marginRight: "8px", background: "#dcfce7", color: "#16a34a", fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>Ù…ÙØ¹ÙŠÙŽÙ‘Ù†</span>}
      </div>
      <div className="detail-value" style={{ marginBottom: hasPaid ? "6px" : "10px", color: isAssigned ? "#16a34a" : "#f59e0b", fontWeight: isAssigned ? 700 : 400 }}>
        {currentLabel}
      </div>
      {hasPaid && (
        <div style={{ marginBottom: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px 12px", fontSize: "0.83rem", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ color: "#15803d", fontWeight: 700 }}>ðŸ’³ Ù…Ø¯ÙÙˆØ¹: {app.paidAmount} {app.paidCurrency || "USD"}</span>
          {!app.fullyPaid && app.trip?.price && (
            <span style={{ color: "#b45309" }}>Ù…ØªØ¨Ù‚ÙŠ: {Math.max(0, app.trip.price - app.paidAmount)} {app.paidCurrency || "USD"}</span>
          )}
          {app.fullyPaid && <span style={{ color: "#15803d" }}>âœ… Ù…ÙƒØªÙ…Ù„ Ø§Ù„Ø¯ÙØ¹</span>}
        </div>
      )}
      {availableDates.length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.88rem", background: "#fff" }}
          >
            <option value="">â€” Ø§Ø®ØªØ± â€”</option>
            <option value="__unset__">â“ ØºÙŠØ± Ù…ØªØ£ÙƒØ¯</option>
            {availableDates.map((d) => (
              <option key={d._id} value={d._id}>
                {fmt(d.startDate)} â€” {fmt(d.endDate)} ({d.spotsTotal} Ù…Ù‚Ø¹Ø¯)
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={!selectedId || saving || (selectedId !== "__unset__" && selectedId === app.selectedDateId?.toString()) || (selectedId === "__unset__" && !app.selectedDateId)}
            style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 14px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap", opacity: (!selectedId || saving || selectedId === app.selectedDateId) ? 0.5 : 1 }}
          >
            {saving ? "..." : "ØªØ¹ÙŠÙŠÙ†"}
          </button>
        </div>
      )}
    </div>
  );
};

// â”€â”€ Trip Detail Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TripDetail = ({ trip, applications, onDelete, isSuper }) => {
  const tripApps = applications.filter(
    (a) => (a.trip?._id || a.trip) === trip._id
  );
  const confirmedCount = tripApps.filter((a) => a.depositPaid).length;
  const pendingCount   = tripApps.filter((a) => a.status === "pending").length;

  return (
    <div className="trip-detail-panel">
      {/* Header */}
      <div className="trip-detail-header">
        <div>
          <h2 className="trip-detail-title">{trip.title}</h2>
          <div className="trip-detail-meta">
            <span>ðŸ“ {trip.destination}</span>
            <span>ðŸ—“ {trip.duration} Ø£ÙŠØ§Ù…</span>
            <span>ðŸ’° {trip.price} {trip.currency}</span>
            <span className={`badge ${trip.isActive ? "badge-success" : "badge-inactive"}`}>
              {trip.isActive ? "Ù†Ø´Ø·Ø©" : "Ù…Ø®ÙÙŠØ©"}
            </span>
            {trip.isFeatured && <span className="badge badge-primary">Ù…Ù…ÙŠØ²Ø©</span>}
          </div>
        </div>
        <div className="trip-detail-actions">
          <Link to={`/admin/trips/${trip._id}/stats`} className="btn-action" style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
            ðŸ“Š Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª
          </Link>
          {isSuper && (
            <>
              <Link to={`/admin/trips/edit/${trip._id}`} className="btn-action btn-edit">
                ØªØ¹Ø¯ÙŠÙ„
              </Link>
              <button className="btn-action btn-delete" onClick={() => onDelete(trip._id)}>
                Ø­Ø°Ù
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="trip-detail-stats">
        <div className="trip-ds-item">
          <span className="trip-ds-num">{tripApps.length}</span>
          <span className="trip-ds-label">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø·Ù„Ø¨Ø§Øª</span>
        </div>
        <div className="trip-ds-item" style={{ color: pendingCount > 0 ? "#f59e0b" : undefined }}>
          <span className="trip-ds-num">{pendingCount}</span>
          <span className="trip-ds-label">Ø·Ù„Ø¨Ø§Øª Ø¬Ø¯ÙŠØ¯Ø©</span>
        </div>
        <div className="trip-ds-item" style={{ color: "#16a34a" }}>
          <span className="trip-ds-num">{confirmedCount}</span>
          <span className="trip-ds-label">Ø¯ÙØ¹ÙˆØ§ Ø§Ù„Ø¹Ø±Ø¨ÙˆÙ†</span>
        </div>
      </div>

      {/* Available Dates */}
      {trip.availableDates?.length > 0 && (
        <div className="trip-detail-section">
          <div className="trip-detail-section-title">ðŸ“… Ø§Ù„ØªÙˆØ§Ø±ÙŠØ® Ø§Ù„Ù…ØªØ§Ø­Ø©</div>
          <div className="trip-dates-list">
            {trip.availableDates.map((d, i) => {
              const dateLabel = `${fmtDate(d.startDate)} - ${fmtDate(d.endDate)}`;
              const taken    = tripApps.filter((a) => a.preferredDate === dateLabel && a.status === "accepted" && a.depositPaid).length;
              const total    = d.spotsTotal || 0;
              const avail    = total - taken;
              const pct      = total > 0 ? Math.round((taken / total) * 100) : 0;
              const isPast   = new Date(d.endDate) < new Date();
              const isFull   = avail <= 0;
              return (
                <div key={i} className={`trip-date-row ${isPast ? "trip-date-row--past" : ""} ${isFull ? "trip-date-row--full" : ""}`}>
                  <div className="trip-date-range">
                    <span className="trip-date-label">{fmtDate(d.startDate)} â€” {fmtDate(d.endDate)}</span>
                    {isPast && <span className="trip-date-tag trip-date-tag--past">Ù…Ù†ØªÙ‡ÙŠ</span>}
                    {isFull && !isPast && <span className="trip-date-tag trip-date-tag--full">Ù…ÙƒØªÙ…Ù„</span>}
                  </div>
                  <div className="trip-date-spots">
                    <div className="trip-spots-bar">
                      <div className="trip-spots-fill" style={{ width: `${pct}%`, background: isFull ? "#dc2626" : pct > 70 ? "#f59e0b" : "#16a34a" }} />
                    </div>
                    <span className="trip-spots-text">
                      <strong style={{ color: isFull ? "#dc2626" : "#16a34a" }}>{taken}</strong>
                      <span style={{ color: "#a0aec0" }}> / {total} ðŸ’³</span>
                      {!isFull && <span style={{ color: "#a0aec0", marginRight: "6px" }}>({avail} Ù…ØªØ§Ø­)</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Short description */}
      {trip.shortDescription && (
        <div className="trip-detail-section">
          <div className="trip-detail-section-title">ðŸ“ ÙˆØµÙ Ù…Ø®ØªØµØ±</div>
          <p style={{ fontSize: "0.9rem", color: "#4a5568", lineHeight: 1.8, margin: 0 }}>{trip.shortDescription}</p>
        </div>
      )}
    </div>
  );
};

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    if (!window.confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ø±Ø­Ù„Ø©ØŸ")) return;
    try {
      await tripsAPI.delete(id);
      setTrips((prev) => prev.filter((t) => t._id !== id));
      if (selectedTrip?._id === id) setSelectedTrip(null);
    } catch { alert("ÙØ´Ù„ Ø­Ø°Ù Ø§Ù„Ø±Ø­Ù„Ø©"); }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          Ø§Ù„Ø±Ø­Ù„Ø§Øª
          {pendingCount > 0 && <span className="tab-badge" style={{ marginRight: "10px", background: "#f59e0b" }}>{pendingCount} Ø·Ù„Ø¨ Ø¬Ø¯ÙŠØ¯</span>}
        </h1>
      </div>

      <div className="trips-master-detail">

          {/* List */}
          <div className="trips-list-col">
            <div className="trips-list-header">
              <span>Ø§Ù„Ø±Ø­Ù„Ø§Øª ({trips.length})</span>
              {isSuper && (
                <Link to="/admin/trips/new" className="btn btn-primary" style={{ padding: "7px 16px", fontSize: "0.85rem" }}>
                  + Ø¬Ø¯ÙŠØ¯Ø©
                </Link>
              )}
            </div>

            {tripsLoading ? (
              <div className="page-loading"><div className="spinner" /></div>
            ) : trips.length === 0 ? (
              <div className="admin-empty" style={{ padding: "40px 20px" }}>
                <p>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø±Ø­Ù„Ø§Øª.</p>
              </div>
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
                        <span className="trip-list-item-dest">ðŸ“ {trip.destination}</span>
                      </div>
                      <div className="trip-list-item-badges">
                        <span className={`trip-list-badge ${trip.isActive ? "trip-list-badge--active" : "trip-list-badge--hidden"}`}>
                          {trip.isActive ? "Ù†Ø´Ø·Ø©" : "Ù…Ø®ÙÙŠØ©"}
                        </span>
                        {tripPending > 0 && (
                          <span className="trip-list-badge trip-list-badge--pending">{tripPending} Ø¬Ø¯ÙŠØ¯</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="trips-detail-col">
            {!selectedTrip ? (
              <div className="trips-detail-empty">
                <div className="trips-detail-empty-icon">âœˆï¸</div>
                <p>Ø§Ø®ØªØ± Ø±Ø­Ù„Ø© Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ù„Ø¹Ø±Ø¶ ØªÙØ§ØµÙŠÙ„Ù‡Ø§</p>
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
