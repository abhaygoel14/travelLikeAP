import React, { useState, useEffect } from "react";
import CommonSection from "../shared/CommonSection";
// import tourData from '../assets/data/tours'
import "../styles/tour.css";
import TourCard from "./../shared/TourCard";
import SearchBar from "./../shared/SearchBar";
import Newsletter from "./../shared/Newsletter";
import { Col, Container, Row } from "reactstrap";
import { TravelCardPlaceholder } from "../shared/TravelLoader";
// import useFetch from '../hooks/useFetch'
// import { BASE_URL } from '../utils/config'
import toursMock from "../assets/data/tours";

const Tours = () => {
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  // Using mock data instead of API during development
  const toursPerPage = 8;
  const displayedTours = toursMock.slice(
    page * toursPerPage,
    (page + 1) * toursPerPage,
  );

  useEffect(() => {
    setPageLoading(true);
    const pages = Math.ceil(toursMock.length / toursPerPage);
    setPageCount(pages);
    window.scrollTo(0, 0);

    const timer = window.setTimeout(() => {
      setPageLoading(false);
    }, 280);

    return () => window.clearTimeout(timer);
  }, [page]);

  return (
    <>
      <CommonSection title={"All Tours"} />
      <section>
        <Container>
          <Row>
            <SearchBar />
          </Row>
        </Container>
      </section>

      <section className="pt-0">
        <Container>
          {/* {loading && <h4 className='text-center pt-5'>LOADING..........</h4>}
               {error && <h4 className='text-center pt-5'>{error}</h4>} */}
          {
            <Row>
              {pageLoading
                ? Array.from({ length: toursPerPage }).map((_, index) => (
                    <Col
                      lg="3"
                      md="6"
                      sm="6"
                      className="mb-4"
                      key={`tour-skeleton-${index}`}
                    >
                      <TravelCardPlaceholder />
                    </Col>
                  ))
                : displayedTours.map((tour) => (
                    <Col
                      lg="3"
                      md="6"
                      sm="6"
                      className="mb-4"
                      key={tour.id || tour._id}
                    >
                      <TourCard tour={tour} />
                    </Col>
                  ))}

              {!pageLoading && (
                <Col lg="12">
                  <div className="pagination d-flex align-items-center justify-content-center mt-4 gap-3">
                    {[...Array(pageCount).keys()].map((number) => (
                      <span
                        key={number}
                        onClick={() => setPage(number)}
                        className={page === number ? "active__page" : ""}
                      >
                        {number + 1}
                      </span>
                    ))}
                  </div>
                </Col>
              )}
            </Row>
          }
        </Container>
      </section>
      <Newsletter />
    </>
  );
};

export default Tours;
