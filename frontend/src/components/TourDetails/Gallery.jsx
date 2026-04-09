import "./tour-details-components.css";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { motion } from "framer-motion";

export default function Gallery({ images = [] }) {
  const [index, setIndex] = useState(0);
  const [readyMap, setReadyMap] = useState({});
  const startX = useRef(null);
  const containerRef = useRef(null);

  const normalizedImages = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(images) ? images : [])
            .map((image) => String(image || "").trim())
            .filter(Boolean),
        ),
      ),
    [images],
  );

  const safeLen = normalizedImages.length;

  const markImageReady = useCallback((src) => {
    if (!src) {
      return;
    }

    setReadyMap((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }, []);

  const select = (i) => {
    if (safeLen === 0) return;
    setIndex(((i % safeLen) + safeLen) % safeLen);
  };

  useEffect(() => {
    if (!safeLen) {
      setReadyMap({});
      return;
    }

    let cancelled = false;
    setReadyMap({});

    normalizedImages.forEach((src) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = src;

      if (image.complete) {
        if (!cancelled) {
          markImageReady(src);
        }
        return;
      }

      image.onload = () => {
        if (!cancelled) {
          markImageReady(src);
        }
      };

      image.onerror = () => {
        if (!cancelled) {
          markImageReady(src);
        }
      };
    });

    return () => {
      cancelled = true;
    };
  }, [markImageReady, normalizedImages, safeLen]);

  // keyboard navigation
  useEffect(() => {
    if (!safeLen) {
      return undefined;
    }

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
    if (!el || !safeLen) return undefined;

    const onTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
      if (startX.current == null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(dx) > 40) {
        if (dx < 0) {
          setIndex((i) => (((i + 1) % safeLen) + safeLen) % safeLen);
        } else {
          setIndex((i) => (((i - 1) % safeLen) + safeLen) % safeLen);
        }
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
    if (safeLen === 0) {
      setIndex(0);
    } else {
      setIndex((i) => ((i % safeLen) + safeLen) % safeLen);
    }
  }, [safeLen]);

  const currentImage = normalizedImages[index] || "";
  const sideImages = normalizedImages
    .map((img, imageIndex) => ({ img, imageIndex }))
    .filter((item) => item.imageIndex !== index)
    .slice(0, 4);

  if (!safeLen) {
    return null;
  }

  return (
    <div className="td-gallery" ref={containerRef}>
      <div className="td-gallery-layout">
        <div className="td-gallery-main">
          {!readyMap[currentImage] ? (
            <div
              className="td-gallery-skeleton td-gallery-skeleton--main"
              aria-hidden="true"
            />
          ) : null}

          <button
            className="gallery-arrow left"
            onClick={() => select(index - 1)}
            aria-label="Previous"
            disabled={safeLen <= 1}
          >
            ‹
          </button>

          <motion.img
            key={currentImage}
            src={currentImage}
            alt={`Tour image ${index + 1}`}
            className={readyMap[currentImage] ? "is-loaded" : "is-loading"}
            initial={{ opacity: 0.05, scale: 0.985 }}
            animate={{
              opacity: readyMap[currentImage] ? 1 : 0.05,
              scale: readyMap[currentImage] ? 1 : 0.985,
            }}
            transition={{ duration: 0.35 }}
            onLoad={() => markImageReady(currentImage)}
            onError={() => markImageReady(currentImage)}
          />

          <button
            className="gallery-arrow right"
            onClick={() => select(index + 1)}
            aria-label="Next"
            disabled={safeLen <= 1}
          >
            ›
          </button>

          <span className="td-gallery-counter">
            {index + 1}/{safeLen}
          </span>
        </div>

        {sideImages.length ? (
          <div className="td-gallery-side">
            {sideImages.map(({ img, imageIndex }, tileIndex) => (
              <button
                key={`${img}-${imageIndex}`}
                type="button"
                className="td-gallery-tile"
                onClick={() => select(imageIndex)}
                aria-label={`Show image ${imageIndex + 1}`}
              >
                {!readyMap[img] ? (
                  <div
                    className="td-gallery-skeleton td-gallery-skeleton--tile"
                    aria-hidden="true"
                  />
                ) : null}

                <img
                  src={img}
                  alt={`Tour thumbnail ${imageIndex + 1}`}
                  className={readyMap[img] ? "is-loaded" : "is-loading"}
                  loading="lazy"
                  onLoad={() => markImageReady(img)}
                  onError={() => markImageReady(img)}
                />

                {tileIndex === sideImages.length - 1 && safeLen > 5 ? (
                  <span className="td-gallery-more">+{safeLen - 5}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
