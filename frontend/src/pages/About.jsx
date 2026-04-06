import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./about.css";
import { MediaWithShimmer } from "../shared/TravelLoader";
import img1 from "../assets/images/hero-img01.jpg";
import img2 from "../assets/images/gallery-03.jpg";
import img3 from "../assets/images/tour.jpg";

function StorySection({ title, text, img, reverse = false }) {
  return (
    <motion.section
      className={"story-section " + (reverse ? "reverse" : "")}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="story-image">
        <MediaWithShimmer src={img} alt={title} />
      </div>
      <div className="story-text">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </motion.section>
  );
}

export default function About() {
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (e) {
      // fallback for older browsers
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);
  const lorem =
    "Lorem ipsum dolor sit amet — we began with a map, two backpacks, and the desire to make travel kinder and more honest. Along the way we learned how places change us, and how people make a trip unforgettable.";

  return (
    <main className="about-page">
      <header className="about-hero">
        <h1>Our Story</h1>
        <p className="subtitle">
          A short travel company story told in chapters
        </p>
      </header>

      <StorySection title="Chapter 1 — The Spark" text={lorem} img={img1} />

      <StorySection
        title="Chapter 2 — The Journey"
        text={lorem + " " + lorem}
        img={img2}
        reverse
      />

      <StorySection title="Chapter 3 — The Community" text={lorem} img={img3} />

      <section className="about-cta">
        <h3>Join us on the next chapter</h3>
        <p>Curious? Explore our tours and become part of the story.</p>
        <CTAButton />
      </section>
    </main>
  );
}

function CTAButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="cta-btn"
      onClick={() => navigate("/tours")}
    >
      Explore Tours
    </button>
  );
}
