// A rating only makes sense for something you've seen, so rating marks a movie watched
// and un-marking it clears the rating. These return the fields to write to the entry.
export const watchedFields = (watched) => (watched ? { watched: true } : { watched: false, rating: null });

export const ratingFields = (rating) => (rating ? { rating, watched: true } : { rating: null });
