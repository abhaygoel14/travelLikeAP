import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./about.css";
import { MediaWithShimmer } from "../shared/TravelLoader";
import img1 from "../assets/images/hero-img01.jpg";
import img2 from "../assets/images/gallery-03.jpg";
import img3 from "../assets/images/tour.jpg";
import img4 from "../assets/images/gallery-04.jpg";
import img5 from "../assets/images/tour-img04.jpg";

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

  const story1 =
    "Travel Like AP began in May ’25 with a simple love for the open road. What started as solo rides soon turned into a vision to share those experiences with others. To create travel experiences that are more than just trips, but stories worth sharing. With a map, two backpacks, and a passion for adventure, we set out to make travel kinder and more honest. Along the way, we learned how places change us, and how people make a trip unforgettable.";

  const story2 =
    "Just 3 riders, one route, and a shared excitement—that was the first step. It wasn’t perfect, but it was real—and that’s what made it special. From that first ride, we knew we were onto something. The joy of discovering new roads, the laughter around campfires, and the friendships forged on the journey—that’s what Travel Like AP is all about. It’s not just about the destination, but the stories you collect along the way.";
  const story3 =
    "What began as a one-person effort slowly grew into a passionate team of five. Each member brought in their own energy, making every ride better than the last. From planning routes to sharing stories, we built a community that’s more than just riders—it’s a family. Together, we’ve created experiences that go beyond the ordinary, and we’re just getting started.";
  const story4 = `With every ride, more people joined in. Strangers became friends, and a community of like-minded travelers started to take shape.
It was never just about the distance. It became about shared laughs, early sunrises, unexpected detours, and memories that stay forever.
Every journey helped us improve—better planning, smoother execution, and a stronger focus on safety, comfort, and experience.`;

  return (
    <main className="about-page">
      <header className="about-hero">
        <h1>Our Story</h1>
        <p className="subtitle">
          A short travel company story told in chapters
        </p>
      </header>

      <StorySection
        title="Chapter 1 — Where It All Began (May ’25)"
        text={story1}
        img={img1}
      />

      <StorySection
        title="Chapter 2 — The First Ride Together"
        text={story2}
        img={img2}
        reverse
      />

      <StorySection
        title="Chapter 3 — From One to a Team"
        text={story3}
        img={img3}
      />
      <StorySection
        title="Chapter 4 —Growing the Tribe & More Than Just Rides"
        text={story4}
        img={img4}
        reverse
      />

      <StorySection
        title="Chapter 5 — The Journey Ahead"
        text={
          "Today, Travel Like AP stands for meaningful travel experiences. And this is just the beginning—there are many more roads, stories, and memories waiting to be created. We’re excited for the next chapter, and we hope you’ll be part of it."
        }
        img={img5}
      />

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
