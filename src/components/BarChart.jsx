import React, { useState } from 'react';
import './BarChart.css';

// Horizontal bar chart for one series of counts.
// rows: [{ key, label, value, detail }], where `detail` follows the value in the tooltip
// and table (e.g. "movies · 40%"). Only the largest bar(s) are labeled; hovering or focusing
// any bar shows its value, and "Show table" lists every value.
const BarChart = ({ id, title, rows }) => {
  const [showTable, setShowTable] = useState(false);
  const [active, setActive] = useState(null);

  const max = Math.max(1, ...rows.map((r) => r.value));
  // Label every bar tied for the top, so equal-length bars don't look different.
  const isPeak = (r) => r.value === max && r.value > 0;

  return (
    <figure className="bar-chart" aria-labelledby={`${id}-title`}>
      <div className="bar-chart-header">
        <h3 id={`${id}-title`}>{title}</h3>
        <button className="bar-chart-toggle" onClick={() => setShowTable((s) => !s)} aria-pressed={showTable}>
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>

      {showTable ? (
        <table className="bar-chart-table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.label}</th>
                <td>{r.value}</td>
                <td className="bar-chart-table-detail">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="bar-chart-rows" role="list">
          {rows.map((r) => (
            <div
              key={r.key}
              role="listitem"
              tabIndex={0}
              aria-label={`${r.label}: ${r.value} ${r.detail}`}
              className={`bar-row ${active === r.key ? 'active' : ''}`}
              onPointerEnter={() => setActive(r.key)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(r.key)}
              onBlur={() => setActive(null)}
            >
              <span className="bar-label" aria-hidden="true">{r.label}</span>
              <span className="bar-track" aria-hidden="true" style={{ '--fraction': r.value / max }}>
                {r.value > 0 && <span className="bar" />}
                {isPeak(r) && <span className="bar-value">{r.value}</span>}
                {active === r.key && (
                  <span className="bar-tooltip">
                    <strong>{r.value}</strong> {r.detail}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
};

export default BarChart;
