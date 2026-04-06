import React, { useState } from "react";
import "./travel-loader.css";

const TravelLoader = ({ cards = 4 }) => {
  return (
    <div className="travel-page-skeleton" aria-hidden="true">
      <div className="travel-skeleton-surface travel-skeleton-hero">
        <div className="travel-skeleton-row">
          <div className="travel-skeleton-block travel-skeleton-avatar" />
          <div className="travel-skeleton-copy">
            <div className="travel-skeleton-block travel-skeleton-title" />
            <div className="travel-skeleton-block travel-skeleton-text travel-skeleton-text--lg" />
            <div className="travel-skeleton-block travel-skeleton-text" />
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
      <div className="travel-skeleton-block travel-skeleton-card__media" />
      <div className="travel-skeleton-block travel-skeleton-card__line travel-skeleton-card__line--lg" />
      <div className="travel-skeleton-block travel-skeleton-card__line" />
      <div className="travel-skeleton-block travel-skeleton-card__line travel-skeleton-card__line--sm" />
      <div className="travel-skeleton-card__footer">
        <div className="travel-skeleton-block travel-skeleton-card__pill" />
        <div className="travel-skeleton-block travel-skeleton-card__pill" />
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

export const MediaWithShimmer = ({
  as = "img",
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  onLoad,
  onLoadedData,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const Tag = as;

  const handleReady = (event) => {
    setLoaded(true);
    onLoad?.(event);
    onLoadedData?.(event);
  };

  return (
    <div className={`travel-media-shell ${wrapperClassName}`.trim()}>
      {!loaded && (
        <div className="travel-skeleton-block travel-media-placeholder" />
      )}
      <Tag
        src={src}
        alt={as === "video" ? undefined : alt}
        className={`${className} ${loaded ? "is-loaded" : "is-loading"}`.trim()}
        onLoad={handleReady}
        onLoadedData={handleReady}
        {...props}
      />
    </div>
  );
};

export default TravelLoader;
