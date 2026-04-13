import React, { useContext, useEffect, useMemo, useState } from "react";
import "../styles/tour-details.css";
import { Alert, Container, Row, Col } from "reactstrap";
import { useParams } from "react-router-dom";
import { ref, update } from "firebase/database";
import Gallery from "../components/TourDetails/Gallery";
import DetailsCard from "../components/TourDetails/DetailsCard";
import Highlights from "../components/TourDetails/Highlights";
import Itinerary from "../components/TourDetails/Itinerary";
import Packing from "../components/TourDetails/Packing";
import InclusionExclusion from "../components/TourDetails/InclusionExclusion";
import PolicyTable from "../components/TourDetails/PolicyTable";
import GuestReviews, {
  ReviewSnapshotCard,
} from "../components/TourDetails/GuestReviews";
import PriceCard from "../components/TourDetails/PriceCard";
import Newsletter from "../shared/Newsletter";
import useTours from "../hooks/useTours";
import { AuthContext } from "../context/AuthContext";
import { realtimeDb } from "../utils/firebaseConfig";
import { formatPrice, formatTourDateRange } from "../utils/tourSchema";

const TourDetails = () => {
  const { id } = useParams();
  const { tours, loading } = useTours();
  const { user, dispatch } = useContext(AuthContext);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistSaving, setWishlistSaving] = useState(false);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (e) {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  const selectedTour = useMemo(
    () =>
      tours.find(
        (tour) => String(tour.id || tour._id || "") === String(id || ""),
      ) || null,
    [id, tours],
  );

  const images = useMemo(
    () =>
      Array.from(
        new Set(
          (selectedTour?.gallery?.length
            ? selectedTour.gallery
            : [selectedTour?.photo]
          )
            .map((image) => String(image || "").trim())
            .filter(Boolean),
        ),
      ),
    [selectedTour],
  );

  useEffect(() => {
    const currentTourId = String(selectedTour?.id || selectedTour?._id || "");
    const savedWishlist = Array.isArray(user?.wishlist) ? user.wishlist : [];

    setIsWishlisted(
      Boolean(
        currentTourId &&
        savedWishlist.some(
          (item) =>
            String(item?.id || item?._id || item?.tourId || "") ===
            currentTourId,
        ),
      ),
    );
  }, [selectedTour, user]);

  if (loading && !selectedTour) {
    return (
      <section>
        <Container>
          <Alert color="info">Loading tour details...</Alert>
        </Container>
        <Newsletter />
      </section>
    );
  }

  if (!selectedTour) {
    return (
      <section>
        <Container>
          <Alert color="warning">
            This tour could not be found. Please go back to the tours page.
          </Alert>
        </Container>
        <Newsletter />
      </section>
    );
  }

  const details = selectedTour.details || {};
  const includeEx = selectedTour.includeEx || { include: [], exclude: [] };
  const tourDateLabel = formatTourDateRange(
    selectedTour.startDate,
    selectedTour.endDate,
    details.dateRange,
  );
  const highlightItems = selectedTour.highlights?.length
    ? selectedTour.highlights
    : [
        "Scenic viewpoints and curated routes",
        "Comfortable pacing for all travellers",
        "Local experiences and photo stops",
      ];

  const handleWishlistToggle = async () => {
    const currentTourId = String(selectedTour?.id || selectedTour?._id || "");

    if (!currentTourId) {
      return;
    }

    if (!user?.uid) {
      window.alert("Please log in to save this trip to your wishlist.");
      return;
    }

    const currentWishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
    const alreadySaved = currentWishlist.some(
      (item) =>
        String(item?.id || item?._id || item?.tourId || "") === currentTourId,
    );

    const nextWishlist = alreadySaved
      ? currentWishlist.filter(
          (item) =>
            String(item?.id || item?._id || item?.tourId || "") !==
            currentTourId,
        )
      : [
          ...currentWishlist,
          {
            id: currentTourId,
            _id: currentTourId,
            title: selectedTour.title,
            city: selectedTour.city,
            address: selectedTour.address,
            photo: selectedTour.photo,
            price: selectedTour.price,
            startDate: selectedTour.startDate || "",
            endDate: selectedTour.endDate || "",
            addedAt: new Date().toISOString(),
          },
        ];

    try {
      setWishlistSaving(true);

      if (realtimeDb) {
        await update(ref(realtimeDb, `users/${user.uid}`), {
          wishlist: nextWishlist,
          updatedAt: new Date().toISOString(),
        });
      }

      dispatch({
        type: "SET_USER",
        payload: {
          ...user,
          wishlist: nextWishlist,
        },
      });
      setIsWishlisted(!alreadySaved);
    } catch (error) {
      console.error("Error updating wishlist:", error);
      window.alert(error?.message || "Unable to update wishlist right now.");
    } finally {
      setWishlistSaving(false);
    }
  };

  const quickFacts = [
    {
      icon: "ri-map-pin-line",
      value: selectedTour.city,
    },
    {
      icon: "ri-group-line",
      value: `Up to ${selectedTour.maxGroupSize} guests`,
    },
    {
      icon: "ri-road-map-line",
      value: selectedTour.distance
        ? `${selectedTour.distance} km route`
        : "Flexible route",
    },
    ...(tourDateLabel
      ? [
          {
            icon: "ri-calendar-line",
            value: tourDateLabel,
          },
        ]
      : []),
  ];

  const priceCardProps = {
    price: selectedTour.price,
    discounted: selectedTour.discountedPrice || selectedTour.price,
    title: selectedTour.title,
    tourId: selectedTour.id || selectedTour._id || "",
    tourCity: selectedTour.city || "",
    dateRange: tourDateLabel,
    duration: details.duration,
    pricing: selectedTour.pricing,
    coupon: selectedTour.coupon,
    coupons: selectedTour.coupons,
  };

  return (
    <section className="tour-details-page">
      <Container>
        {images.length ? (
          <div className="td-gallery-first">
            <Gallery images={images} />
          </div>
        ) : null}

        <Row className="g-4 align-items-start mb-4">
          <Col lg="8">
            <div className="td-card td-hero-copy">
              <div className="td-hero-topline">
                <span className="td-eyebrow">
                  {selectedTour.featured ? "Featured tour" : "Curated trip"}
                </span>
                {tourDateLabel ? (
                  <span className="td-hero-chip">
                    <i className="ri-calendar-line"></i> {tourDateLabel}
                  </span>
                ) : null}
              </div>
              <div className="td-title-row">
                <h1 className="td-tour-title">{selectedTour.title}</h1>
                <button
                  type="button"
                  className={`td-wishlist-btn ${isWishlisted ? "active" : ""}`}
                  onClick={handleWishlistToggle}
                  disabled={wishlistSaving}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  <i
                    className={isWishlisted ? "ri-heart-fill" : "ri-heart-line"}
                  ></i>
                  <span>
                    {wishlistSaving
                      ? "Saving..."
                      : isWishlisted
                        ? "Wishlisted"
                        : "Wishlist"}
                  </span>
                </button>
              </div>
              <p className="td-tour-subtitle">
                {selectedTour.city} •{" "}
                {selectedTour.address || "Curated by Travel Like AP"}
              </p>
              <p className="td-hero-description">
                {selectedTour.desc ||
                  "A memorable escape planned for comfort, discovery, and local experiences."}
              </p>
              <div className="td-meta-strip">
                {quickFacts.map((fact) => (
                  <span
                    key={`${fact.icon}-${fact.value}`}
                    className="td-meta-pill"
                  >
                    <i className={fact.icon}></i>
                    {fact.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="td-mobile-price-slot d-lg-none">
              <PriceCard {...priceCardProps} />
            </div>

            <DetailsCard
              pickup={details.pickup}
              dropoff={details.dropoff}
              category={details.category}
              duration={details.duration}
              dateRange={tourDateLabel}
            />

            <nav className="td-section-nav" aria-label="Tour detail sections">
              <a href="#overview">Overview</a>
              <a href="#expect">What to Expect</a>
              <a href="#itinerary">Itinerary</a>
              <a href="#inclusions">Included & Excluded</a>
              <a href="#packing">Things to Pack</a>
              <a href="#policies">Policies</a>
              <a href="#reviews">Reviews</a>
            </nav>

            <div id="overview" className="td-card td-overview-card">
              <h4>Overview</h4>
              <p>
                {selectedTour.desc ||
                  "Plan an easy, well-paced trip with scenic moments, practical logistics, and enough free time to enjoy the destination at your own speed."}
              </p>
              <div className="td-overview-grid">
                <div>
                  <span>Starting from</span>
                  <strong>{formatPrice(selectedTour.price)}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>{details.duration || "Flexible"}</strong>
                </div>
                <div>
                  <span>Dates</span>
                  <strong>{tourDateLabel || "Open schedule"}</strong>
                </div>
              </div>
            </div>

            <div id="expect">
              <Highlights items={highlightItems} title="What to Expect" />
            </div>
            <div id="itinerary">
              <Itinerary days={selectedTour.itinerary} />
            </div>
            <div id="inclusions">
              <InclusionExclusion
                include={includeEx.include}
                exclude={includeEx.exclude}
              />
            </div>
            <div id="packing">
              <Packing items={selectedTour.packing} />
            </div>
            <div id="policies">
              <PolicyTable rows={selectedTour.policyRows} />
            </div>
            <div id="reviews">
              <GuestReviews
                reviews={selectedTour.reviews}
                avgRating={selectedTour.avgRating}
                title={selectedTour.title}
              />
            </div>
          </Col>

          <Col lg="4">
            <div className="td-sidebar-stack">
              <ReviewSnapshotCard
                reviews={selectedTour.reviews}
                avgRating={selectedTour.avgRating}
                city={selectedTour.city}
                address={selectedTour.address}
              />

              <div className="d-none d-lg-block">
                <PriceCard {...priceCardProps} />
              </div>

              <div className="td-card td-support-card">
                <h4>Need help planning?</h4>
                <p>
                  Send an enquiry if you want custom stays, transport, or
                  private group planning for this tour.
                </p>
                <div className="td-support-tags">
                  {highlightItems.slice(0, 3).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <Newsletter />
    </section>
  );
};

export default TourDetails;
