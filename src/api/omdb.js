import axios from 'axios';

const omdb = axios.create({
  baseURL: 'https://www.omdbapi.com/',
  params: { apikey: import.meta.env.VITE_OMDB_KEY },
});

export const PLACEHOLDER_POSTER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">' +
      '<rect width="200" height="300" fill="#222"/>' +
      '<text x="100" y="150" fill="#777" font-family="sans-serif" font-size="16" text-anchor="middle">No Image</text>' +
      '</svg>'
  );

export const posterOrPlaceholder = (poster) =>
  !poster || poster === 'N/A' ? PLACEHOLDER_POSTER : poster;

// OMDb returns 200 with { Response: "False", Error } for "not found" style errors.
const unwrap = (data) => {
  if (data.Response === 'False') {
    throw new Error(data.Error || 'Something went wrong');
  }
  return data;
};

export const searchMovies = async (query, { year, page = 1 } = {}) => {
  const { data } = await omdb.get('', { params: { s: query, y: year, page } });
  if (data.Response === 'False' && data.Error === 'Movie not found!') {
    return [];
  }
  return unwrap(data).Search;
};

export const getMovieDetails = async (imdbID) => {
  const { data } = await omdb.get('', { params: { i: imdbID, plot: 'full' } });
  return unwrap(data);
};
