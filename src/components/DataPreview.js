import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { detectPLStructure } from '../utils/fileProcessor';

const DataPreview = ({ data, onContinue, onBack }) => {
  const [structure, setStructure] = useState(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      const detected = detectPLStructure(data);
      setStructure(detected);
      
      // Auto-select all columns
      if (detected) {
        setSelectedColumns(detected.allColumns);
      }
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data to preview
      </div>
    );
  }

  const columns = Object.keys(data[0]);
  const displayData = showAllRows ? data : data.slice(0, 10);
  const hasMoreRows = data.length > 10;

  const toggleColumn = (column) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">empty</span>;
    }
    
    // Check if it's a number
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return (
        <span className={`font-mono ${numValue < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {numValue.toLocaleString()}
        </span>
      );
    }
    
    return <span className="truncate max-w-xs">{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Data Preview</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {data.length} rows, {columns.length} columns
          </span>
          {hasMoreRows && (
            <button
              onClick={() => setShowAllRows(!showAllRows)}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showAllRows ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showAllRows ? 'Show Less' : 'Show All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Structure Detection */}
      {structure && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Detected P&L Structure</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Label Column:</strong> {structure.labelColumn}</p>
                <p><strong>Amount Columns:</strong> {structure.amountColumns.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Select Columns to Preview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {columns.map(column => (
            <label key={column} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedColumns.includes(column)}
                onChange={() => toggleColumn(column)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 truncate" title={column}>
                {column}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectedColumns.map(column => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {selectedColumns.map(column => (
                    <td key={column} className="px-4 py-3 text-sm">
                      {formatValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {hasMoreRows && !showAllRows && (
          <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
            Showing first 10 rows of {data.length} total rows
          </div>
        )}
      </div>

      {/* Warnings */}
      {data.some(row => Object.values(row).every(val => val === '' || val === null)) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-900 mb-1">Empty Rows Detected</h3>
              <p className="text-sm text-yellow-800">
                Some rows appear to be empty. These will be filtered out during standardization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Continue to Standardization
        </button>
      </div>
    </div>
  );
};

export default DataPreview;
