import React, { useState } from 'react';
import { FileText, CheckCircle, RotateCcw, Eye, EyeOff } from 'lucide-react';

const CleanedOutput = ({ data, mappingRules, onReset, dataStructure, onEditMappings }) => {
  const [showMappingDetails, setShowMappingDetails] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Use actual column headers from the uploaded file, or default to months
  const columnHeaders = dataStructure?.amountColumns || [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Create structured P&L data with monthly breakdown
  const createStructuredPLData = () => {
    console.log('CleanedOutput creating structured data from', data.length, 'items');
    
    // The data comes from standardizeData which has already processed all the mapping rules
    // We should use it directly without additional processing
    const structuredData = [];
    
    // Revenue Section
    const revenueItems = data.filter(item => item.type === 'revenue');
    
    // Calculate revenue totals (needed for gross profit calculation)
    const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
    const totalRevenueMonthly = revenueItems.reduce((sum, item) => {
      const monthlyAmounts = item.monthlyAmounts || new Array(columnHeaders.length).fill(0);
      return sum.map((val, index) => val + monthlyAmounts[index]);
    }, new Array(columnHeaders.length).fill(0));
    
    if (revenueItems.length > 0) {
      structuredData.push({ 
        label: 'REVENUE', 
        type: 'section_header', 
        amount: 0, 
        monthlyAmounts: new Array(columnHeaders.length).fill(0),
        isHeader: true 
      });
      
      revenueItems.forEach(item => {
        structuredData.push({
          ...item,
          // Trust the monthly amounts from standardizeData - they contain the user's updates
          monthlyAmounts: item.monthlyAmounts || new Array(columnHeaders.length).fill(0),
          isSubItem: true
        });
      });
      
      structuredData.push({
        label: 'Total Revenue',
        type: 'total',
        amount: totalRevenue,
        monthlyAmounts: totalRevenueMonthly,
        isTotal: true
      });
    }

    // Cost of Goods Sold
    const cogsItems = data.filter(item => item.label === 'Cost of Goods Sold');
    
    // Calculate COGS totals (needed for gross profit calculation)
    const totalCOGS = cogsItems.reduce((sum, item) => sum + item.amount, 0);
    const totalCOGSMonthly = cogsItems.reduce((sum, item) => {
      const monthlyAmounts = item.monthlyAmounts || new Array(columnHeaders.length).fill(0);
      return sum.map((val, index) => val + monthlyAmounts[index]);
    }, new Array(columnHeaders.length).fill(0));
    
    if (cogsItems.length > 0) {
      structuredData.push({ 
        label: 'COST OF REVENUE', 
        type: 'section_header', 
        amount: 0, 
        monthlyAmounts: new Array(columnHeaders.length).fill(0),
        isHeader: true 
      });
      
      cogsItems.forEach(item => {
        structuredData.push({
          ...item,
          // Trust the monthly amounts from standardizeData
          monthlyAmounts: item.monthlyAmounts || new Array(columnHeaders.length).fill(0),
          isSubItem: true
        });
      });
      
      structuredData.push({
        label: 'Total Cost of Revenue',
        type: 'total',
        amount: totalCOGS,
        monthlyAmounts: totalCOGSMonthly,
        isTotal: true
      });
    }

    // Gross Profit (use the totals already calculated above)
    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMonthly = totalRevenueMonthly.map((revenue, index) => 
      revenue - totalCOGSMonthly[index]
    );
    
    if (revenueItems.length > 0 || cogsItems.length > 0) {
      structuredData.push({
        label: 'Gross Profit',
        type: 'calculated',
        amount: grossProfit,
        monthlyAmounts: grossProfitMonthly,
        isCalculated: true
      });
    }

    // Operating Expenses
    const operatingExpenses = data.filter(item => 
      item.type === 'expense' && 
      !['Cost of Goods Sold', 'Interest Expense', 'Income Tax Expense'].includes(item.label)
    );
    
    // Calculate operating expenses totals using actual monthly amounts
    const totalOperatingExpenses = operatingExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalOperatingExpensesMonthly = operatingExpenses.reduce((sum, item) => {
      const monthlyAmounts = item.monthlyAmounts || new Array(columnHeaders.length).fill(0);
      return sum.map((val, index) => val + monthlyAmounts[index]);
    }, new Array(columnHeaders.length).fill(0));
    
    if (operatingExpenses.length > 0) {
      structuredData.push({ 
        label: 'OPERATING EXPENSES', 
        type: 'section_header', 
        amount: 0, 
        monthlyAmounts: new Array(columnHeaders.length).fill(0),
        isHeader: true 
      });
      
      operatingExpenses.forEach(item => {
        structuredData.push({
          ...item,
          // Trust the monthly amounts from standardizeData
          monthlyAmounts: item.monthlyAmounts || new Array(columnHeaders.length).fill(0),
          isSubItem: true
        });
      });
      
      structuredData.push({
        label: 'Total Operating Expenses',
        type: 'total',
        amount: totalOperatingExpenses,
        monthlyAmounts: totalOperatingExpensesMonthly,
        isTotal: true
      });
    }

    // Operating Income
    const operatingIncome = grossProfit - totalOperatingExpenses;
    const operatingIncomeMonthly = grossProfitMonthly.map((profit, index) => 
      profit - (totalOperatingExpensesMonthly[index] || 0)
    );
    
    structuredData.push({
      label: 'Operating Income',
      type: 'calculated',
      amount: operatingIncome,
      monthlyAmounts: operatingIncomeMonthly,
      isCalculated: true
    });

    // Other Income/Expenses
    const otherIncome = data.filter(item => item.label === 'Other Income');
    const interestIncome = data.filter(item => item.label === 'Interest Income');
    const interestExpense = data.filter(item => item.label === 'Interest Expense');
    const otherExpenses = data.filter(item => item.label === 'Other Expenses');

    if (otherIncome.length > 0 || interestIncome.length > 0 || interestExpense.length > 0 || otherExpenses.length > 0) {
      structuredData.push({ 
        label: 'OTHER INCOME & EXPENSES', 
        type: 'section_header', 
        amount: 0, 
        monthlyAmounts: new Array(columnHeaders.length).fill(0),
        isHeader: true 
      });
      
      [...otherIncome, ...interestIncome].forEach(item => {
        structuredData.push({
          ...item,
          monthlyAmounts: generateMonthlyAmounts(item.amount, item.monthlyAmounts),
          isSubItem: true
        });
      });
      
      [...interestExpense, ...otherExpenses].forEach(item => {
        structuredData.push({
          ...item,
          monthlyAmounts: generateMonthlyAmounts(item.amount, item.monthlyAmounts),
          isSubItem: true
        });
      });
    }

    // Income Tax
    const taxItems = data.filter(item => item.label === 'Income Tax Expense');
    if (taxItems.length > 0) {
      structuredData.push({ 
        label: 'INCOME TAX', 
        type: 'section_header', 
        amount: 0, 
        monthlyAmounts: new Array(columnHeaders.length).fill(0),
        isHeader: true 
      });
      taxItems.forEach(item => {
        structuredData.push({
          ...item,
          monthlyAmounts: generateMonthlyAmounts(item.amount, item.monthlyAmounts),
          isSubItem: true
        });
      });
    }

    // Net Income
    const netIncome = data.find(item => item.label === 'Net Income');
    if (netIncome) {
      structuredData.push({
        ...netIncome,
        monthlyAmounts: generateMonthlyAmounts(netIncome.amount, netIncome.monthlyAmounts),
        isCalculated: true
      });
    }

    return structuredData;
  };

  // Generate monthly amounts - ONLY use this for calculated fields that don't have monthly data
  const generateMonthlyAmounts = (totalAmount, existingMonthlyAmounts = null) => {
    // Always prefer existing monthly amounts if they exist
    if (existingMonthlyAmounts && Array.isArray(existingMonthlyAmounts) && existingMonthlyAmounts.length > 0) {
      // If we have monthly amounts, use them exactly as they are
      if (existingMonthlyAmounts.length === columnHeaders.length) {
        return existingMonthlyAmounts;
      }
      
      // If we have some monthly data but not complete, fill in missing months
      const filledAmounts = [...existingMonthlyAmounts];
      while (filledAmounts.length < columnHeaders.length) {
        filledAmounts.push(0);
      }
      return filledAmounts.slice(0, columnHeaders.length);
    }
    
    // Fallback: distribute evenly across months (only for calculated fields)
    const monthlyAmount = totalAmount / columnHeaders.length;
    return columnHeaders.map(() => monthlyAmount);
  };

  // Show loading state if no data
  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading standardized P&L statement...</p>
        </div>
      </div>
    );
  }

  const structuredData = createStructuredPLData();

  const downloadCSV = () => {
    const csvContent = [
      ['Label', ...columnHeaders, 'Total Year ($)'],
      ...structuredData.map(row => [
        row.label,
        ...(row.monthlyAmounts ? row.monthlyAmounts.map(amount => amount.toFixed(0)) : new Array(columnHeaders.length).fill('0')),
        (row.amount || 0).toFixed(0)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detailed-pl-statement.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    // For Excel download, we'll create a simple CSV that can be opened in Excel
    // In a real app, you'd use a library like xlsx to create proper Excel files
    downloadCSV();
  };

  const downloadJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned-pl-statement.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Detailed P&L Statement</h2>
        <div className="flex items-center space-x-3">
          {onEditMappings && (
            <button
              onClick={onEditMappings}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Edit Mappings</span>
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Another File</span>
          </button>
        </div>
      </div>

      {/* Download Options */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Cleaned Data</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Detailed P&L Sheet */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Detailed P&L Statement</h3>
            <button
              onClick={() => setShowMappingDetails(!showMappingDetails)}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showMappingDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showMappingDetails ? 'Hide' : 'Show'} Mapping Details</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Row Labels (Column A)
                </th>
                {columnHeaders.map(header => (
                  <th key={header} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                    {header}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] bg-gray-100">
                  Total Year ($)
                </th>
                {showMappingDetails && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Labels
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {structuredData.map((row, index) => {
                const originalLabels = Object.entries(mappingRules)
                  .filter(([_, mapping]) => mapping.standardLabel === row.label)
                  .map(([original, _]) => original);

                const getRowStyle = () => {
                  if (row.isHeader) {
                    return 'bg-gray-100 font-bold text-gray-900';
                  } else if (row.isTotal) {
                    return 'bg-blue-50 font-semibold text-gray-900 border-t-2 border-blue-200';
                  } else if (row.isCalculated) {
                    return 'bg-green-50 font-semibold text-gray-900 border-t-2 border-green-200';
                  } else if (row.isSubItem) {
                    return 'bg-white text-gray-700 pl-6';
                  }
                  return 'bg-white text-gray-700';
                };

                return (
                  <tr key={index} className={getRowStyle()}>
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-inherit z-10">
                      <div className={`text-sm ${row.isHeader ? 'font-bold' : row.isTotal || row.isCalculated ? 'font-semibold' : 'font-medium'}`}>
                        {row.label}
                      </div>
                    </td>
                    {row.monthlyAmounts && row.monthlyAmounts.map((amount, monthIndex) => (
                      <td key={monthIndex} className="px-3 py-3 whitespace-nowrap text-center">
                        <div className={`text-sm font-mono ${amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {row.isHeader ? '' : formatCurrency(amount)}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-center bg-gray-100">
                      <div className={`text-sm font-mono font-semibold ${row.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {row.isHeader ? '' : formatCurrency(row.amount)}
                      </div>
                    </td>
                    {showMappingDetails && (
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {originalLabels.length > 0 ? (
                            <div className="space-y-1">
                              {originalLabels.map((label, idx) => (
                                <div key={idx} className="inline-block mr-2 mb-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                  {label}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">
                              {row.isCalculated ? 'Calculated' : row.isHeader ? 'Section Header' : 'N/A'}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-900">Detailed P&L Statement Generated!</h3>
            <p className="text-sm text-green-800 mt-1">
              Your P&L statement has been structured as a detailed monthly breakdown with proper hierarchy. 
              The layout includes revenue categories, expense categories, totals, and calculated fields organized vertically by line item and horizontally by month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanedOutput;
