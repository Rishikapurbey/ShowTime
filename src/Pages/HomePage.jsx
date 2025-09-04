import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import MovieList from '../components/MovieList';
import CategoryRow from '../components/CategoryRow';


import './HomePage.css';

const HomePage = () => {

  const [searchTerm, setSearchTerm] = useState('');
  
  const [searchResults, setSearchResults] = useState([]);

  const API_KEY = '595c2e8f';

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const response = await axios.get(
          `http://www.omdbapi.com/?s=${searchTerm}&apikey=${API_KEY}`
        );
        if (response.data.Search) {
          setSearchResults(response.data.Search);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

  
    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults();
    }, 500);


    return () => clearTimeout(delayDebounceFn);

  }, [searchTerm]); 

  return (
    <div className="homepage-content">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      
      {searchTerm.trim() === '' ? (
        <>
        
          <CategoryRow title="Latest Movies" searchTerm="movie" year="2025" />
          <CategoryRow title="Hollywood Action" searchTerm="action" />
          <CategoryRow title="Romantic Comedies" searchTerm="romantic comedy" />
          <CategoryRow title="Thrillers" searchTerm="thriller" />
          <CategoryRow title="Comedies" searchTerm="comedy" />
          <CategoryRow title="Family Movies" searchTerm="family" />
          <CategoryRow title="Crowd Pleasers" searchTerm="avengers" />
          <CategoryRow title="Animated Movies" searchTerm="animation" />
        </>
      ) : (
        <>
          <h2 className="search-results-title">Search Results for "{searchTerm}"</h2>
          <MovieList movies={searchResults} />
        </>
      )}
    </div>
  );
};

export default HomePage;