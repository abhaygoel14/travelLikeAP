import React from "react";

export default function InclusionExclusion({ include = [], exclude = [] }) {
  return (
    <div className="td-card td-include-exclude">
      <div className="ie-col ie-include">
        <h5>
          <span className="ie-icon include">✓</span>
          Included
        </h5>
        <ul>
          {include.map((it, i) => (
            <li key={i} className="ie-item">
              <span className="ie-badge include">✓</span>
              <span className="ie-label">{it}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="ie-col ie-exclude">
        <h5>
          <span className="ie-icon exclude">×</span>
          Excluded
        </h5>
        <ul>
          {exclude.map((it, i) => (
            <li key={i} className="ie-item">
              <span className="ie-badge exclude">×</span>
              <span className="ie-label">{it}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
