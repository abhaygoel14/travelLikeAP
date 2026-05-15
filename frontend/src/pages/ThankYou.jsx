import React, { useContext, useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button } from "reactstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { get, ref, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { AuthContext } from "../context/AuthContext";
import { auth, realtimeDb } from "../utils/firebaseConfig";
import "../styles/thank-you.css";

const formatCurrency = (value) => {
  const amount = Number(value);
  return Number.isNaN(amount) ? String(value || "-") : `$${amount.toFixed(2)}`;
};

const getReceiptFromFirebase = async (uid, txnid) => {
  if (!uid || !txnid) {
    return null;
  }

  try {
    const userRef = ref(realtimeDb, `users/${uid}`);
    const snapshot = await get(userRef);
    const profileData = snapshot.exists() ? snapshot.val() : {};
    const receipts = Array.isArray(profileData.receipts)
      ? profileData.receipts
      : [];
    return receipts.find((item) => item?.txnid === txnid) || null;
  } catch (error) {
    console.warn("Unable to fetch receipt from Firebase:", error);
    return null;
  }
};

const ThankYou = () => {
  const { user, dispatch } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [receipt, setReceipt] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(8);
  const [profileSynced, setProfileSynced] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState(
    auth?.currentUser?.uid || null,
  );

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const rawStatus = queryParams.get("status") || params.status || "";
  const status =
    rawStatus === "success"
      ? "success"
      : rawStatus === "failure"
        ? "failure"
        : "unknown";
  const txnid = queryParams.get("txnid") || "";

  const statusLabel = useMemo(() => {
    if (status === "success") return "Payment successful!";
    if (status === "failure") return "Payment failed";
    return "Payment status";
  }, [status]);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUid(firebaseUser?.uid || null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;

    const loadReceipt = async () => {
      if (!txnid) {
        return;
      }

      const localReceipt = user?.receipts?.find(
        (item) => item?.txnid === txnid,
      );
      if (active && localReceipt) {
        setReceipt(localReceipt);
        return;
      }

      const firebaseReceipt = await getReceiptFromFirebase(
        firebaseUid || user?.uid,
        txnid,
      );
      if (active && firebaseReceipt) {
        setReceipt(firebaseReceipt);
        return;
      }

      if (!active) {
        return;
      }

      setReceipt({
        txnid,
        amount: "Unknown",
        tourName: "Booked tour",
        firstname: "Traveler",
        email: "",
        phone: "",
        bookAt: "",
        guestSize: "",
        paymentStatus:
          status === "success"
            ? "success"
            : status === "failure"
              ? "failure"
              : "pending",
        status:
          status === "success"
            ? "Success"
            : status === "failure"
              ? "Failed"
              : "Pending",
        route: "/tours",
      });
    };

    loadReceipt();

    return () => {
      active = false;
    };
  }, [status, txnid, user, firebaseUid]);

  useEffect(() => {
    if (!receipt || status === "unknown") {
      return;
    }

    const nextReceipt = {
      ...receipt,
      paymentStatus:
        status === "success"
          ? "success"
          : status === "failure"
            ? "failure"
            : receipt.paymentStatus || "pending",
      status:
        status === "success"
          ? "Success"
          : status === "failure"
            ? "Failed"
            : receipt.status || "Pending",
      updatedAt: new Date().toISOString(),
    };

    if (JSON.stringify(nextReceipt) !== JSON.stringify(receipt)) {
      setReceipt(nextReceipt);
    }
  }, [receipt, status]);

  useEffect(() => {
    if (!receipt || !status || status === "unknown" || profileSynced) {
      return;
    }

    const persistReceipt = async () => {
      try {
        const firebaseUserId = firebaseUid || user?.uid;
        const authReady = Boolean(auth?.currentUser || firebaseUid);
        if (!firebaseUserId || !authReady) {
          return;
        }

        const userRef = ref(realtimeDb, `users/${firebaseUserId}`);
        const snapshot = await get(userRef);
        const currentProfile = snapshot.exists() ? snapshot.val() : {};

        const currentReceipts = Array.isArray(currentProfile.receipts)
          ? [...currentProfile.receipts]
          : [];

        const existingReceiptIndex = currentReceipts.findIndex(
          (item) => item.txnid === receipt.txnid,
        );

        const nextReceipt = {
          ...receipt,
          paymentStatus: status === "success" ? "success" : "failure",
          status: status === "success" ? "Success" : "Failed",
          updatedAt: new Date().toISOString(),
        };

        if (existingReceiptIndex > -1) {
          currentReceipts[existingReceiptIndex] = nextReceipt;
        } else {
          currentReceipts.unshift(nextReceipt);
        }

        const nextUpcomingTrips = Array.isArray(currentProfile.upcomingTrips)
          ? [...currentProfile.upcomingTrips]
          : [];

        if (status === "success") {
          const newTrip = {
            title: receipt.tourName || receipt.productinfo || "Upcoming trip",
            date: receipt.bookAt || "TBD",
            status: "Confirmed",
            budget: Number(receipt.amount) || 0,
            bookingId: receipt.txnid,
            route: receipt.route || `/tours/${receipt.tourId || ""}`,
          };

          const alreadyExists = nextUpcomingTrips.some(
            (trip) =>
              String(trip.bookingId || trip.txnid || "") === receipt.txnid,
          );

          if (!alreadyExists) {
            nextUpcomingTrips.unshift(newTrip);
          }
        }

        await update(userRef, {
          receipts: currentReceipts,
          upcomingTrips: nextUpcomingTrips,
        });

        dispatch({
          type: "SET_USER",
          payload: {
            ...user,
            receipts: currentReceipts,
            upcomingTrips: nextUpcomingTrips,
          },
        });

        setProfileSynced(true);
        setStatusMessage(
          status === "success"
            ? "Your booking has been added to your dashboard."
            : "Your failed payment was recorded, and the receipt is available in your dashboard.",
        );
      } catch (error) {
        console.error("Error syncing payment receipt:", error);
        setStatusMessage(
          "Unable to sync booking data to your dashboard right now. Please refresh the page or re-login before checking your dashboard.",
        );
      }
    };

    persistReceipt();
  }, [receipt, status, user, dispatch, firebaseUid, profileSynced]);

  useEffect(() => {
    if (status === "unknown") {
      return undefined;
    }

    const delay = status === "success" ? 8 : 14;
    setRedirectCountdown(delay);

    const timer = window.setInterval(() => {
      setRedirectCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [navigate, status]);

  return (
    <section>
      <Container>
        <Row>
          <Col lg="12" className="pt-5 text-center">
            <div className="thank__you">
              <span>
                <i
                  className={
                    status === "success"
                      ? "ri-checkbox-circle-line"
                      : status === "failure"
                        ? "ri-error-warning-line"
                        : "ri-information-line"
                  }
                ></i>
              </span>
              <h1 className="mb-3 fw-semibold">{statusLabel}</h1>
              <h3 className="mb-4">
                {status === "success"
                  ? "Your payment was successful and your booking is confirmed."
                  : status === "failure"
                    ? "Your payment could not be completed. Please try again or contact support."
                    : "We could not determine the payment result."}
              </h3>

              {receipt ? (
                <div className="thank__receipt-card mb-4">
                  <div className="receipt-header">
                    <span>{receipt.tourName || receipt.productinfo}</span>
                    <strong>{formatCurrency(receipt.amount)}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Transaction ID:</span>
                    <span>{receipt.txnid || "N/A"}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Booking date:</span>
                    <span>{receipt.bookAt || "TBD"}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Traveller:</span>
                    <span>
                      {receipt.firstname || receipt.email || "Traveler"}
                    </span>
                  </div>
                  <div className="receipt-row">
                    <span>Guests:</span>
                    <span>{receipt.guestSize || "1"}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Payment status:</span>
                    <span>
                      {status === "success"
                        ? "Success"
                        : status === "failure"
                          ? "Failed"
                          : receipt.status || "Pending"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mb-4 text-muted">
                  No payment receipt was found. If this happened after a
                  redirect, try opening your dashboard.
                </p>
              )}

              {statusMessage && (
                <p className="mb-3 text-secondary">{statusMessage}</p>
              )}

              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <Button color="primary" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button
                  color="secondary"
                  outline
                  onClick={() => navigate(receipt?.route || "/tours")}
                >
                  {status === "failure" ? "Retry Booking" : "Browse Tours"}
                </Button>
              </div>

              {status !== "unknown" && (
                <p className="mt-3 text-muted">
                  Redirecting to your dashboard in {redirectCountdown}{" "}
                  seconds...
                </p>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ThankYou;
