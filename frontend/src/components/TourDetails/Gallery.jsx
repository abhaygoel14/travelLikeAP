import "./tour-details-components.css";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function Gallery({ images = [] }) {
  const [index, setIndex] = useState(0);
  const startX = useRef(null);
  const containerRef = useRef(null);

  const safeLen = images ? images.length : 0;

  const select = (i) => {
    if (safeLen === 0) return;
    setIndex(((i % safeLen) + safeLen) % safeLen);
  };

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        setIndex((i) => (((i + 1) % safeLen) + safeLen) % safeLen);
      }
      if (e.key === "ArrowLeft") {
        setIndex((i) => (((i - 1) % safeLen) + safeLen) % safeLen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [safeLen]);

  // simple touch swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
      if (startX.current == null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(dx) > 40) {
        if (dx < 0) setIndex((i) => (((i + 1) % safeLen) + safeLen) % safeLen);
        else setIndex((i) => (((i - 1) % safeLen) + safeLen) % safeLen);
      }
      startX.current = null;
    };

    el.addEventListener("touchstart", onTouchStart);
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [safeLen]);

  // ensure index is valid when images change
  useEffect(() => {
    if (safeLen === 0) setIndex(0);
    else setIndex((i) => ((i % safeLen) + safeLen) % safeLen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeLen]);

  return (
    <div className="td-gallery" ref={containerRef}>
      <div className="td-gallery-main">
        <button
          className="gallery-arrow left"
          onClick={() => select(index - 1)}
          aria-label="Previous"
        >
          ‹
        </button>
        {safeLen > 0 ? (
          <motion.img
            key={index}
            src={images[index]}
            alt={`slide-${index}`}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
          />
        ) : (
          <div className="td-gallery-empty">No images</div>
        )}
        <button
          className="gallery-arrow right"
          onClick={() => select(index + 1)}
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <div className="td-gallery-thumbs">
        {images.map((img, i) => (
          <button
            key={i}
            className={"thumb " + (i === index ? "active" : "")}
            onClick={() => select(i)}
            aria-label={`Show image ${i + 1}`}
          >
            <img src={img} alt={`thumb-${i}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
