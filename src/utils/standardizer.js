// Standard P&L categories and their common variations
export const STANDARD_PL_CATEGORIES = {
  // Revenue
  'Total Revenue': {
    keywords: ['revenue', 'sales', 'income', 'turnover', 'gross sales', 'total sales'],
    type: 'revenue',
    order: 1
  },
  'Service Revenue': {
    keywords: ['service revenue', 'service income', 'service sales', 'professional services', 'consulting revenue', 'service fees', 'recurring revenue', 'subscription revenue'],
    type: 'revenue',
    order: 1.5
  },
  'Cost of Goods Sold': {
    keywords: ['cogs', 'cost of goods', 'cost of sales', 'direct costs', 'material costs'],
    type: 'expense',
    order: 2
  },
  'Gross Profit': {
    keywords: ['gross profit', 'gross margin', 'gross income'],
    type: 'calculated',
    order: 3
  },
  
  // Operating Expenses
  'Operating Expenses': {
    keywords: ['operating expenses', 'opex', 'operating costs'],
    type: 'expense',
    order: 4
  },
  'Selling, General & Administrative': {
    keywords: ['sga', 'sg&a', 'selling general administrative', 'administrative expenses'],
    type: 'expense',
    order: 5
  },
  'Marketing Expenses': {
    keywords: ['marketing', 'advertising', 'promotion', 'brand', 'marketing costs', 'media', 'ad tech', 'tools'],
    type: 'expense',
    order: 6
  },
  'Research & Development': {
    keywords: ['r&d', 'research development', 'research and development', 'innovation'],
    type: 'expense',
    order: 7
  },
  'Rent & Utilities': {
    keywords: ['rent', 'utilities', 'office rent', 'facility costs', 'building costs'],
    type: 'expense',
    order: 8
  },
  'Salaries & Benefits': {
    keywords: ['salaries', 'wages', 'payroll', 'benefits', 'compensation', 'employee costs', 'freelancers', 'contractors'],
    type: 'expense',
    order: 9
  },
  'Professional Services': {
    keywords: ['legal', 'accounting', 'consulting', 'professional services', 'advisory'],
    type: 'expense',
    order: 10
  },
  'Insurance': {
    keywords: ['insurance', 'liability', 'coverage', 'premiums'],
    type: 'expense',
    order: 11
  },
  'Depreciation & Amortization': {
    keywords: ['depreciation', 'amortization', 'd&a', 'asset depreciation'],
    type: 'expense',
    order: 12
  },
  
  // Operating Income
  'Operating Income': {
    keywords: ['operating income', 'operating profit', 'ebit', 'operating earnings'],
    type: 'calculated',
    order: 13
  },
  
  // Other Income/Expenses
  'Interest Income': {
    keywords: ['interest income', 'interest earned', 'investment income'],
    type: 'revenue',
    order: 14
  },
  'Interest Expense': {
    keywords: ['interest expense', 'interest paid', 'debt interest', 'loan interest'],
    type: 'expense',
    order: 15
  },
  'Other Income': {
    keywords: ['other income', 'miscellaneous income', 'non-operating income'],
    type: 'revenue',
    order: 16
  },
  'Other Expenses': {
    keywords: ['other expenses', 'miscellaneous expenses', 'non-operating expenses'],
    type: 'expense',
    order: 17
  },
  
  // Taxes and Net Income
  'Income Tax Expense': {
    keywords: ['tax', 'income tax', 'tax expense', 'provision for taxes'],
    type: 'expense',
    order: 18
  },
  'Net Income': {
    keywords: ['net income', 'net profit', 'bottom line', 'earnings', 'profit after tax'],
    type: 'calculated',
    order: 19
  }
};

