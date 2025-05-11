import React, { useState } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import BestDealCard from './components/BestDealCard';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/api/medicines/search/?medicine=${query}`);
      setResults(response.data.scraped_prices || []);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while fetching prices');
    } finally {
      setLoading(false);
    }
  };

  const bestDeal = results.length > 0
    ? results.reduce((min, curr) => curr.price < min.price ? curr : min)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Medicine Price Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Compare medicine prices across different platforms
          </p>
        </div>

        <SearchBar onSearch={handleSearch} />
        
        {bestDeal && <BestDealCard result={bestDeal} />}
        
        <ResultsTable
          results={results}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}

export default App;
