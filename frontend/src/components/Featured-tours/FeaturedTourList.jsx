import React from "react";
import TourCard from "../../shared/TourCard";
import { Col } from "reactstrap";
import { TravelCardPlaceholder } from "../../shared/TravelLoader";
import useTours from "../../hooks/useTours";

const FeaturedTourList = () => {
  const { featuredTours, loading } = useTours();
  const visibleTours = featuredTours.slice(0, 4);

  return (
    <>
      {(loading ? Array.from({ length: 4 }) : visibleTours).map(
        (tour, index) => (
          <Col
            lg="3"
            md="4"
            sm="6"
            className="mb-4"
            key={tour?.id || tour?._id || `featured-skeleton-${index}`}
          >
            {loading ? <TravelCardPlaceholder /> : <TourCard tour={tour} />}
          </Col>
        ),
      )}
    </>
  );
};

export default FeaturedTourList;
