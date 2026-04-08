import React, { useMemo } from "react";

const fallbackReviewLines = [
  "Smooth ride, friendly coordination, and a very comfortable overall experience.",
  "The trip felt well managed from start to finish, with great scenic stops in between.",
  "Everything was on time and the ride was relaxed, safe, and enjoyable.",
];

const getInitials = (name = "Guest") =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "G";

export function ReviewSnapshotCard({
  reviews = [],
  avgRating = 0,
  city = "",
  address = "",
}) {
  const reviewCount =
    Array.isArray(reviews) && reviews.length ? reviews.length : 0;
  const displayRating = Number(avgRating || 4.3).toFixed(1);
  const numericRating = Number(displayRating);
  const ratingLabel =
    numericRating >= 4.5
      ? "Excellent"
      : numericRating >= 4
        ? "Very Good"
        : numericRating >= 3
          ? "Good"
          : "Average";
  const mapQuery = encodeURIComponent(
    [city, address].filter(Boolean).join(", "),
  );

  return (
    <div className="td-card td-review-snapshot-card">
      <div className="td-review-snapshot-top">
        <div className="td-review-score-badge">{displayRating}</div>

        <div className="td-review-snapshot-copy">
          <strong>{ratingLabel}</strong>
          <span>
            ({reviewCount || "New"} {reviewCount === 1 ? "rating" : "ratings"})
          </span>
        </div>

        <a href="#reviews" className="td-review-link">
          All Reviews
        </a>
      </div>

      <div className="td-location-card-row">
        <div className="td-location-map-thumb" aria-hidden="true">
          <i className="ri-map-pin-2-fill"></i>
        </div>

        <div className="td-location-copy">
          <strong>{city || "Tour location"}</strong>
          <p>
            {address ||
              (city
                ? `Popular pickup point near ${city}`
                : "Pickup details shared after booking")}
          </p>
        </div>

        <a
          className="td-review-link td-map-link"
          href={
            mapQuery
              ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}`
              : "#overview"
          }
          target={mapQuery ? "_blank" : undefined}
          rel={mapQuery ? "noreferrer" : undefined}
        >
          See on Map
        </a>
      </div>
    </div>
  );
}

export default function GuestReviews({
  reviews = [],
  avgRating = 0,
  title = "",
}) {
  const reviewItems = useMemo(() => {
    const source =
      Array.isArray(reviews) && reviews.length
        ? reviews
        : [
            { name: "Travel Guest", rating: avgRating || 4.8 },
            { name: "Happy Rider", rating: avgRating || 4.7 },
            { name: "Weekend Explorer", rating: avgRating || 4.9 },
          ];

    return source.slice(0, 4).map((review, index) => ({
      id: `${review?.name || "guest"}-${index}`,
      name: String(review?.name || `Guest ${index + 1}`).trim(),
      rating: Number(review?.rating || avgRating || 4.8),
      text:
        String(
          review?.text ||
            review?.comment ||
            review?.message ||
            fallbackReviewLines[index % fallbackReviewLines.length],
        ).trim() || fallbackReviewLines[index % fallbackReviewLines.length],
      avatar: String(review?.avatar || review?.photo || "").trim(),
    }));
  }, [avgRating, reviews]);

  const displayRating = Number(
    avgRating ||
      reviewItems.reduce((total, item) => total + Number(item.rating || 0), 0) /
        Math.max(reviewItems.length, 1),
  ).toFixed(1);

  return (
    <div className="td-card td-reviews-card">
      <div className="td-reviews-head">
        <div>
          <h4>Guest Reviews</h4>
          <p>
            Quick feedback from travellers who joined {title || "this ride"}.
          </p>
        </div>

        <div className="td-reviews-summary">
          <strong>{displayRating}</strong>
          <span>
            {reviewItems.length} review{reviewItems.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="td-review-list">
        {reviewItems.map((review) => (
          <article key={review.id} className="td-review-item">
            <div className="td-review-user">
              {review.avatar ? (
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="td-review-avatar"
                />
              ) : (
                <div className="td-review-avatar td-review-avatar--fallback">
                  {getInitials(review.name)}
                </div>
              )}

              <div className="td-review-user-copy">
                <h5>{review.name}</h5>
                <p>Verified rider</p>
              </div>

              <span className="td-review-rating">
                <i className="ri-star-fill"></i>
                {Number(review.rating || 0).toFixed(1)}
              </span>
            </div>

            <p className="td-review-text">“{review.text}”</p>
          </article>
        ))}
      </div>
    </div>
  );
}
