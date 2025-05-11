import React from 'react';

const BestDealCard = ({ result }) => {
  if (!result) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-green-800 mb-2">Best Deal Found!</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Platform</p>
          <p className="text-lg font-medium text-gray-900">{result.platform.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Price</p>
          <p className="text-2xl font-bold text-green-600">₹{result.price}</p>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Last updated: {new Date(result.last_updated).toLocaleString()}
      </div>
    </div>
  );
};

export default BestDealCard; 