import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userAPI } from "../api";
import { useUserAuth } from "../context/UserAuthContext";
import "./MyApplications.css";
import PageHero from "../components/PageHero";

const STATUS_MAP = {
  pending: { label: "قيد المراجعة", color: "#d97706", bg: "#fef3c7" },
  reviewed: { label: "تمت المراجعة", color: "#2563eb", bg: "#dbeafe" },
  accepted: { label: "مقبول ✅", color: "#16a34a", bg: "#dcfce7" },
  rejected: { label: "مرفوض", color: "#dc2626", bg: "#fee2e2" },
  payment_pending: { label: "في انتظار تأكيد الدفع", color: "#7c3aed", bg: "#ede9fe" },
  confirmed: { label: "مسجّل رسمياً 🎉", color: "#065f46", bg: "#d1fae5" },
};

const MyApplications = () => {
  const { user, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/my-account");
  }, [user, authLoading]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getMyApplications()
      .then(({ data }) => setApplications(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getDeadlineInfo = (app) => {
    const dates = app.trip?.availableDates;
    if (!dates?.length) return null;
    const now = new Date();
    const upcoming = dates
      .map((d) => new Date(d.startDate))
      .filter((d) => d > now)
      .sort((a, b) => a - b);
    if (!upcoming.length) return null;
    const deadline = new Date(upcoming[0]);
    deadline.setDate(deadline.getDate() - 15);
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return { date: formatDate(deadline), daysLeft };
  };

  return (
    <div className="my-apps-page">
      <PageHero title="طلباتي" subtitle={`أهلاً ${user?.fullName?.split(" ")[0]} — هنا تجد كل طلباتك`} icon="📋" />
      <div className="container my-apps-body">

        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : applications.length === 0 ? (
          <div className="no-apps">
            <p>لا يوجد لديك طلبات مسجّلة بهذا الإيميل.</p>
            <Link to="/trips" className="btn btn-primary">تصفّح الرحلات</Link>
          </div>
        ) : (
          <div className="apps-list">
            {applications.map((app) => {
              const s = STATUS_MAP[app.status] || STATUS_MAP.pending;
              return (
                <div key={app._id} className="app-card">
                  {app.trip?.coverImage && (
                    <img src={app.trip.coverImage} alt={app.trip.title} className="app-card-img" />
                  )}
                  <div className="app-card-body">
                    <div className="app-card-top">
                      <h3>{app.tripTitle}</h3>
                      <span className="app-status" style={{ color: s.color, background: s.bg }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="app-meta">
                      📍 {app.trip?.destination} &nbsp;|&nbsp; 🗓 التاريخ: {app.preferredDate}
                    </p>
                    <p className="app-date">تاريخ التقديم: {formatDate(app.createdAt)}</p>

                    {app.adminNotes && (
                      <p className="app-note">💬 {app.adminNotes}</p>
                    )}

                    {app.status === "rejected" && (
                      <p className="app-rejected-msg">نشكر اهتمامك، يمكنك التقديم على رحلة أخرى.</p>
                    )}

                    {app.status === "accepted" && !app.depositPaid && (
                      <Link to={`/checkout/${app._id}`} className="btn btn-primary checkout-btn">
                        💳 دفع العربون
                      </Link>
                    )}

                    {app.status === "accepted" && app.depositPaid && (() => {
                      const tripPrice = app.trip?.price || 0;
                      const paid = app.paidAmount || 0;
                      const remaining = Math.max(0, tripPrice - paid);
                      const deadline = getDeadlineInfo(app);
                      return (
                        <div className="deposit-receipt">
                          <div className="deposit-receipt-header">
                            <span className="deposit-receipt-icon">✅</span>
                            <span>تم استلام العربون وحُجز مقعدك</span>
                          </div>
                          <div className="deposit-receipt-row">
                            <span>المدفوع حتى الآن</span>
                            <strong>{paid} {app.paidCurrency || "USD"}</strong>
                          </div>
                          {tripPrice > 0 && (
                            <div className="deposit-receipt-row">
                              <span>السعر الكلي للرحلة</span>
                              <strong>{tripPrice} {app.trip?.currency || "USD"}</strong>
                            </div>
                          )}
                          {remaining > 0 && (
                            <>
                              <div className="deposit-receipt-row deposit-receipt-remaining">
                                <span>المبلغ المتبقي</span>
                                <strong>{remaining} {app.trip?.currency || "USD"}</strong>
                              </div>
                              {deadline && (
                                <p className="deposit-deadline" style={{ color: deadline.daysLeft <= 7 ? "#dc2626" : "#d97706" }}>
                                  ⏰ آخر موعد للدفع: {deadline.date}
                                  {deadline.daysLeft > 0 ? ` (${deadline.daysLeft} يوم متبقي)` : " (انتهى الموعد)"}
                                </p>
                              )}
                              <Link to={`/checkout/${app._id}`} className="btn btn-primary checkout-btn" style={{ marginTop: "12px" }}>
                                💳 أكمل الدفع
                              </Link>
                            </>
                          )}
                          {app.fullyPaid && (
                            <p className="fully-paid-msg">🎉 تم إكمال الدفع بالكامل!</p>
                          )}
                        </div>
                      );
                    })()}

                    {app.status === "payment_pending" && (
                      <p className="payment-pending-msg">✅ تم استلام تأكيدك، جاري المراجعة من الفريق.</p>
                    )}

                    {app.status === "confirmed" && (
                      <p className="confirmed-msg">🎉 مبروك! أنت مسجّل رسمياً في الرحلة.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
