import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
} from "reactstrap";
import { ref as dbRef, update as updateDb } from "firebase/database";
import CommonSection from "../shared/CommonSection";
import Newsletter from "../shared/Newsletter";
import { realtimeDb } from "../utils/firebaseConfig";
import "./contact-us.css";

const contactItems = [
  {
    label: "Phone",
    value: "+91 63603 16790",
    href: "tel:+916360316790",
    icon: "ri-phone-line",
  },
  {
    label: "Email",
    value: "travellikeap@gmail.com",
    href: "mailto:travellikeap@gmail.com",
    icon: "ri-mail-line",
  },
  {
    label: "Address",
    value: "004, Saranya apartment, Munnekolal, Kundanahalli gate, Bangalore - 560037",
    href: null,
    icon: "ri-map-pin-line",
  },
];

export default function ContactUs() {
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (error) {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  const handleChange = ({ target }) => {
    const { name, value } = target;

    setInquiryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: String(inquiryForm.name || "").trim(),
      email: String(inquiryForm.email || "").trim(),
      phone: String(inquiryForm.phone || "")
        .replace(/\D/g, "")
        .slice(0, 10),
      message: String(inquiryForm.message || "").trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.message) {
      setStatus({ color: "warning", text: "Please fill all fields." });
      return;
    }

    if (!/^\d{10}$/.test(payload.phone)) {
      setStatus({
        color: "warning",
        text: "Please enter a valid 10-digit phone number.",
      });
      return;
    }

    if (!realtimeDb) {
      setStatus({
        color: "danger",
        text: "Inquiry service is temporarily unavailable. Please call or email us.",
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

      setInquiryForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
      setStatus({
        color: "success",
        text: "Inquiry submitted successfully. Our team will contact you soon.",
      });
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
    <>
      <CommonSection title="Contact Us" />
      <section className="contact-page-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg="9">
              <div className="contact-page-card">
                <h2>We would love to help you plan your next trip</h2>
                <p>Reach out for bookings, custom itineraries, or support.</p>

                <div className="contact-page-grid">
                  {contactItems.map((item) => {
                    const content = (
                      <>
                        <span className="contact-page-icon">
                          <i className={item.icon} aria-hidden="true" />
                        </span>
                        <div>
                          <small>{item.label}</small>
                          <strong>{item.value}</strong>
                        </div>
                      </>
                    );

                    if (!item.href) {
                      return (
                        <div key={item.label} className="contact-page-item">
                          {content}
                        </div>
                      );
                    }

                    return (
                      <a
                        key={item.label}
                        className="contact-page-item"
                        href={item.href}
                      >
                        {content}
                      </a>
                    );
                  })}
                </div>

                <div className="contact-inquiry-wrap">
                  <h3>Send an inquiry</h3>
                  <p>
                    Share your plan and we will help you with the best
                    itinerary.
                  </p>

                  {status ? (
                    <Alert color={status.color}>{status.text}</Alert>
                  ) : null}

                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col md="6">
                        <FormGroup>
                          <Label for="inquiryName">Full name</Label>
                          <Input
                            id="inquiryName"
                            name="name"
                            value={inquiryForm.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            required
                          />
                        </FormGroup>
                      </Col>
                      <Col md="6">
                        <FormGroup>
                          <Label for="inquiryEmail">Email</Label>
                          <Input
                            id="inquiryEmail"
                            type="email"
                            name="email"
                            value={inquiryForm.email}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            required
                          />
                        </FormGroup>
                      </Col>
                      <Col md="6">
                        <FormGroup>
                          <Label for="inquiryPhone">Phone number</Label>
                          <Input
                            id="inquiryPhone"
                            name="phone"
                            value={inquiryForm.phone}
                            onChange={handleChange}
                            placeholder="10-digit phone number"
                            maxLength={10}
                            inputMode="numeric"
                            required
                          />
                        </FormGroup>
                      </Col>
                      <Col md="12">
                        <FormGroup>
                          <Label for="inquiryMessage">Message</Label>
                          <Input
                            id="inquiryMessage"
                            type="textarea"
                            rows="4"
                            name="message"
                            value={inquiryForm.message}
                            onChange={handleChange}
                            placeholder="Tell us where and when you want to travel"
                            required
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Button color="primary" type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit inquiry"}
                    </Button>
                  </Form>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <Newsletter />
    </>
  );
}
