import React from "react";
import ServiceCard from "./ServiceCard";
import { Col } from "reactstrap";
import weatherImg from "../assets/images/weather.png";
import guideImg from "../assets/images/guide.png";
import customizationImg from "../assets/images/customization.png";

const servicesData = [
  {
    imgUrl: customizationImg,
    title: `Curated Ride Experiences`,
    desc: `Carefully designed routes that blend scenic roads, adventure, and unique destinations.`,
  },
  {
    imgUrl: guideImg,
    title: `End-to-End Trip Management`,
    desc: `From stays and meals to permits and support we handle everything so you can just ride.`,
  },
  {
    imgUrl: customizationImg,
    title: "Expert Ride Support",
    desc: `Experienced guides and well-planned logistics ensuring smooth, and memorable journey.`,
  },
];

const ServiceList = () => {
  return (
    <>
      {servicesData.map((item, index) => (
        <Col lg="3" md="6" sm="12" className="mb-4" key={index}>
          <ServiceCard item={item} />
        </Col>
      ))}
    </>
  );
};

export default ServiceList;
