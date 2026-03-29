import React from "react";

export default function Packing({ items = [] }) {
  return (
    <div className="td-card td-packing">
      <h4>Things to Pack</h4>
      <ul>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
