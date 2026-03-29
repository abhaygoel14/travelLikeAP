import React from "react";

export default function PolicyTable({ rows = [] }) {
  return (
    <div className="td-card td-policy">
      <h4>Cancellation & Payment Terms</h4>
      <table className="policy-table">
        <thead>
          <tr>
            <th>Days Before</th>
            <th>Refund</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.days}</td>
              <td>{r.refund}</td>
              <td>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
