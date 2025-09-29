import React from 'react';

const DebugInfo = ({ data, dataStructure, currentStep, error }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Current Step: <span className="text-yellow-300">{currentStep}</span></div>
        <div>Data Rows: <span className="text-green-300">{data ? data.length : 0}</span></div>
        <div>Has Structure: <span className="text-blue-300">{dataStructure ? 'Yes' : 'No'}</span></div>
        <div>Error: <span className="text-red-300">{error || 'None'}</span></div>
        {dataStructure && (
          <div className="mt-2">
            <div>Label Column: <span className="text-purple-300">{dataStructure.labelColumn}</span></div>
            <div>Amount Columns: <span className="text-purple-300">{dataStructure.amountColumns.length}</span></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugInfo;

