import React from "react";

export default function DetailsCard({
  pickup,
  dropoff,
  category,
  duration,
  dateRange,
}) {
  const detailItems = [
    {
      label: "Pickup & Drop",
      value: [pickup, dropoff].filter(Boolean).join(" to "),
      icon: "ri-map-pin-line",
    },
    {
      label: "Category",
      value: category,
      icon: "ri-briefcase-line",
    },
    {
      label: "Duration",
      value: duration,
      icon: "ri-time-line",
    },
    {
      label: "Date",
      value: dateRange,
      icon: "ri-calendar-line",
    },
  ].filter((item) => item.value);

  return (
    <div className="td-card td-details td-details-shell">
      <h4>Details</h4>
      <div className="td-details-grid">
        {detailItems.map((item) => (
          <div key={item.label} className="td-detail-tile">
            <span className="td-detail-icon">
              <i className={item.icon}></i>
            </span>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
