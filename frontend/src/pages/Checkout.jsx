import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { userAPI } from "../api";
import { useUserAuth } from "../context/UserAuthContext";
import "./Checkout.css";

const Checkout = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [showPaypal, setShowPaypal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/my-account");
  }, [user, authLoading]);

  useEffect(() => {
    document.body.style.overflow = showPaypal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showPaypal]);

  useEffect(() => {
    userAPI.getMyApplications()
      .then(({ data }) => {
        const app = data.find((a) => a._id === id);
        if (!app) navigate("/my-applications");
        else setApplication(app);
      })
      .catch(() => navigate("/my-applications"))
      .finally(() => setLoading(false));
  }, [id]);

  const trip = application?.trip;
  const isRemainingMode = application?.depositPaid === true;
  const tripPrice = trip?.price || 0;
  const alreadyPaid = application?.paidAmount || 0;
  const remainingAmount = Math.max(0, tripPrice - alreadyPaid);
  const minDeposit = tripPrice ? Math.round(tripPrice * 0.3) : 0;

  const finalAmount = isRemainingMode
    ? (customAmount && Number(customAmount) >= 1 ? Number(customAmount) : remainingAmount || 1)
    : (customAmount && Number(customAmount) >= minDeposit ? Number(customAmount) : minDeposit);

  const isValidAmount = isRemainingMode
    ? (!customAmount || Number(customAmount) >= 1)
    : (!customAmount || Number(customAmount) >= minDeposit);

  const createOrder = async () => {
    setError("");
    const { data } = await userAPI.createPaypalOrder(id, {
      amount: finalAmount,
      currency: "USD",
    });
    return data.orderId;
  };

  const onApprove = async (data) => {
    try {
      await userAPI.capturePaypalOrder(id, {
        orderId: data.orderID,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تأكيد الدفع، تواصل معنا");
    }
  };

  const onError = () => setError("حدث خطأ في PayPal، حاول مجدداً");

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  if (done) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <div className="checkout-success-icon">✅</div>
          <h2>{isRemainingMode ? "تم الدفع بنجاح!" : "تم الدفع بنجاح!"}</h2>
          <p>{isRemainingMode
            ? "تم تسجيل دفعتك، يمكنك مراجعة طلبك لمعرفة المبلغ المتبقي."
            : "تم تأكيد دفعك عبر PayPal وحُجز مقعدك تلقائياً."
          }</p>
          <Link to="/my-applications" className="btn btn-primary">العودة لطلباتي</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <Link to="/my-applications" className="checkout-back">← العودة لطلباتي</Link>
        <h1>{isRemainingMode ? "إكمال الدفع" : "دفع العربون"}</h1>

        {/* ملخص الرحلة */}
        <div className="checkout-trip-card">
          {trip?.coverImage && <img src={trip.coverImage} alt={trip.title} />}
          <div>
            <h3>{application?.tripTitle}</h3>
            <p>📍 {trip?.destination} &nbsp;|&nbsp; 🗓 {trip?.duration} أيام</p>
            <p>التاريخ المفضّل: {application?.preferredDate}</p>
          </div>
        </div>

        {/* تفاصيل الدفع */}
        <div className="checkout-payment-box">
          <h3>تفاصيل الدفع</h3>

          {isRemainingMode ? (
            <>
              <div className="checkout-amount-row">
                <span>المدفوع حتى الآن</span>
                <span className="checkout-amount">{alreadyPaid} {trip?.currency || "USD"}</span>
              </div>
              <div className="checkout-amount-row">
                <span>السعر الكلي للرحلة</span>
                <span className="checkout-amount">{tripPrice} {trip?.currency || "USD"}</span>
              </div>
              <div className="checkout-amount-row" style={{ color: "#16a34a", fontWeight: 700 }}>
                <span>المبلغ المتبقي</span>
                <span className="checkout-amount">{remainingAmount} {trip?.currency || "USD"}</span>
              </div>
              <div className="checkout-custom-amount">
                <label>المبلغ الذي ستدفعه الآن</label>
                <div className="amount-input-wrapper">
                  <input
                    type="number"
                    min={1}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`${remainingAmount} (المتبقي كاملاً)`}
                  />
                  <span className="amount-currency">{trip?.currency || "USD"}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="checkout-amount-row">
                <span>الحد الأدنى للعربون (30%)</span>
                <span className="checkout-amount">{minDeposit} USD</span>
              </div>
              <div className="checkout-custom-amount">
                <label>المبلغ الذي ستدفعه</label>
                <div className="amount-input-wrapper">
                  <input
                    type="number"
                    min={minDeposit}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`${minDeposit} (الحد الأدنى)`}
                  />
                  <span className="amount-currency">USD</span>
                </div>
                {customAmount && !isValidAmount && (
                  <p className="amount-error">⚠️ المبلغ يجب أن يكون {minDeposit} USD على الأقل</p>
                )}
                {isValidAmount && customAmount && Number(customAmount) > minDeposit && (
                  <p className="amount-extra">✅ ستدفع {Number(customAmount) - minDeposit} USD إضافية من السعر الكلي</p>
                )}
              </div>
            </>
          )}

          <div className="checkout-total-row">
            <span>المبلغ الإجمالي</span>
            <strong>{finalAmount} {trip?.currency || "USD"}</strong>
          </div>
        </div>

        {error && <p className="auth-error" style={{ margin: "12px 0" }}>{error}</p>}

        <button
          className="checkout-pay-btn"
          onClick={() => setShowPaypal(true)}
          disabled={!isValidAmount}
        >
          💳 ادفع الآن — {finalAmount} USD
        </button>

        {/* PayPal Modal */}
        {showPaypal && (
          <div className="paypal-modal-overlay" onClick={() => setShowPaypal(false)}>
            <div className="paypal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="paypal-modal-header">
                <h3>الدفع عبر PayPal</h3>
                <button className="paypal-modal-close" onClick={() => setShowPaypal(false)}>✕</button>
              </div>
              <p className="paypal-modal-amount">المبلغ: <strong>{finalAmount} USD</strong></p>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", label: "pay" }}
                createOrder={createOrder}
                onApprove={(data) => { setShowPaypal(false); onApprove(data); }}
                onError={() => { setShowPaypal(false); onError(); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
