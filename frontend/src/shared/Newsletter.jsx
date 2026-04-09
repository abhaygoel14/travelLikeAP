import React from "react";
import { Link } from "react-router-dom";
import "./newsletter.css";
import { Container, Row, Col } from "reactstrap";
import logo from "../assets/images/logo.png";

const connectLinks = [
  {
    label: "WhatsApp",
    icon: "ri-whatsapp-line",
    href: "https://wa.me/?text=Hi%20Travel%20Like%20AP",
  },
  {
    label: "YouTube",
    icon: "ri-youtube-line",
    href: "https://www.youtube.com/results?search_query=Travel+Like+AP",
  },
  {
    label: "Email",
    icon: "ri-mail-send-line",
    href: "mailto:?subject=Travel%20Like%20AP%20Enquiry",
  },
];

const policyLinks = [
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  {
    to: "/cancellation-refund-policy",
    label: "Cancellation & Refunds Policy",
  },
];

const NewsLetter = () => {
  return (
    <section className="newsletter">
      <Container>
        <Row className="align-items-center g-4">
          <Col lg="7">
            <div className="newsletter__content">
              <span className="newsletter__eyebrow">Stay connected</span>
              <h2>
                Connect with us for trips, support, and latest travel updates
              </h2>
              <p>
                Reach out directly on WhatsApp, explore our latest video
                content, or send us an email for help with your next getaway.
              </p>

              <div className="newsletter__connect-grid">
                {connectLinks.map((item) => (
                  <a
                    key={item.label}
                    className="newsletter__contact-card"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="newsletter__contact-icon">
                      <i className={item.icon} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>Connect now</small>
                    </span>
                  </a>
                ))}
              </div>

              <div className="newsletter__policy-links">
                {policyLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="newsletter__policy-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </Col>
          <Col lg="5">
            <div className="newsletter__img">
              <div className="newsletter__brand-lockup">
                <img src={logo} alt="Travel Like AP logo" />
                <div className="newsletter__brand-copy">
                  <span className="newsletter__brand-main">TRAVEL</span>
                  <span className="newsletter__brand-line">
                    <span className="newsletter__brand-like">LIKE</span>
                    <span className="newsletter__brand-ap">AP</span>
                  </span>
                  <p className="newsletter__brand-tagline">
                    Explore better journeys with Travel Like AP.
                  </p>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default NewsLetter;