// Function to find the best match for a given label
export const findBestMatch = (label, categories = STANDARD_PL_CATEGORIES) => {
  if (!label || typeof label !== 'string') return null;
  
  const normalizedLabel = label.toLowerCase().trim();
  
  // Direct match first
  for (const [category] of Object.entries(categories)) {
    if (normalizedLabel === category.toLowerCase()) {
      return { category, confidence: 1.0, matchType: 'exact' };
    }
  }
  
  // Keyword matching
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [category, config] of Object.entries(categories)) {
    for (const keyword of config.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact keyword match
      if (normalizedLabel === keywordLower) {
        return { category, confidence: 0.95, matchType: 'keyword_exact' };
      }
      
      // Contains keyword
      if (normalizedLabel.includes(keywordLower)) {
        const score = keywordLower.length / normalizedLabel.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { category, confidence: score * 0.8, matchType: 'keyword_partial' };
        }
      }
      
      // Keyword contains the label (for very short labels)
      if (keywordLower.includes(normalizedLabel) && normalizedLabel.length > 3) {
        const score = normalizedLabel.length / keywordLower.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { category, confidence: score * 0.7, matchType: 'keyword_reverse' };
        }
      }
    }
  }
  
  return bestMatch;
};

// Function to standardize data based on mapping rules
export const standardizeData = (data, mappingRules, structure = null) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // Filter out empty rows
  const filteredData = data.filter(row => {
    const values = Object.values(row);
    return values.some(value => value !== '' && value !== null && value !== undefined);
  });
  
  // Detect structure if not provided
  if (!structure) {
    const firstRow = filteredData[0];
    const columns = Object.keys(firstRow);
    const labelColumn = columns[0];
    const amountColumns = columns.slice(1);
    structure = { labelColumn, amountColumns, allColumns: columns };
  }
  
  // Apply mapping rules
  const categoryTotals = {};
  
  for (const row of filteredData) {
    const originalLabel = row[structure.labelColumn];
    
    if (!originalLabel || typeof originalLabel !== 'string') continue;
    
    const mapping = mappingRules[originalLabel];
    if (!mapping) {
      continue;
    }
    
    const standardizedLabel = mapping.standardLabel;
    
    // Use monthly amounts from mapping rules if available, otherwise use original data
    const monthlyAmounts = mapping.monthlyAmounts || structure.amountColumns.map(col => {
      const value = row[col];
      return parseFloat(value) || 0;
    });
    
    // Use total amount from mapping rules if available, otherwise calculate from monthly amounts
    const totalAmount = mapping.amount || monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
    
    
    if (!categoryTotals[standardizedLabel]) {
      categoryTotals[standardizedLabel] = {
        label: standardizedLabel,
        amount: 0,
        monthlyAmounts: new Array(structure.amountColumns.length).fill(0),
        type: STANDARD_PL_CATEGORIES[standardizedLabel]?.type || 'expense',
        order: STANDARD_PL_CATEGORIES[standardizedLabel]?.order || 999
      };
    }
    
    // Add to totals
    categoryTotals[standardizedLabel].amount += totalAmount;
    categoryTotals[standardizedLabel].monthlyAmounts = categoryTotals[standardizedLabel].monthlyAmounts.map(
      (existing, index) => existing + monthlyAmounts[index]
    );
  }
  
  // Convert to array and sort by order
  const result = Object.values(categoryTotals)
    .sort((a, b) => a.order - b.order)
    .map(item => ({
      label: item.label,
      amount: item.amount,
      monthlyAmounts: item.monthlyAmounts,
      type: item.type
    }));
  
  // Add calculated fields with monthly breakdown
  const revenueItems = result.filter(item => item.type === 'revenue');
  const expenseItems = result.filter(item => item.type === 'expense');
  
  // Calculate monthly totals for revenue and expenses
  const monthlyRevenueTotals = new Array(structure.amountColumns.length).fill(0);
  const monthlyExpenseTotals = new Array(structure.amountColumns.length).fill(0);
  
  revenueItems.forEach(item => {
    item.monthlyAmounts.forEach((amount, index) => {
      monthlyRevenueTotals[index] += amount;
    });
  });
  
  expenseItems.forEach(item => {
    item.monthlyAmounts.forEach((amount, index) => {
      monthlyExpenseTotals[index] += amount;
    });
  });
  
  const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Insert calculated items at appropriate positions
  const finalResult = [];
  let insertIndex = 0;
  
  for (const item of result) {
    finalResult.push(item);
    insertIndex++;
    
    // Insert Gross Profit after Cost of Goods Sold
    if (item.label === 'Cost of Goods Sold') {
      const cogsItem = result.find(i => i.label === 'Cost of Goods Sold');
      const grossProfitMonthly = monthlyRevenueTotals.map((revenue, index) => 
        revenue - (cogsItem?.monthlyAmounts[index] || 0)
      );
      const grossProfit = totalRevenue - (cogsItem?.amount || 0);
      
      finalResult.splice(insertIndex, 0, {
        label: 'Gross Profit',
        amount: grossProfit,
        monthlyAmounts: grossProfitMonthly,
        type: 'calculated'
      });
      insertIndex++;
    }
    
    // Insert Operating Income after operating expenses
    if (item.label === 'Operating Expenses' || item.label === 'Selling, General & Administrative') {
      const operatingIncomeMonthly = monthlyRevenueTotals.map((revenue, index) => 
        revenue - monthlyExpenseTotals[index]
      );
      const operatingIncome = totalRevenue - totalExpenses;
      
      if (!finalResult.find(i => i.label === 'Operating Income')) {
        finalResult.splice(insertIndex, 0, {
          label: 'Operating Income',
          amount: operatingIncome,
          monthlyAmounts: operatingIncomeMonthly,
          type: 'calculated'
        });
        insertIndex++;
      }
    }
  }
  
  // Add Net Income at the end
  const netIncomeMonthly = monthlyRevenueTotals.map((revenue, index) => 
    revenue - monthlyExpenseTotals[index]
  );
  const netIncome = totalRevenue - totalExpenses;
  
  finalResult.push({
    label: 'Net Income',
    amount: netIncome,
    monthlyAmounts: netIncomeMonthly,
    type: 'calculated'
  });
  
  return finalResult;
};

