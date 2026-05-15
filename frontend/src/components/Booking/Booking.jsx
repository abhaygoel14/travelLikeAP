import React, { useState, useContext, useEffect } from "react";
import "./booking.css";
import { Form, FormGroup, ListGroupItem, ListGroup, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { get, ref, update } from "firebase/database";
import { AuthContext } from "../../context/AuthContext";
import { formatPrice } from "../../utils/tourSchema";
import { auth, realtimeDb } from "../../utils/firebaseConfig";

const Booking = ({ tour, avgRating, initialBooking = {} }) => {
  const { price, reviews, title } = tour;
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const [booking, setBooking] = useState({
    userId: user?.uid || user?._id || "",
    userEmail: user?.email || "",
    tourName: title,
    fullName: initialBooking.fullName || "",
    phone: "",
    guestSize: initialBooking.guestSize || 1,
    bookAt: initialBooking.bookAt || "",
    dateDisplay: initialBooking.dateDisplay || "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  const handleChange = (e) => {
    setBooking((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const serviceFee = 10;
  const totalAmount =
    Number(price) * Number(booking.guestSize) + Number(serviceFee);

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

    if (!booking.fullName || !booking.phone || !booking.bookAt) {
      return alert("Please complete all booking details.");
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
    const firstname = booking.fullName;
    const email = user.email || booking.userEmail || "guest@example.com";
    const phone = booking.phone;
    const tourId = tour._id || tour.id || "";
    const receiptData = {
      txnid,
      userId: auth?.currentUser?.uid || user?.uid || user?._id || "",
      amount,
      productinfo,
      firstname,
      email,
      phone,
      tourName: title,
      tourId,
      bookAt: booking.bookAt,
      guestSize: booking.guestSize,
      paymentStatus: "pending",
      status: "Pending",
      createdAt: new Date().toISOString(),
      route: tourId ? `/tours/${tourId}` : "/tours",
    };

    const surl = `${window.location.origin}/payu-success.html?txnid=${encodeURIComponent(
      txnid,
    )}`;
    const furl = `${window.location.origin}/payu-failure.html?txnid=${encodeURIComponent(
      txnid,
    )}`;

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
        phone,
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
      <div className="booking__top d-flex align-items-center justify-content-between">
        <h3>
          {formatPrice(price)} <span>/per person</span>
        </h3>
        <span className="tour__rating d-flex align-items-center">
          <i
            class="ri-star-fill"
            style={{ color: "var(--secondary-color)" }}
          ></i>
          {avgRating === 0 ? null : avgRating} ({reviews?.length})
        </span>
      </div>

      {/* =============== BOOKING FORM START ============== */}
      <div className="booking__form">
        <h5>Information</h5>
        <Form className="booking__info-form" onSubmit={handleClick}>
          <FormGroup>
            <input
              type="text"
              placeholder="Full Name"
              id="fullName"
              required
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <input
              type="tel"
              placeholder="Phone"
              id="phone"
              required
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup className="d-flex align-items-center gap-3">
            <input
              type="date"
              placeholder=""
              id="bookAt"
              required
              onChange={handleChange}
            />
            <input
              type="number"
              placeholder="Guest"
              id="guestSize"
              required
              onChange={handleChange}
            />
          </FormGroup>
        </Form>
      </div>
      {/* =============== BOOKING FORM END ================ */}

      {/* =============== BOOKING BOTTOM ================ */}
      <div className="booking__bottom">
        <ListGroup>
          <ListGroupItem className="border-0 px-0">
            <h5 className="d-flex align-items-center gap-1">
              {formatPrice(price)} <i class="ri-close-line"></i> 1 person
            </h5>
            <span>{formatPrice(price)}</span>
          </ListGroupItem>
          <ListGroupItem className="border-0 px-0">
            <h5>Service charge</h5>
            <span>{formatPrice(serviceFee)}</span>
          </ListGroupItem>
          <ListGroupItem className="border-0 px-0 total">
            <h5>Total</h5>
            <span>{formatPrice(totalAmount)}</span>
          </ListGroupItem>
        </ListGroup>

        <Button
          type="button"
          className="btn primary__btn w-100 mt-4"
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
