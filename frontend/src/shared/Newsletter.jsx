import React from "react";
import "./newsletter.css";
import { Container, Row, Col } from "reactstrap";
import logo from "../assets/images/logo.png";

const NewsLetter = () => {
  return (
    <section className="newsletter">
      <Container>
        <Row>
          <Col lg="6">
            <div className="newsletter__content">
              <h2>Subcribe now to get useful traveling information</h2>

              <div className="newsletter__input">
                <input type="email" placeholder="Enter your email" />
                <button className="btn newsletter__btn">Subcribe</button>
              </div>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Obcaecati adipisici sunt in, provident facere ipsam?
              </p>
            </div>
          </Col>
          <Col lg="6">
            <div className="newsletter__img">
              <div className="newsletter__brand-lockup">
                <img src={logo} alt="Travel Like AP logo" />
                <div className="newsletter__brand-copy">
                  <span className="newsletter__brand-main">TRAVEL</span>
                  <span className="newsletter__brand-line">
                    <span className="newsletter__brand-like">LIKE</span>
                    <span className="newsletter__brand-ap">AP</span>
                  </span>
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
