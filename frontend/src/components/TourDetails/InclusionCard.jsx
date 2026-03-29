import React from "react";

export default function InclusionCard({ items = [] }) {
  return (
    <div className="td-card td-inclusion">
      <h4>Inclusions</h4>
      <ul>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
