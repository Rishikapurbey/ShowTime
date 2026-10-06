import React from 'react';
import { watchlistStats } from '../lib/stats';
import BarChart from './BarChart';
import './StatsPanel.css';

const plural = (n, word) => `${word}${n === 1 ? '' : 's'}`;
const percent = (part, whole) => `${Math.round((part / whole) * 100)}%`;

const StatTile = ({ label, value, note }) => (
  <div className="stat-tile">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
    {note && <span className="stat-note">{note}</span>}
  </div>
);

// The Stats tab: headline numbers, then how you rate and which decades you watch.
const StatsPanel = ({ watchlist }) => {
  const stats = watchlistStats(watchlist);

  return (
    <div className="stats-panel">
      <div className="stat-tiles">
        <StatTile label="Watched" value={stats.watchedCount} note={plural(stats.watchedCount, 'movie')} />
        <StatTile label="To watch" value={stats.toWatchCount} note={plural(stats.toWatchCount, 'movie')} />
        <StatTile
          label="Average rating"
          value={stats.average === null ? '–' : `${stats.average.toFixed(1)} ★`}
          note={stats.ratedCount ? `from ${stats.ratedCount} rated` : 'Rate a watched movie to see this'}
        />
      </div>

      {stats.watchedCount === 0 ? (
        <p className="watchlist-message">Mark movies as watched to see how you rate them and which decades you watch.</p>
      ) : (
        <div className="stats-charts">
          {stats.ratedCount > 0 ? (
            <BarChart
              id="ratings-chart"
              title="Your ratings"
              rows={stats.ratings.map(({ stars, count }) => ({
                key: stars,
                label: `${stars} ★`,
                value: count,
                detail: `${plural(count, 'movie')} · ${percent(count, stats.ratedCount)} of rated`,
              }))}
            />
          ) : (
            <div className="stats-empty">
              <h3>Your ratings</h3>
              <p>Rate the movies you've watched to see how your ratings spread out.</p>
            </div>
          )}

          {stats.decades.length > 0 && (
            <BarChart
              id="decades-chart"
              title="Your decades"
              rows={stats.decades.map(({ decade, count }) => ({
                key: decade,
                label: `${decade}s`,
                value: count,
                detail: `${plural(count, 'movie')} · ${percent(count, stats.watchedCount)} of watched`,
              }))}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
