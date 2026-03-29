import React, { useState } from "react";
import img from "../../assets/images/gallery-01.jpg";
import "./tour-details-components.css";

export default function InquiryModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    places: "",
    message: "",
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    alert("Inquiry submitted (hardcoded) — " + JSON.stringify(form));
    onClose();
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
                Send Inquiry
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
