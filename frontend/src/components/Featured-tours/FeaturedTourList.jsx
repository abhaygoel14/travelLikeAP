import React, { useEffect, useState } from "react";
import TourCard from "../../shared/TourCard";
import { Col } from "reactstrap";
import { TravelCardPlaceholder } from "../../shared/TravelLoader";
// use local mock data during development
import toursMock from "../../assets/data/tours";

const FeaturedTourList = () => {
  const [loading, setLoading] = useState(true);
  const featuredTours = (toursMock || []).filter((t) => t.featured);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {(loading ? Array.from({ length: 4 }) : featuredTours).map(
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
