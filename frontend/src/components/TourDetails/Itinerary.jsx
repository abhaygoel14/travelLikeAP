import React, { useState } from "react";

export default function Itinerary({ days = [] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="td-card td-itinerary">
      <h4>Itinerary</h4>
      {days.map((d, i) => {
        const isOpen = openIndex === i;

        return (
          <div key={i} className={`itinerary-day ${isOpen ? "open" : ""}`}>
            <button
              type="button"
              className="itinerary-toggle"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
            >
              <span className="itinerary-day-label">Day {i + 1}</span>
              <strong>{d.title}</strong>
              <i
                className={
                  isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"
                }
              ></i>
            </button>
            {isOpen ? (
              <div className="itinerary-panel">
                <p>{d.desc}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
