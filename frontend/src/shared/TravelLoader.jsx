import React, { useEffect, useRef, useState } from "react";
import "./travel-loader.css";

const SkeletonBlock = ({ className = "" }) => (
  <div className={`travel-skeleton-block ${className}`.trim()} />
);

const SkeletonHeader = ({ compact = false }) => (
  <div
    className={`travel-skeleton-section__header ${compact ? "is-compact" : ""}`.trim()}
  >
    <SkeletonBlock className="travel-skeleton-chip" />
    <SkeletonBlock className="travel-skeleton-heading" />
    <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg" />
  </div>
);

const TravelLoader = ({ cards = 4 }) => {
  return (
    <div className="travel-page-skeleton" aria-hidden="true">
      <div className="travel-skeleton-surface travel-skeleton-hero">
        <div className="travel-skeleton-row">
          <SkeletonBlock className="travel-skeleton-avatar" />
          <div className="travel-skeleton-copy">
            <SkeletonBlock className="travel-skeleton-title" />
            <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg" />
            <SkeletonBlock className="travel-skeleton-text" />
          </div>
        </div>
      </div>

      <div className="travel-skeleton-grid">
        {Array.from({ length: cards }).map((_, index) => (
          <TravelCardPlaceholder key={`travel-skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
};

export const TravelCardPlaceholder = () => {
  return (
    <div className="travel-skeleton-surface travel-skeleton-card">
      <SkeletonBlock className="travel-skeleton-card__media" />
      <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
      <SkeletonBlock className="travel-skeleton-card__line" />
      <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--sm" />
      <div className="travel-skeleton-card__footer">
        <SkeletonBlock className="travel-skeleton-card__pill" />
        <SkeletonBlock className="travel-skeleton-card__pill" />
      </div>
    </div>
  );
};

export const TravelCardSkeletons = ({ count = 4 }) => {
  return (
    <div className="travel-skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <TravelCardPlaceholder key={`travel-skeleton-grid-${index}`} />
      ))}
    </div>
  );
};

export const HomePageSkeleton = () => {
  return (
    <div
      className="travel-page-skeleton travel-page-skeleton--wide"
      aria-hidden="true"
    >
      <div className="travel-skeleton-surface travel-skeleton-home-hero">
        <div className="travel-skeleton-copy">
          <SkeletonBlock className="travel-skeleton-chip" />
          <SkeletonBlock className="travel-skeleton-heading travel-skeleton-heading--xl" />
          <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--xl" />
          <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg" />
          <SkeletonBlock className="travel-skeleton-text" />

          <div className="travel-skeleton-search">
            <SkeletonBlock className="travel-skeleton-search__field" />
            <SkeletonBlock className="travel-skeleton-search__field" />
            <SkeletonBlock className="travel-skeleton-search__field" />
            <SkeletonBlock className="travel-skeleton-search__button" />
          </div>
        </div>

        <div className="travel-skeleton-home-media">
          <SkeletonBlock className="travel-skeleton-home-media__item travel-skeleton-home-media__item--tall" />
          <SkeletonBlock className="travel-skeleton-home-media__item travel-skeleton-home-media__item--video" />
          <SkeletonBlock className="travel-skeleton-home-media__item" />
        </div>
      </div>

      <div className="travel-skeleton-surface travel-skeleton-section">
        <SkeletonHeader />
        <div className="travel-skeleton-service-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="travel-skeleton-surface travel-skeleton-service-card"
              key={`service-skeleton-${index}`}
            >
              <SkeletonBlock className="travel-skeleton-icon" />
              <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
              <SkeletonBlock className="travel-skeleton-card__line" />
            </div>
          ))}
        </div>
      </div>

      <div className="travel-skeleton-surface travel-skeleton-section">
        <SkeletonHeader />
        <div className="travel-skeleton-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <TravelCardPlaceholder key={`home-tour-${index}`} />
          ))}
        </div>
      </div>

      <div className="travel-skeleton-home-bottom">
        <div className="travel-skeleton-surface travel-skeleton-section">
          <SkeletonHeader compact />
          <div className="travel-skeleton-gallery-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock
                className="travel-skeleton-gallery-grid__item"
                key={`gallery-skeleton-${index}`}
              />
            ))}
          </div>
        </div>

        <div className="travel-skeleton-surface travel-skeleton-section">
          <SkeletonHeader compact />
          <div className="travel-skeleton-review-list">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                className="travel-skeleton-surface travel-skeleton-review-card"
                key={`review-skeleton-${index}`}
              >
                <SkeletonBlock className="travel-skeleton-avatar travel-skeleton-avatar--sm" />
                <div className="travel-skeleton-copy">
                  <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
                  <SkeletonBlock className="travel-skeleton-card__line" />
                  <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AboutPageSkeleton = () => {
  return (
    <div
      className="travel-page-skeleton travel-page-skeleton--wide"
      aria-hidden="true"
    >
      <div className="travel-skeleton-surface travel-skeleton-about-hero">
        <SkeletonBlock className="travel-skeleton-heading travel-skeleton-heading--xl travel-skeleton-center" />
        <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg travel-skeleton-center" />
        <SkeletonBlock className="travel-skeleton-text travel-skeleton-center" />
      </div>

      {[0, 1, 2].map((item) => (
        <div
          className={`travel-skeleton-surface travel-skeleton-story ${item % 2 ? "is-reverse" : ""}`.trim()}
          key={`about-story-${item}`}
        >
          <SkeletonBlock className="travel-skeleton-story__media" />
          <div className="travel-skeleton-story__copy">
            <SkeletonBlock className="travel-skeleton-heading" />
            <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--xl" />
            <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg" />
            <SkeletonBlock className="travel-skeleton-text" />
            <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--sm" />
          </div>
        </div>
      ))}

      <div className="travel-skeleton-surface travel-skeleton-about-cta">
        <SkeletonBlock className="travel-skeleton-heading travel-skeleton-center" />
        <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg travel-skeleton-center" />
        <SkeletonBlock className="travel-skeleton-card__pill travel-skeleton-center" />
      </div>
    </div>
  );
};

export const ToursPageSkeleton = () => {
  return (
    <div
      className="travel-page-skeleton travel-page-skeleton--wide"
      aria-hidden="true"
    >
      <div className="travel-skeleton-surface travel-skeleton-banner">
        <SkeletonBlock className="travel-skeleton-banner__title" />
        <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg" />
      </div>

      <div className="travel-skeleton-surface travel-skeleton-section">
        <div className="travel-skeleton-search">
          <SkeletonBlock className="travel-skeleton-search__field" />
          <SkeletonBlock className="travel-skeleton-search__field" />
          <SkeletonBlock className="travel-skeleton-search__field" />
          <SkeletonBlock className="travel-skeleton-search__button" />
        </div>
      </div>

      <div className="travel-skeleton-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <TravelCardPlaceholder key={`tour-page-skeleton-${index}`} />
        ))}
      </div>

      <div className="travel-skeleton-pagination">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock
            className="travel-skeleton-pagination__dot"
            key={`tour-page-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

const OverviewDashboardSkeleton = () => (
  <div className="travel-dashboard-grid">
    <div className="travel-dashboard-col">
      <div className="travel-skeleton-surface travel-dashboard-card">
        <SkeletonHeader compact />
        <div className="travel-dashboard-list">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              className="travel-dashboard-list-item"
              key={`trip-card-${index}`}
            >
              <SkeletonBlock className="travel-dashboard-thumb" />
              <div className="travel-skeleton-copy">
                <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
                <SkeletonBlock className="travel-skeleton-card__line" />
                <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="travel-skeleton-surface travel-dashboard-card">
        <SkeletonHeader compact />
        <div className="travel-dashboard-list">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              className="travel-dashboard-list-item travel-dashboard-list-item--wide"
              key={`plan-card-${index}`}
            >
              <SkeletonBlock className="travel-dashboard-thumb travel-dashboard-thumb--wide" />
              <div className="travel-skeleton-copy">
                <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
                <SkeletonBlock className="travel-skeleton-card__line" />
                <SkeletonBlock className="travel-skeleton-card__line" />
                <div className="travel-skeleton-card__footer">
                  <SkeletonBlock className="travel-skeleton-card__pill" />
                  <SkeletonBlock className="travel-skeleton-card__pill" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="travel-dashboard-col">
      <div className="travel-skeleton-surface travel-dashboard-card">
        <SkeletonHeader compact />
        <div className="travel-skeleton-review-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="travel-skeleton-surface travel-skeleton-review-card"
              key={`friend-card-${index}`}
            >
              <SkeletonBlock className="travel-skeleton-avatar travel-skeleton-avatar--sm" />
              <div className="travel-skeleton-copy">
                <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
                <SkeletonBlock className="travel-skeleton-card__line" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="travel-skeleton-surface travel-dashboard-card">
        <SkeletonHeader compact />
        <div className="travel-dashboard-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="travel-dashboard-list-item"
              key={`memory-card-${index}`}
            >
              <SkeletonBlock className="travel-dashboard-thumb" />
              <div className="travel-skeleton-copy">
                <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
                <SkeletonBlock className="travel-skeleton-card__line" />
                <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const GalleryDashboardSkeleton = () => (
  <div className="travel-dashboard-col">
    <div className="travel-skeleton-surface travel-dashboard-card">
      <SkeletonHeader compact />
      <div className="travel-dashboard-gallery">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="travel-skeleton-surface travel-dashboard-gallery-card"
            key={`gallery-card-${index}`}
          >
            <SkeletonBlock className="travel-skeleton-card__media" />
            <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
            <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--sm" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ItineraryDashboardSkeleton = () => (
  <div className="travel-dashboard-col">
    <div className="travel-skeleton-surface travel-dashboard-card">
      <SkeletonHeader compact />
      <div className="travel-dashboard-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="travel-dashboard-list-item travel-dashboard-list-item--wide"
            key={`itinerary-card-${index}`}
          >
            <SkeletonBlock className="travel-dashboard-thumb travel-dashboard-thumb--wide" />
            <div className="travel-skeleton-copy">
              <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--lg" />
              <SkeletonBlock className="travel-skeleton-card__line" />
              <SkeletonBlock className="travel-skeleton-card__line" />
              <div className="travel-skeleton-card__footer">
                <SkeletonBlock className="travel-skeleton-card__pill" />
                <SkeletonBlock className="travel-skeleton-card__pill" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ReceiptDashboardSkeleton = () => (
  <div className="travel-dashboard-receipt">
    <div className="travel-skeleton-surface travel-dashboard-receipt__panel">
      <SkeletonBlock className="travel-skeleton-heading" />
      <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg" />
      <SkeletonBlock className="travel-skeleton-card__media travel-dashboard-thumb--wide" />
      <SkeletonBlock className="travel-skeleton-card__line" />
      <SkeletonBlock className="travel-skeleton-card__line" />
      <SkeletonBlock className="travel-skeleton-card__line travel-skeleton-card__line--sm" />
    </div>

    <div className="travel-skeleton-surface travel-dashboard-receipt__summary">
      <SkeletonHeader compact />
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonBlock
          className={`travel-skeleton-card__line ${index === 3 ? "travel-skeleton-card__line--lg" : ""}`.trim()}
          key={`receipt-line-${index}`}
        />
      ))}
      <div className="travel-skeleton-card__footer">
        <SkeletonBlock className="travel-skeleton-card__pill" />
        <SkeletonBlock className="travel-skeleton-card__pill" />
      </div>
    </div>
  </div>
);

export const TravellerDashboardSkeleton = ({
  variant = "overview",
  embedded = false,
}) => {
  const content =
    variant === "gallery" ? (
      <GalleryDashboardSkeleton />
    ) : variant === "itinerary" ? (
      <ItineraryDashboardSkeleton />
    ) : variant === "receipt" ? (
      <ReceiptDashboardSkeleton />
    ) : (
      <OverviewDashboardSkeleton />
    );

  return (
    <div
      className={`${embedded ? "travel-dashboard-skeleton travel-dashboard-skeleton--embedded" : "travel-page-skeleton travel-page-skeleton--wide travel-dashboard-skeleton"}`.trim()}
      aria-hidden="true"
    >
      {!embedded && (
        <div className="travel-skeleton-surface travel-dashboard-skeleton__hero">
          <div className="travel-skeleton-row">
            <SkeletonBlock className="travel-skeleton-avatar" />
            <div className="travel-skeleton-copy">
              <SkeletonBlock className="travel-skeleton-title" />
              <SkeletonBlock className="travel-skeleton-text travel-skeleton-text--lg" />
              <SkeletonBlock className="travel-skeleton-text" />
            </div>
          </div>
          <div className="travel-dashboard-actions">
            <SkeletonBlock className="travel-skeleton-card__pill" />
            <SkeletonBlock className="travel-skeleton-card__pill" />
          </div>
        </div>
      )}
      {content}
    </div>
  );
};

export const PageRouteSkeleton = ({ pathname = "/" }) => {
  if (pathname.startsWith("/about")) {
    return <AboutPageSkeleton />;
  }

  if (pathname.startsWith("/tours")) {
    return <ToursPageSkeleton />;
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/users")) {
    return <TravellerDashboardSkeleton />;
  }

  if (pathname === "/" || pathname.startsWith("/home")) {
    return <HomePageSkeleton />;
  }

  return <TravelLoader cards={4} />;
};

export const MediaWithShimmer = ({
  as = "img",
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  onLoad,
  onLoadedData,
  onLoadedMetadata,
  onCanPlay,
  onCanPlayThrough,
  onError,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const mediaRef = useRef(null);
  const Tag = as;

  useEffect(() => {
    setLoaded(false);
  }, [as, src]);

  useEffect(() => {
    const mediaElement = mediaRef.current;

    if (!mediaElement) {
      return undefined;
    }

    const markReady = () => {
      setLoaded(true);
    };

    if (as === "video") {
      if (typeof mediaElement.readyState === "number" && mediaElement.readyState >= 1) {
        markReady();
      }
    } else if (mediaElement.complete) {
      markReady();
    }

    mediaElement.addEventListener("loadedmetadata", markReady);
    mediaElement.addEventListener("loadeddata", markReady);
    mediaElement.addEventListener("canplay", markReady);
    mediaElement.addEventListener("canplaythrough", markReady);

    return () => {
      mediaElement.removeEventListener("loadedmetadata", markReady);
      mediaElement.removeEventListener("loadeddata", markReady);
      mediaElement.removeEventListener("canplay", markReady);
      mediaElement.removeEventListener("canplaythrough", markReady);
    };
  }, [as, src]);

  const handleReady = (event) => {
    setLoaded(true);
    onLoad?.(event);
    onLoadedData?.(event);
    onLoadedMetadata?.(event);
    onCanPlay?.(event);
    onCanPlayThrough?.(event);
  };

  const handleError = (event) => {
    setLoaded(true);
    onError?.(event);
  };

  return (
    <div className={`travel-media-shell ${wrapperClassName}`.trim()}>
      {!loaded && (
        <div className="travel-skeleton-block travel-media-placeholder" />
      )}
      <Tag
        ref={mediaRef}
        src={src}
        alt={as === "video" ? undefined : alt}
        className={`${className} ${loaded ? "is-loaded" : "is-loading"}`.trim()}
        onLoad={handleReady}
        onLoadedData={handleReady}
        onLoadedMetadata={handleReady}
        onCanPlay={handleReady}
        onCanPlayThrough={handleReady}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default TravelLoader;
