import React from "react";

export default function InclusionExclusion({ include = [], exclude = [] }) {
  const includedItems = Array.isArray(include) ? include.filter(Boolean) : [];
  const excludedItems = Array.isArray(exclude) ? exclude.filter(Boolean) : [];

  return (
    <div className="td-card td-include-exclude">
      <div className="ie-col ie-include">
        <h5>Included</h5>
        <div className="highlights-grid ie-grid">
          {includedItems.map((it, i) => (
            <div
              key={`include-${i}`}
              className="highlight-item ie-chip include"
            >
              {it}
            </div>
          ))}
        </div>
      </div>
      <div className="ie-col ie-exclude">
        <h5>Excluded</h5>
        <div className="highlights-grid ie-grid">
          {excludedItems.map((it, i) => (
            <div
              key={`exclude-${i}`}
              className="highlight-item ie-chip exclude"
            >
              {it}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
