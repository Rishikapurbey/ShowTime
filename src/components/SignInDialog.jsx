import React, { useEffect, useId, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { posterOrPlaceholder, showPlaceholderOnError } from '../api/omdb';
import './SignInDialog.css';

// A native modal <dialog> handles the focus trap, Escape and returning focus to the button.
const SignInDialog = ({ movie, onClose }) => {
  const dialogRef = useRef(null);
  const titleId = useId();
  const { pathname, search, hash } = useLocation();
  const authState = { from: `${pathname}${search}${hash}`, movieToSave: movie };

  useEffect(() => {
    if (!dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  // Closing the element (rather than unmounting it) is what restores focus; it then fires onClose.
  const close = () => dialogRef.current.close();

  return (
    <dialog
      ref={dialogRef}
      className="signin-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      // The content fills the dialog, so a click on the element itself is on the backdrop.
      onClick={(e) => { if (e.target === dialogRef.current) close(); }}
    >
      <div className="signin-dialog-content">
        <img
          src={posterOrPlaceholder(movie.Poster, movie.Title)}
          alt=""
          className="signin-dialog-poster"
          onError={showPlaceholderOnError}
        />
        <div>
          <h2 id={titleId}>Save {movie.Title} to your watchlist</h2>
          <p>Sign in and we'll add it for you. You can also rate what you've watched and share your list.</p>
          <div className="signin-dialog-actions">
            <Link to="/login" state={authState} className="cta-button">Log in</Link>
            <Link to="/signup" state={authState} className="cta-button secondary">Create account</Link>
            <button type="button" className="signin-dialog-dismiss" onClick={close}>Not now</button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default SignInDialog;
