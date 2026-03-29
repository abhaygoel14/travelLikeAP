import React from "react";
import "../styles/tour-details.css";
import { Container, Row, Col } from "reactstrap";
import Gallery from "../components/TourDetails/Gallery";
import DetailsCard from "../components/TourDetails/DetailsCard";
import InclusionCard from "../components/TourDetails/InclusionCard";
import Highlights from "../components/TourDetails/Highlights";
import Itinerary from "../components/TourDetails/Itinerary";
import Packing from "../components/TourDetails/Packing";
import InclusionExclusion from "../components/TourDetails/InclusionExclusion";
import PolicyTable from "../components/TourDetails/PolicyTable";
import PriceCard from "../components/TourDetails/PriceCard";
import Newsletter from "../shared/Newsletter";

import img1 from "../assets/images/tour-img01.jpg";
import img2 from "../assets/images/tour-img02.jpg";
import img3 from "../assets/images/tour-img03.jpg";
import img4 from "../assets/images/tour-img04.jpg";
import img5 from "../assets/images/tour-img05.jpg";

const TourDetails = () => {
  // Hardcoded demo data (will come from backend later)
  const images = [img1, img2, img3, img4, img5];

  const details = {
    pickup: "Central Station (09:00)",
    dropoff: "Central Station (18:00)",
    category: "Guided - Cultural",
    duration: "1 Day",
  };

  const inclusions = ["Transport", "Lunch", "Local guide", "Entrance fees"];

  const highlights = [
    "Scenic viewpoints",
    "Local market visit",
    "Historic site tour",
    "Sunset on the ridge",
  ];

  const days = [
    {
      title: "Arrival & Meet",
      desc: "Meet at the station and transfer to the viewpoint. Intro and safety.",
    },
    {
      title: "Explore & Lunch",
      desc: "Walk through the old town, visit the market and enjoy a local lunch.",
    },
    {
      title: "Drive & Sunset",
      desc: "Short drive to the ridge, sunset and photos, return to dropoff.",
    },
  ];

  const packing = ["Comfortable shoes", "Water bottle", "Sunscreen", "Camera"];

  const includeEx = {
    include: ["Transport", "Lunch", "Guide"],
    exclude: ["Flights", "Personal expenses"],
  };

  const policyRows = [
    { days: "30+ days", refund: "100%", notes: "Full refund" },
    { days: "15-29 days", refund: "50%", notes: "Half refund" },
    { days: "<15 days", refund: "No refund", notes: "No refund" },
  ];

  return (
    <section>
      <Container>
        <Row>
          <Col lg="8">
            <Gallery images={images} />

            <DetailsCard
              pickup={details.pickup}
              dropoff={details.dropoff}
              category={details.category}
              duration={details.duration}
            />

            <InclusionCard items={inclusions} />

            <Highlights items={highlights} />

            <Itinerary days={days} />

            <Packing items={packing} />

            <InclusionExclusion
              include={includeEx.include}
              exclude={includeEx.exclude}
            />

            <PolicyTable rows={policyRows} />
          </Col>

          <Col lg="4">
            <PriceCard price={299} discounted={199} />
          </Col>
        </Row>
      </Container>
      <Newsletter />
    </section>
  );
};

export default TourDetails;
