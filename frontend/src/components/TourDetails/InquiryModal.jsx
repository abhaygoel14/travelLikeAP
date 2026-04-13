import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  get as getDbValue,
  ref as dbRef,
  update as updateDb,
} from "firebase/database";
import img from "../../assets/images/gallery-01.jpg";
import { AuthContext } from "../../context/AuthContext";
import { realtimeDb } from "../../utils/firebaseConfig";
import "./tour-details-components.css";

const getFirstAvailable = (...values) =>
  values.map((value) => String(value || "").trim()).find(Boolean) || "";

const resolveNameFromProfile = (profile = {}) => {
  const firstName = String(profile?.firstName || "").trim();
  const lastName = String(profile?.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return getFirstAvailable(
    fullName,
    firstName,
    profile?.displayName,
    profile?.username,
  );
};

const resolvePhoneFromProfile = (profile = {}) =>
  getFirstAvailable(
    profile?.phoneNumber,
    profile?.phone,
    profile?.mobile,
    profile?.contactNumber,
  )
    .replace(/\D/g, "")
    .slice(0, 10);

export default function InquiryModal({ onClose, tour = null }) {
  const { user } = useContext(AuthContext);
  const defaultName = resolveNameFromProfile(user || {});
  const defaultEmail = getFirstAvailable(user?.email);
  const defaultPhone = resolvePhoneFromProfile(user || {});

  const [form, setForm] = useState({
    name: defaultName,
    email: defaultEmail,
    phone: defaultPhone,
    places: String(tour?.city || "").trim(),
    message: tour?.title ? `Hi, I want details for ${tour.title}.` : "",
  });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
  });

  const hasMissingContactDetails = useMemo(
    () => !defaultName || !defaultPhone,
    [defaultName, defaultPhone],
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || defaultName,
      email: prev.email || defaultEmail,
      phone: prev.phone || defaultPhone,
    }));
  }, [defaultEmail, defaultName, defaultPhone]);

  useEffect(() => {
    let active = true;

    const loadLatestProfile = async () => {
      const userUid = String(user?.uid || "").trim();

      if (!userUid || !realtimeDb) {
        return;
      }

      try {
        const snapshot = await getDbValue(
          dbRef(realtimeDb, `users/${userUid}`),
        );

        if (!active || !snapshot.exists()) {
          return;
        }

        const remoteProfile = snapshot.val() || {};
        const remoteName = resolveNameFromProfile(remoteProfile);
        const remoteEmail = getFirstAvailable(
          remoteProfile?.email,
          user?.email,
        );
        const remotePhone = resolvePhoneFromProfile(remoteProfile);

        setForm((prev) => ({
          ...prev,
          name: touched.name ? prev.name : prev.name || remoteName,
          email: touched.email ? prev.email : prev.email || remoteEmail,
          phone: touched.phone ? prev.phone : prev.phone || remotePhone,
        }));
      } catch (error) {
        console.warn(
          "Unable to load latest profile for inquiry auto-fill:",
          error,
        );
      }
    };

    loadLatestProfile();

    return () => {
      active = false;
    };
  }, [touched.email, touched.name, touched.phone, user]);

  const onChange = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    const payload = {
      name: String(form.name || "").trim(),
      email: String(form.email || "").trim(),
      phone: String(form.phone || "")
        .replace(/\D/g, "")
        .slice(0, 10),
      places: String(form.places || "").trim(),
      message: String(form.message || "").trim(),
      source: "tour-details",
      tourId: String(tour?.id || tour?._id || "").trim(),
      tourTitle: String(tour?.title || "").trim(),
      tourCity: String(tour?.city || "").trim(),
      userUid: String(user?.uid || "").trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.message) {
      setStatus({ color: "danger", text: "Please fill all required fields." });
      return;
    }

    if (!/^\d{10}$/.test(payload.phone)) {
      setStatus({
        color: "danger",
        text: "Please enter a valid 10-digit phone number.",
      });
      return;
    }

    if (!realtimeDb) {
      setStatus({
        color: "danger",
        text: "Inquiry service is unavailable right now.",
      });
      return;
    }

    const inquiryId = `inquiry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    try {
      setSubmitting(true);
      await updateDb(dbRef(realtimeDb, `inquiries/${inquiryId}`), {
        ...payload,
        id: inquiryId,
        status: "new",
        createdAt: new Date().toISOString(),
      });

      setStatus({
        color: "success",
        text: "Inquiry submitted successfully. We will contact you soon.",
      });
      window.setTimeout(() => onClose?.(), 800);
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to submit inquiry right now.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="td-modal-overlay">
      <div className="td-modal">
        <div className="td-modal-left">
          <img src={img} alt="inquire" />
        </div>
        <div className="td-modal-right">
          <button className="td-modal-close" onClick={onClose}>
            ✕
          </button>
          <h3>Inquire About This Trip</h3>
          {tour?.title ? (
            <p className="td-inquiry-tour-meta">
              Sending inquiry for <strong>{tour.title}</strong>
            </p>
          ) : null}
          {hasMissingContactDetails ? (
            <p className="td-inquiry-hint">
              Please add your missing contact details so we can reach you.
            </p>
          ) : null}
          {status ? (
            <p className={`td-inquiry-status ${status.color}`}>{status.text}</p>
          ) : null}
          <form onSubmit={submit} className="td-inquiry-form">
            <input
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={onChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={onChange}
              required
            />
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={onChange}
              required
              maxLength={10}
              inputMode="numeric"
            />
            <input
              name="places"
              placeholder="Places you'd like to visit"
              value={form.places}
              onChange={onChange}
            />
            <textarea
              name="message"
              placeholder="Additional details"
              value={form.message}
              onChange={onChange}
            />
            <div className="td-modal-actions">
              <button type="submit" className="primary__btn">
                {submitting ? "Submitting..." : "Send Inquiry"}
              </button>
              <button
                type="button"
                className="secondary__btn"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
