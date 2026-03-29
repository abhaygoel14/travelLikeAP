import React from "react";

export default function Itinerary({ days = [] }) {
  return (
    <div className="td-card td-itinerary">
      <h4>Itinerary</h4>
      {days.map((d, i) => (
        <div key={i} className="itinerary-day">
          <h5>
            Day {i + 1}: {d.title}
          </h5>
          <p>{d.desc}</p>
        </div>
      ))}
    </div>
  );
}
