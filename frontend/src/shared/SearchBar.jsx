import React, { useEffect, useMemo, useState } from "react";
import "./search-bar.css";
import { Col, Form, FormGroup } from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import useTours from "../hooks/useTours";

const SearchBar = ({
  summaryText = "",
  hasActiveFilters = false,
  onClear = null,
}) => {
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const { tours } = useTours();
  const queryParams = useMemo(
    () => new URLSearchParams(currentLocation.search),
    [currentLocation.search],
  );
  const [filters, setFilters] = useState({
    city: queryParams.get("city") || "",
    startDate: queryParams.get("startDate") || "",
    endDate: queryParams.get("endDate") || "",
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityQuery = String(filters.city || "").trim();
  const shouldShowSuggestionDropdown = showSuggestions && Boolean(cityQuery);

  const locationSuggestions = useMemo(() => {
    const query = String(filters.city || "")
      .trim()
      .toLowerCase();

    if (!query) {
      return [];
    }

    const uniquePlaces = Array.from(
      new Set(
        tours
          .flatMap((tour) => [tour?.city, tour?.title])
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    );

    return uniquePlaces
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 6);
  }, [filters.city, tours]);

  useEffect(() => {
    setFilters({
      city: queryParams.get("city") || "",
      startDate: queryParams.get("startDate") || "",
      endDate: queryParams.get("endDate") || "",
    });
  }, [queryParams]);

  useEffect(() => {
    if (currentLocation.pathname !== "/tours/search") {
      return undefined;
    }

    const trimmedCity = String(filters.city || "").trim();
    const shouldAutoFilter =
      trimmedCity.length >= 2 ||
      (!trimmedCity && Boolean(filters.startDate || filters.endDate));

    if (!shouldAutoFilter) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();

      if (trimmedCity) {
        params.set("city", trimmedCity);
      }

      if (filters.startDate) {
        params.set("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.set("endDate", filters.endDate);
      }

      const nextQuery = params.toString();
      const nextUrl = nextQuery
        ? `/tours/search?${nextQuery}`
        : "/tours/search";
      const currentUrl = `${currentLocation.pathname}${currentLocation.search}`;

      if (nextUrl !== currentUrl) {
        navigate(nextUrl);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [
    currentLocation.pathname,
    currentLocation.search,
    filters.city,
    filters.endDate,
    filters.startDate,
    navigate,
  ]);

  const updateField = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "city") {
      setShowSuggestions(Boolean(String(value || "").trim()));
    }
  };

  const searchHandler = (event, nextFilters = filters) => {
    if (event) {
      event.preventDefault();
    }

    if (
      nextFilters.startDate &&
      nextFilters.endDate &&
      new Date(nextFilters.startDate) > new Date(nextFilters.endDate)
    ) {
      window.alert("Start date must be before end date");
      return;
    }

    const params = new URLSearchParams();

    if (String(nextFilters.city || "").trim()) {
      params.set("city", String(nextFilters.city).trim());
    }

    if (nextFilters.startDate) {
      params.set("startDate", nextFilters.startDate);
    }

    if (nextFilters.endDate) {
      params.set("endDate", nextFilters.endDate);
    }

    const nextQuery = params.toString();
    navigate(nextQuery ? `/tours/search?${nextQuery}` : "/tours/search");
  };

  const handleSuggestionSelect = (value) => {
    const nextFilters = {
      ...filters,
      city: value,
    };

    setFilters(nextFilters);
    setShowSuggestions(false);
    searchHandler(null, nextFilters);
  };

  const handleClear = () => {
    setFilters({ city: "", startDate: "", endDate: "" });
    setShowSuggestions(false);

    if (typeof onClear === "function") {
      onClear();
      return;
    }

    navigate("/tours/search");
  };

  return (
    <Col lg="12">
      <div className="search__bar">
        <Form
          className="d-flex align-items-center gap-4"
          onSubmit={searchHandler}
        >
          <FormGroup className="d-flex gap-3 form__group form__group-fast form__group-location">
            <span>
              <i className="ri-map-pin-line"></i>
            </span>
            <div className="form__group-copy">
              <h6>Location</h6>
              <input
                type="text"
                placeholder="Where are you going?"
                value={filters.city}
                onChange={(event) => updateField("city", event.target.value)}
                onFocus={() => setShowSuggestions(Boolean(cityQuery))}
                onBlur={() => {
                  window.setTimeout(() => {
                    setShowSuggestions(false);
                  }, 120);
                }}
              />

              {shouldShowSuggestionDropdown ? (
                <div className="search__suggestions">
                  {locationSuggestions.length ? (
                    locationSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="search__suggestion"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSuggestionSelect(item)}
                      >
                        <i className="ri-map-pin-2-line" aria-hidden="true" />
                        <span>{item}</span>
                      </button>
                    ))
                  ) : (
                    <div className="search__suggestion-empty">
                      No results found for "{cityQuery}"
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </FormGroup>

          <FormGroup className="d-flex gap-3 form__group form__group-fast">
            <span>
              <i className="ri-calendar-line"></i>
            </span>
            <div>
              <h6>Start Date</h6>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
              />
            </div>
          </FormGroup>

          <FormGroup className="d-flex gap-3 form__group">
            <span>
              <i className="ri-calendar-check-line"></i>
            </span>
            <div>
              <h6>End Date</h6>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
            </div>
          </FormGroup>

          <button
            className="search__icon"
            type="submit"
            aria-label="Search tours"
          >
            <i className="ri-search-line"></i>
          </button>
        </Form>

        {summaryText || hasActiveFilters ? (
          <div className="search__bar-meta">
            {summaryText ? (
              <p className="search__bar-message">{summaryText}</p>
            ) : (
              <span />
            )}
            {hasActiveFilters ? (
              <button
                type="button"
                className="search__clear-btn"
                onClick={handleClear}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Col>
  );
};

export default SearchBar;
