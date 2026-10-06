// Numbers for the watchlist's Stats tab, worked out from the watchlist entries alone
// (no extra OMDb requests).

// "2010" -> 2010; series like "2008–2013" count from the year they started.
const startYear = (movie) => parseInt(movie.Year, 10) || null;

export const watchlistStats = (watchlist) => {
  const watched = watchlist.filter((m) => m.watched);
  const rated = watched.filter((m) => m.rating);
  const average = rated.length ? rated.reduce((sum, m) => sum + m.rating, 0) / rated.length : null;

  const ratings = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: rated.filter((m) => m.rating === stars).length,
  }));

  // Every decade from the oldest to the newest watched movie, including empty ones,
  // so gaps show as gaps instead of the bars silently closing up.
  const decadeOf = (m) => Math.floor(startYear(m) / 10) * 10;
  const dated = watched.filter(startYear);
  const decades = [];
  if (dated.length) {
    const all = dated.map(decadeOf);
    for (let d = Math.min(...all); d <= Math.max(...all); d += 10) {
      decades.push({ decade: d, count: all.filter((x) => x === d).length });
    }
  }

  return {
    watchedCount: watched.length,
    toWatchCount: watchlist.length - watched.length,
    ratedCount: rated.length,
    average,
    ratings,
    decades,
  };
};
