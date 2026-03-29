import React from "react";
import TourCard from "../../shared/TourCard";
import { Col } from "reactstrap";
// use local mock data during development
import toursMock from "../../assets/data/tours";

const FeaturedTourList = () => {
  const featuredTours = (toursMock || []).filter((t) => t.featured);

  return (
    <>
      {featuredTours.map((tour) => (
        <Col lg="3" md="4" sm="6" className="mb-4" key={tour.id || tour._id}>
          <TourCard tour={tour} />
        </Col>
      ))}
    </>
  );
};

export default FeaturedTourList;
