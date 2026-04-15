import React, { useEffect } from "react";
import "../styles/home.css";
import { Container, Row, Col } from "reactstrap";
import heroVideo01 from "../assets/images/hero-video01.mp4";
import heroImg01 from "../assets/images/hero-image01.jpg";
import heroVideo03 from "../assets/images/hero-video03.mp4";
import heroImg04 from "../assets/images/hero-img04.jpg";
import heroImg03 from "../assets/images/hero-img03.jpg";
import heroVideo from "../assets/images/hero-video.mp4";
import worldImg from "../assets/images/world.png";
import experienceImg from "../assets/images/experience.png";

import Subtitle from "./../shared/subtitle";
import SearchBar from "./../shared/SearchBar";
import ServiceList from "../services/ServiceList";
import FeaturedTourList from "../components/Featured-tours/FeaturedTourList";
import MasonryImagesGallery from "../components/Image-gallery/MasonryImagesGallery";
import Testimonials from "../components/Testimonial/Testimonials";
import NewsLetter from "../shared/Newsletter";
import { MediaWithShimmer } from "../shared/TravelLoader";

const Home = () => {
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (e) {
      // fallback for older browsers
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);
  return (
    <>
      {/* ========== HERO SECTION ========== */}
      <section className="home__hero-section">
        <Container>
          <Row>
            <Col lg="6">
              <div className="hero__content">
                <div className="hero__subtitle d-flex align-items-center">
                  <Subtitle subtitle={"Know Before You Go"} />
                  <img src={worldImg} alt="" />
                </div>
                <h1>
                  Traveling opens the door to creating{" "}
                  <span className="hightlight"> memories</span>
                </h1>
                <p>
                  At Travel Like AP, we believe every journey is about the
                  moments you carry back. From scenic roads to shared
                  experiences, our rides are designed to create memories that
                  last far beyond the trip. It’s not just about the destination,
                  but the stories you collect along the way. Ride with us, and
                  turn every mile into something unforgettable.
                </p>
              </div>
            </Col>

            <Col lg="2">
              <div className="hero__img-box">
                <MediaWithShimmer
                  as="video"
                  src={heroVideo01}
                  poster={heroImg01}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
              </div>
            </Col>
            <Col lg="2">
              <div className="hero__img-box hero__video-box mt-4">
                <MediaWithShimmer
                  as="video"
                  src={heroVideo}
                  poster={heroImg03}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
              </div>
            </Col>
            <Col lg="2">
              <div className="hero__img-box mt-5">
                <MediaWithShimmer
                  as="video"
                  src={heroVideo03}
                  poster={heroImg04}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
              </div>
            </Col>

            <SearchBar />
          </Row>
        </Container>
      </section>
      {/* ============================================================== */}

      {/* ==================== HERO SECTION START ====================== */}
      <section>
        <Container>
          <Row>
            <Col lg="3">
              <h5 className="services__subtitle">What we serve</h5>
              <h2 className="services__title">We offer our best services</h2>
            </Col>
            <ServiceList />
          </Row>
        </Container>
      </section>

      {/* ========== FEATURED TOUR SECTION START ========== */}
      <section>
        <Container>
          <Row>
            <Col lg="12" className="mb-5">
              <Subtitle subtitle={"Explore"} />
              <h2 className="featured__tour-title">Our featured tours</h2>
            </Col>
            <FeaturedTourList />
          </Row>
        </Container>
      </section>
      {/* ========== FEATURED TOUR SECTION END =========== */}

      {/* ========== EXPERIENCE SECTION START ============ */}
      <section>
        <Container>
          <Row>
            <Col lg="6">
              <div className="experience__content">
                <Subtitle subtitle={"Experience"} />
                <h2>
                  With our all experience <br /> we will serve you
                </h2>
                <p>
                  With years of riding and planning behind us, we bring you
                  journeys you can trust. Every detail is handled with care, so
                  you can simply ride and enjoy the experience.{" "}
                </p>
              </div>

              <div className="counter__wrapper d-flex align-items-center gap-5">
                <div className="counter__box">
                  <span>12k+</span>
                  <h6>Successful trip</h6>
                </div>
                <div className="counter__box">
                  <span>2k+</span>
                  <h6>Regular clients</h6>
                </div>
                <div className="counter__box">
                  <span>15</span>
                  <h6>Year experience</h6>
                </div>
              </div>
            </Col>
            <Col lg="6">
              <div className="experience__img">
                <MediaWithShimmer src={experienceImg} alt="Travel experience" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* ========== EXPERIENCE SECTION END ============== */}

      {/* ========== GALLERY SECTION START ============== */}
      <section>
        <Container>
          <Row>
            <Col lg="12">
              <Subtitle subtitle={"Gallery"} />
              <h2 className="gallery__title">
                Visit our customers tour gallery
              </h2>
            </Col>
            <Col lg="12">
              <div className="gallery__wrapper">
                <MasonryImagesGallery />
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* ========== GALLERY SECTION END ================ */}

      {/* ========== TESTIMONIAL SECTION START ================ */}
      <section>
        <Container>
          <Row>
            <Col lg="12">
              <Subtitle subtitle={"Fans Love"} />
              <h2 className="testimonial__title">What our fans say about us</h2>
            </Col>
            <Col lg="12">
              <div className="testimonial__wrapper">
                <Testimonials />
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* ========== TESTIMONIAL SECTION END ================== */}
      <NewsLetter />
    </>
  );
};

export default Home;
