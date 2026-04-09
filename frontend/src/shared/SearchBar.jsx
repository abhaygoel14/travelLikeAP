import React, { useEffect, useMemo, useState } from "react";
import "./search-bar.css";
import { Col, Form, FormGroup } from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";

const SearchBar = ({
  summaryText = "",
  hasActiveFilters = false,
  onClear = null,
}) => {
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const queryParams = useMemo(
    () => new URLSearchParams(currentLocation.search),
    [currentLocation.search],
  );
  const [filters, setFilters] = useState({
    city: queryParams.get("city") || "",
    startDate: queryParams.get("startDate") || "",
    endDate: queryParams.get("endDate") || "",
  });

  useEffect(() => {
    setFilters({
      city: queryParams.get("city") || "",
      startDate: queryParams.get("startDate") || "",
      endDate: queryParams.get("endDate") || "",
    });
  }, [queryParams]);

  const updateField = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const searchHandler = (event) => {
    if (event) {
      event.preventDefault();
    }

    if (
      filters.startDate &&
      filters.endDate &&
      new Date(filters.startDate) > new Date(filters.endDate)
    ) {
      window.alert("Start date must be before end date");
      return;
    }

    const params = new URLSearchParams();

    if (String(filters.city || "").trim()) {
      params.set("city", String(filters.city).trim());
    }

    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }

    const nextQuery = params.toString();
    navigate(nextQuery ? `/tours/search?${nextQuery}` : "/tours/search");
  };

  const handleClear = () => {
    setFilters({ city: "", startDate: "", endDate: "" });

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
          <FormGroup className="d-flex gap-3 form__group form__group-fast">
            <span>
              <i className="ri-map-pin-line"></i>
            </span>
            <div>
              <h6>Location</h6>
              <input
                type="text"
                placeholder="Where are you going?"
                value={filters.city}
                onChange={(event) => updateField("city", event.target.value)}
              />
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
