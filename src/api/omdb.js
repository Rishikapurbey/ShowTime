import axios from 'axios';

const omdb = axios.create({
  baseURL: 'https://www.omdbapi.com/',
  params: { apikey: import.meta.env.VITE_OMDB_KEY },
});

const escapeXml = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

// Splits a title into lines of at most `width` characters (hard-splitting very long words),
// ending with "…" when it needs more than `maxLines`.
export const wrapTitle = (title, width = 16, maxLines = 4) => {
  const words = title.trim().split(/\s+/).filter(Boolean)
    .flatMap((word) => word.match(new RegExp(`.{1,${width}}`, 'gu')));
  const lines = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= width) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, width - 1).trimEnd()}…`;
  }
  return lines;
};

// A stand-in poster: a film-frame icon and the title on a dark gradient.
export const placeholderPoster = (title = '') => {
  const lines = wrapTitle(title);
  const shown = lines.length ? lines : ['No poster'];
  const lineHeight = 24;
  const firstY = 190 - ((shown.length - 1) * lineHeight) / 2;
  const text = shown
    .map((line, i) => `<tspan x="100" y="${firstY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#3a1214"/><stop offset="1" stop-color="#141414"/>' +
        '</linearGradient></defs>' +
        '<rect width="200" height="300" fill="url(#g)"/>' +
        // Film frame with sprocket holes.
        '<g fill="none" stroke="#e50914" stroke-width="3" opacity="0.8">' +
        '<rect x="76" y="60" width="48" height="60" rx="4"/>' +
        '<line x1="86" y1="60" x2="86" y2="120"/><line x1="114" y1="60" x2="114" y2="120"/>' +
        '</g>' +
        '<g fill="#e50914" opacity="0.8">' +
        '<rect x="78" y="66" width="5" height="5"/><rect x="78" y="82" width="5" height="5"/>' +
        '<rect x="78" y="98" width="5" height="5"/><rect x="117" y="66" width="5" height="5"/>' +
        '<rect x="117" y="82" width="5" height="5"/><rect x="117" y="98" width="5" height="5"/>' +
        '</g>' +
        `<text fill="#eee" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">${text}</text>` +
        '</svg>'
    )
  );
};

export const posterOrPlaceholder = (poster, title) =>
  !poster || poster === 'N/A' ? placeholderPoster(title) : poster;

// Some OMDb poster URLs are dead links; swap in the placeholder (titled from the alt text) when one fails.
export const showPlaceholderOnError = (e) => {
  const img = e.currentTarget;
  if (!img.dataset.placeholder) {
    img.dataset.placeholder = 'true';
    img.src = placeholderPoster(img.alt);
  }
};

// OMDb returns 200 with { Response: "False", Error } for "not found" style errors.
const unwrap = (data) => {
  if (data.Response === 'False') {
    throw new Error(data.Error || 'Something went wrong');
  }
  return data;
};

// OMDb returns 10 results per page.
export const RESULTS_PER_PAGE = 10;

// type: 'movie' | 'series' | undefined (both).
export const searchMovies = async (query, { year, type, page = 1 } = {}) => {
  const { data } = await omdb.get('', { params: { s: query, y: year, type, page } });
  if (data.Response === 'False' && data.Error === 'Movie not found!') {
    return { movies: [], totalResults: 0 };
  }
  const { Search, totalResults } = unwrap(data);
  return { movies: Search, totalResults: Number(totalResults) };
};

export const getMovieDetails = async (imdbID) => {
  const { data } = await omdb.get('', { params: { i: imdbID, plot: 'full' } });
  return unwrap(data);
};
