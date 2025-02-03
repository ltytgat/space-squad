import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchEncyclopedia, SearchResult } from './services/searchService';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (query) {
      const searchResults = searchEncyclopedia(query);
      setResults(searchResults);
    }
  }, [query]);

  if (!query) {
    return <div className="p-4 text-white">No search query provided</div>;
  }

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>
      {results.length === 0 ? (
        <p>No results found</p>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border border-gray-700 rounded-lg p-4">
              <Link
                to={`/encyclopedia/${result.categoryId}/${result.articleId}`}
                className="block hover:bg-gray-800 transition-colors"
              >
                <h2 className="text-xl font-semibold text-blue-400">{result.title}</h2>
                <p className="text-sm text-gray-400">{result.category}</p>
                <p className="mt-2">{result.excerpt}</p>
                {result.matchType && (
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-700 rounded">
                    Found in: {result.matchType}
                  </span>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
