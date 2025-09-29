// Test script to verify monthly amount editing
const fs = require('fs');
const Papa = require('papaparse');

// Import the standardizer functions
const { generateMappingSuggestions, standardizeData } = require('./src/utils/standardizer');

// Create test data
const testData = [
  {
    Label: 'Client Service Revenue',
    Jan: 50000,
    Feb: 55000,
    Mar: 60000
  },
  {
    Label: 'Marketing Expenses',
    Jan: 3000,
    Feb: 3500,
    Mar: 4000
  }
];

const structure = {
  labelColumn: 'Label',
  amountColumns: ['Jan', 'Feb', 'Mar'],
  allColumns: ['Label', 'Jan', 'Feb', 'Mar']
};

console.log('Original data:');
testData.forEach(row => {
  console.log(`${row.Label}: Jan=${row.Jan}, Feb=${row.Feb}, Mar=${row.Mar}`);
});

// Generate initial suggestions
const suggestions = generateMappingSuggestions(testData, structure);
console.log('\nInitial suggestions:');
Object.entries(suggestions).forEach(([original, mapping]) => {
  console.log(`${original}: ${mapping.standardLabel}, Total=${mapping.amount}, Monthly=${mapping.monthlyAmounts}`);
});

// Simulate user editing monthly amounts
const editedMappingRules = { ...suggestions };
editedMappingRules['Client Service Revenue'].monthlyAmounts = [60000, 65000, 70000]; // User increased amounts
editedMappingRules['Client Service Revenue'].amount = 195000; // New total

console.log('\nAfter user edits:');
Object.entries(editedMappingRules).forEach(([original, mapping]) => {
  console.log(`${original}: ${mapping.standardLabel}, Total=${mapping.amount}, Monthly=${mapping.monthlyAmounts}`);
});

// Test standardization with edited data
const standardizedData = standardizeData(testData, editedMappingRules, structure);
console.log('\nStandardized data:');
standardizedData.forEach(item => {
  console.log(`${item.label}: Total=${item.amount}, Monthly=${item.monthlyAmounts}`);
});
