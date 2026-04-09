import React from "react";

export default function InclusionCard({ items = [] }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className="td-card td-inclusion">
      <h4>Inclusions</h4>
      <div className="highlights-grid td-inclusion-grid">
        {safeItems.map((it, i) => (
          <div key={i} className="highlight-item td-inclusion-chip">
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}
