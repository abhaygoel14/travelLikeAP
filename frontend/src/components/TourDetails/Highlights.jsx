import React from "react";

export default function Highlights({ items = [], title = "Trip Highlights" }) {
  return (
    <div className="td-card td-highlights">
      <h4>{title}</h4>
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
