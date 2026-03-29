import React from "react";

export default function DetailsCard({ pickup, dropoff, category, duration }) {
  return (
    <div className="td-card td-details">
      <h4>Details</h4>
      <ul>
        <li>
          <strong>Pickup & Drop:</strong> {pickup}
        </li>
        <li>
          <strong>Category:</strong> {category}
        </li>
        <li>
          <strong>Duration:</strong> {duration}
        </li>
      </ul>
    </div>
  );
}
