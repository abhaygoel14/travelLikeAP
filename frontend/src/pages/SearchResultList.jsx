import React, { useMemo } from "react";
import CommonSection from "./../shared/CommonSection";
import { Button, Col, Container, Row } from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import TourCard from "../shared/TourCard";
import Newsletter from "./../shared/Newsletter";
import SearchBar from "../shared/SearchBar";
import useTours from "../hooks/useTours";
import { TravelCardPlaceholder } from "../shared/TravelLoader";

const SearchResultList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tours, loading } = useTours();

  const filters = useMemo(() => {
    const query = new URLSearchParams(location.search);

    return {
      city: String(query.get("city") || "").trim(),
      startDate: String(query.get("startDate") || "").trim(),
      endDate: String(query.get("endDate") || "").trim(),
    };
  }, [location.search]);

  const hasActiveFilters = Boolean(
    filters.city || filters.startDate || filters.endDate,
  );

  const filteredTours = useMemo(() => {
    const requestedStart = filters.startDate
      ? new Date(filters.startDate).getTime()
      : null;
    const requestedEnd = filters.endDate
      ? new Date(filters.endDate).getTime()
      : null;

    return tours.filter((tour) => {
      const cityText = String(tour.city || "").toLowerCase();
      const titleText = String(tour.title || "").toLowerCase();
      const locationQuery = filters.city.toLowerCase();
      const matchesCity =
        !locationQuery ||
        cityText.includes(locationQuery) ||
        titleText.includes(locationQuery);

      if (!matchesCity) {
        return false;
      }

      if (!requestedStart && !requestedEnd) {
        return true;
      }

      const tourStartValue = tour.startDate || tour.details?.startDate || "";
      const tourEndValue =
        tour.endDate || tour.details?.endDate || tour.startDate || "";
      const tourStart = tourStartValue
        ? new Date(tourStartValue).getTime()
        : null;
      const tourEnd = tourEndValue
        ? new Date(tourEndValue).getTime()
        : tourStart;

      if (!tourStart && !tourEnd) {
        return false;
      }

      if (requestedStart && requestedEnd) {
        return (
          (tourEnd || tourStart) >= requestedStart &&
          (tourStart || tourEnd) <= requestedEnd
        );
      }

      if (requestedStart) {
        return (tourEnd || tourStart) >= requestedStart;
      }

      return (tourStart || tourEnd) <= requestedEnd;
    });
  }, [filters.city, filters.endDate, filters.startDate, tours]);

  const summaryText = useMemo(() => {
    if (loading) {
      return "Loading tours available from Firebase...";
    }

    if (hasActiveFilters) {
      if (filteredTours.length) {
        return `✨ Explore ${filteredTours.length} available tour${filteredTours.length > 1 ? "s" : ""}${filters.city ? ` in ${filters.city}` : ""}.`;
      }

      return "No matching tours found right now. Try another city or date range.";
    }

    return `✨ Explore ${tours.length} tours currently available from our latest collection.`;
  }, [
    filters.city,
    filteredTours.length,
    hasActiveFilters,
    loading,
    tours.length,
  ]);

  const handleClearFilters = () => {
    navigate("/tours/search");
  };

  return (
    <>
      <CommonSection
        title={hasActiveFilters ? "Filtered Tours" : "Explore Tours"}
      />
      <section>
        <Container>
          <Row>
            <SearchBar
              summaryText={summaryText}
              hasActiveFilters={hasActiveFilters}
              onClear={handleClearFilters}
            />
          </Row>

          <Row className="mt-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Col
                    lg="3"
                    md="6"
                    sm="6"
                    className="mb-4"
                    key={`search-skeleton-${index}`}
                  >
                    <TravelCardPlaceholder />
                  </Col>
                ))
              : filteredTours.map((tour) => (
                  <Col
                    lg="3"
                    md="6"
                    sm="6"
                    className="mb-4"
                    key={tour.id || tour._id}
                  >
                    <TourCard tour={tour} />
                  </Col>
                ))}

            {!loading && !filteredTours.length ? (
              <Col lg="12">
                <div className="search-results-empty text-center">
                  <h4>No tours match this filter</h4>
                  <p>
                    Explore the currently available trips or clear filters to
                    browse all tours.
                  </p>
                  {hasActiveFilters ? (
                    <Button color="primary" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              </Col>
            ) : null}
          </Row>
        </Container>
      </section>
      <Newsletter />
    </>
  );
};

export default SearchResultList;
