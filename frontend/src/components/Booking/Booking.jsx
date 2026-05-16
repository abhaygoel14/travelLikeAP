import React, { useState, useContext, useEffect } from "react";
import "./booking.css";
import { Form, FormGroup, Button } from "reactstrap";
import { get, ref, update } from "firebase/database";
import { AuthContext } from "../../context/AuthContext";
import { formatPrice } from "../../utils/tourSchema";
import { auth, realtimeDb } from "../../utils/firebaseConfig";

const Booking = ({
  tour,
  avgRating,
  isCoupleMode = false,
  initialBooking = {},
  pricing = {},
}) => {
  const { price, title } = tour;

  const { user } = useContext(AuthContext);
  const today = new Date().toISOString().slice(0, 10);

  const [booking, setBooking] = useState({
    userId: user?.uid || user?._id || "",
    userEmail: user?.email || "",
    tourName: title,
    fullName: initialBooking.fullName || "",
    phone: "",
    guestSize: initialBooking.guestSize || 1,
    bookAt: initialBooking.bookAt || today,
    dateDisplay: initialBooking.dateDisplay || "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errors, setErrors] = useState({ fullName: "", phone: "" });

  const PAYU_MERCHANT_KEY = process.env.REACT_APP_PAYU_MERCHANT_KEY || "";
  const PAYU_MERCHANT_SALT = process.env.REACT_APP_PAYU_MERCHANT_SALT || "";
  const PAYU_PAYMENT_URL = "https://test.payu.in/_payment";

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug("PayU env:", {
        merchantKey: !!PAYU_MERCHANT_KEY,
        merchantSalt: !!PAYU_MERCHANT_SALT,
        paymentUrl: PAYU_PAYMENT_URL,
      });
    }
  }, [PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT, PAYU_PAYMENT_URL]);

  const indianPhonePattern = /^(?:\+91[\s-]?|0)?[6-9]\d{9}$/;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setBooking((prev) => ({ ...prev, [id]: value }));

    if (id === "phone") {
      const cleaned = String(value || "").trim();
      if (!cleaned) {
        setErrors((prev) => ({ ...prev, phone: "Mobile number is required." }));
      } else if (!indianPhonePattern.test(cleaned)) {
        setErrors((prev) => ({
          ...prev,
          phone: "Enter a valid 10-digit Indian mobile number.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    }

    if (id === "fullName") {
      setErrors((prev) => ({
        ...prev,
        fullName: String(value || "").trim() ? "" : "Full Name is required.",
      }));
    }
  };

  const serviceFee = Number(pricing.serviceFee ?? 10);
  const offerPrice = Number(pricing.offerPrice || price * booking.guestSize);
  const taxesAndFees = Number(pricing.taxesAndFees ?? serviceFee);
  const totalAmount = Number(pricing.totalPayable ?? offerPrice + taxesAndFees);
  const guestCount = Number(booking.guestSize || 1);

  useEffect(() => {
    setBooking((prev) => ({
      ...prev,
      userId: user?.uid || user?._id || "",
      userEmail: user?.email || "",
      fullName: prev.fullName || initialBooking.fullName || "",
      guestSize: initialBooking.guestSize || prev.guestSize || 1,
      bookAt: initialBooking.bookAt || prev.bookAt || "",
      dateDisplay: initialBooking.dateDisplay || prev.dateDisplay || "",
    }));
  }, [initialBooking, user]);

  const sha512 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-512", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const buildPayUHash = async ({
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
    salt,
  }) => {
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    return await sha512(hashString);
  };

  const submitPayUForm = (params) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = PAYU_PAYMENT_URL;
    form.style.display = "none";

    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const savePendingReceiptToFirebase = async (receipt) => {
    try {
      const firebaseUid = auth?.currentUser?.uid || user?.uid || user?._id;
      if (!firebaseUid || !realtimeDb) {
        console.warn(
          "Skipping pending receipt save because Firebase auth or database is not ready.",
        );
        return;
      }

      const userRef = ref(realtimeDb, `users/${firebaseUid}`);
      const snapshot = await get(userRef);
      const currentProfile = snapshot.exists() ? snapshot.val() : {};

      const currentReceipts = Array.isArray(currentProfile.receipts)
        ? [...currentProfile.receipts]
        : [];

      const existingReceiptIndex = currentReceipts.findIndex(
        (item) => item?.txnid === receipt.txnid,
      );

      if (existingReceiptIndex > -1) {
        currentReceipts[existingReceiptIndex] = receipt;
      } else {
        currentReceipts.unshift(receipt);
      }

      await update(userRef, {
        receipts: currentReceipts,
      });
    } catch (error) {
      console.warn("Unable to save pending receipt to Firebase:", error);
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();

    if (!user) {
      return alert("Please sign in before booking.");
    }

    const fullName = String(booking.fullName || "").trim();
    const phone = String(booking.phone || "").trim();
    const nextErrors = {};

    if (!fullName) {
      nextErrors.fullName = "Full Name is required.";
    }

    if (!phone) {
      nextErrors.phone = "Mobile number is required.";
    } else if (!indianPhonePattern.test(phone)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    if (!booking.bookAt) {
      booking.bookAt = today;
    }

    if (!booking.guestSize || Number(booking.guestSize) < 1) {
      booking.guestSize = 1;
    }

    if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
      return alert(
        "PayU is not configured. Make sure REACT_APP_PAYU_MERCHANT_KEY and REACT_APP_PAYU_MERCHANT_SALT are set in frontend/.env and restart the React dev server.",
      );
    }

    setPaymentLoading(true);

    const txnid = `txn_${Date.now()}`;
    const amount = Number(totalAmount).toFixed(2);
    const productinfo = `Booking for ${title}`;
    const firstname = fullName;
    const email = user.email || booking.userEmail || "guest@example.com";
    const phoneNumber = phone;
    const tourId = tour._id || tour.id || "";
    const receiptData = {
      txnid,
      bookingId: txnid,
      userId: auth?.currentUser?.uid || user?.uid || user?._id || "",
      amount,
      productinfo,
      firstname,
      email,
      phone: phoneNumber,
      tourName: title,
      tourId,
      bookAt: booking.bookAt,
      guestSize: booking.guestSize,
      paymentStatus: "pending",
      status: "Pending",
      createdAt: new Date().toISOString(),
      route: tourId ? `/tours/${tourId}` : "/tours",
    };

    const payuEndpoint =
      "https://us-central1-travel-like-ap-e5e2e.cloudfunctions.net/payuResponse";

    // Pass txnid as query param so you can use it later
    const surl = `${payuEndpoint}?txnid=${encodeURIComponent(txnid)}`;
    const furl = `${payuEndpoint}?txnid=${encodeURIComponent(txnid)}`;

    await savePendingReceiptToFirebase(receiptData);

    const udf1 = tourId;
    const udf2 = booking.bookAt;
    const udf3 = booking.guestSize;
    const udf4 = "";
    const udf5 = "";

    try {
      const hash = await buildPayUHash({
        key: PAYU_MERCHANT_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        salt: PAYU_MERCHANT_SALT,
      });

      submitPayUForm({
        key: PAYU_MERCHANT_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone: phoneNumber,
        surl,
        furl,
        hash,
        display_lang: "English",
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
      });
    } catch (error) {
      console.error("PayU payment error:", error);
      alert(
        "Unable to start PayU payment. Please check console details or try again.",
      );
      setPaymentLoading(false);
    }
  };

  return (
    <div className="booking">
      <div className="booking__header">
        <div>
          <h3>
            {formatPrice(price)} <span>/ person</span>
          </h3>
          <p className="booking__header-meta">
            Pay securely with PayU and confirm your booking instantly.
          </p>
        </div>
        <div className="booking__header-badge">Book Now</div>
      </div>

      <div className="booking__panel">
        <div className="booking__panel-left">
          <div className="booking__section">
            <div className="booking__section-title">Traveller details</div>
            <Form className="booking__info-form" onSubmit={handleClick}>
              <FormGroup>
                <input
                  type="text"
                  placeholder="Full Name (as Aadhaar Name)"
                  id="fullName"
                  value={booking.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? "error" : ""}
                />
                {errors.fullName ? (
                  <div className="booking__field-error">{errors.fullName}</div>
                ) : null}
              </FormGroup>
              <FormGroup>
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  id="phone"
                  value={booking.phone}
                  onChange={handleChange}
                  className={errors.phone ? "error" : ""}
                />
                {errors.phone ? (
                  <div className="booking__field-error">{errors.phone}</div>
                ) : null}
              </FormGroup>
              <div className="booking__summary">
                <p>
                  <strong>Payment date:</strong>{" "}
                  {new Date(booking.bookAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p>
                  <strong>{isCoupleMode ? "Traveller:" : "Travellers:"}</strong>{" "}
                  {isCoupleMode ? "1 (x Couple)" : guestCount}
                </p>
              </div>
            </Form>
          </div>
        </div>

        <div className="booking__panel-right">
          <div className="booking__price-card">
            <div className="booking__price-row">
              <span>Offer price</span>
              <strong>{formatPrice(pricing.offerPrice || price)}</strong>
            </div>
            <div className="booking__price-row">
              <span>Taxes & service fees</span>
              <strong>{formatPrice(taxesAndFees)}</strong>
            </div>
            <div className="booking__price-divider" />
            <div className="booking__price-total">
              <span>Total payable</span>
              <strong>{formatPrice(totalAmount)}</strong>
            </div>
            <p className="booking__price-note">
              You will be redirected to PayU to complete payment.
            </p>
          </div>
        </div>
      </div>

      <div className="booking__actions">
        <Button
          type="button"
          className="btn primary__btn w-100"
          onClick={handleClick}
          disabled={paymentLoading}
        >
          {paymentLoading ? "Processing payment..." : "Book Now"}
        </Button>
      </div>
    </div>
  );
};

export default Booking;
