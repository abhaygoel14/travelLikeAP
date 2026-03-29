import React from "react";

export default function Highlights({ items = [] }) {
  return (
    <div className="td-card td-highlights">
      <h4>Trip Highlights</h4>
      <div className="highlights-grid">
        {items.map((h, i) => (
          <div key={i} className="highlight-item">
            {h}
          </div>
        ))}
      </div>
    </div>
  );
}
