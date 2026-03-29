import React from "react";

export default function InclusionExclusion({ include = [], exclude = [] }) {
  return (
    <div className="td-card td-include-exclude">
      <div className="ie-col">
        <h5>Included</h5>
        <ul>
          {include.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </div>
      <div className="ie-col">
        <h5>Excluded</h5>
        <ul>
          {exclude.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
