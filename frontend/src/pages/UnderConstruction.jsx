import React from "react";
import { Container, Row, Col } from "reactstrap";
import "../styles/under-construction.css";

export default function UnderConstruction() {
  return (
    <section className="under-construction-page">
      <Container>
        <Row className="justify-content-center">
          <Col lg="8">
            <div className="under-construction-card text-center">
              <span className="under-construction-badge">
                Website update in progress
              </span>
              <h1>We’re currently under construction 🚧</h1>
              <p>
                Travel Like AP is getting refreshed. For bookings and quick
                updates, please connect with us on WhatsApp or Instagram for
                now.
              </p>

              <div className="under-construction-actions">
                <a
                  href="https://wa.me/916360316790?text=Hi%20Travel%20Like%20AP"
                  target="_blank"
                  rel="noreferrer"
                  className="under-construction-btn primary"
                >
                  <i className="ri-whatsapp-line" aria-hidden="true" />
                  WhatsApp Us
                </a>
                <a
                  href="https://www.instagram.com/travellikeap/"
                  target="_blank"
                  rel="noreferrer"
                  className="under-construction-btn secondary"
                >
                  <i className="ri-instagram-line" aria-hidden="true" />
                  Visit Instagram
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