// Function to generate mapping suggestions using keyword matching (fallback)
// This function is deprecated - use AI matching instead
export const generateMappingSuggestions = (data, structure = null) => {
  console.warn('Keyword matching is deprecated. Please use AI matching instead.');
  return {};
};

// Function to generate mapping suggestions using OpenAI (enhanced)
export const generateMappingSuggestionsWithOpenAI = async (data, openaiService, structure = null) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {};
  }
  
  if (!openaiService || !openaiService.isInitialized()) {
    throw new Error('OpenAI service is required but not initialized');
  }
  
  try {
    // Use provided structure or detect it
    if (!structure) {
      const firstRow = data[0];
      const columns = Object.keys(firstRow);
      structure = { 
        labelColumn: columns[0], 
        amountColumns: columns.slice(1), 
        allColumns: columns 
      };
    }
    
    // Extract unique labels from data
    const uniqueLabels = [...new Set(
      data.map(row => row[structure.labelColumn]).filter(label => label && typeof label === 'string')
    )];
    
    if (uniqueLabels.length === 0) {
      return {};
    }
    
    // Get OpenAI suggestions
    const openaiResults = await openaiService.standardizeLabelsBatch(uniqueLabels, STANDARD_PL_CATEGORIES);
    
    // Convert OpenAI results to our format
    const suggestions = {};
    
    for (const result of openaiResults) {
      if (result.standardCategory && result.confidence > 0.3) {
        // Find the corresponding row to get amount
        const row = data.find(row => row[structure.labelColumn] === result.originalLabel);
        
        if (row) {
          // Calculate total amount from all amount columns
          const totalAmount = structure.amountColumns.reduce((sum, col) => {
            return sum + (parseFloat(row[col]) || 0);
          }, 0);
          
          // Get monthly amounts
          const monthlyAmounts = structure.amountColumns.map(col => parseFloat(row[col]) || 0);
          
          suggestions[result.originalLabel] = {
            standardLabel: result.standardCategory,
            amount: totalAmount,
            monthlyAmounts: monthlyAmounts,
            confidence: result.confidence,
            matchType: 'openai',
            source: 'openai',
            explanation: result.explanation,
            alternativeCategories: result.alternativeCategories || []
          };
        }
      }
    }
    
    // Note: No fallback to keyword matching - AI is required
    
    return suggestions;
    
  } catch (error) {
    console.error('OpenAI standardization failed:', error);
    throw error;
  }
};

// AI-only function for generating mapping suggestions
export const generateMappingSuggestionsHybrid = async (data, openaiService, structure = null) => {
  if (!openaiService || !openaiService.isInitialized()) {
    throw new Error('OpenAI service is required but not initialized');
  }
  
  return await generateMappingSuggestionsWithOpenAI(data, openaiService, structure);
};
