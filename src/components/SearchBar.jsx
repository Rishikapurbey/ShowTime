import React, { useRef } from 'react';
import './SearchBar.css';

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  const inputRef = useRef(null);

  const clear = () => {
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div className='search-bar'>
      <div className="search-field">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for movies, TV shows..."
          aria-label="Search for movies, TV shows"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && clear()}
        />
        {searchTerm && (
          <button type="button" className="search-clear" onClick={clear} aria-label="Clear search" title="Clear search">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
