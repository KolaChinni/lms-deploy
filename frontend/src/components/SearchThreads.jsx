import React, { useState } from 'react';
import { forumService } from '../services/forumService';

const SearchThreads = ({ courseId, onSearchResults, onClearSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      onClearSearch();
      return;
    }

    setLoading(true);
    
    try {
      const response = await forumService.searchThreads(courseId, query);
      onSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onClearSearch();
    setIsExpanded(false);
  };

  return (
    <div className={`search-threads ${isExpanded ? 'expanded' : ''}`}>
      {!isExpanded ? (
        <button 
          className="btn btn-outline"
          onClick={() => setIsExpanded(true)}
        >
          🔍 Search
        </button>
      ) : (
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search threads..."
              className="search-input"
            />
            <div className="search-actions">
              <button 
                type="submit" 
                className="btn btn-primary btn-sm"
                disabled={loading}
              >
                {loading ? '...' : 'Search'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={handleClear}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SearchThreads;