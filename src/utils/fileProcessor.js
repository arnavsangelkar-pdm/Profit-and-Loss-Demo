import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const processFile = async (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  switch (fileExtension) {
    case 'csv':
      return await processCSV(file);
    case 'xls':
    case 'xlsx':
      return await processExcel(file);
    case 'json':
      return await processJSON(file);
    default:
      throw new Error('Unsupported file format');
  }
};

const processCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};

const processExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        });
        
        // Convert to object format with headers
        if (jsonData.length > 0) {
          const headers = jsonData[0];
          const rows = jsonData.slice(1);
          
          const result = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve(result);
        } else {
          resolve([]);
        }
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const processJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Handle different JSON structures
        if (Array.isArray(data)) {
          resolve(data);
        } else if (data.rows && Array.isArray(data.rows)) {
          resolve(data.rows);
        } else if (data.data && Array.isArray(data.data)) {
          resolve(data.data);
        } else {
          // Try to convert object to array
          const entries = Object.entries(data);
          if (entries.length > 0) {
            const result = entries.map(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                return { ...value, _key: key };
              } else {
                return { label: key, value: value };
              }
            });
            resolve(result);
          } else {
            resolve([]);
          }
        }
      } catch (error) {
        reject(new Error(`JSON parsing error: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read JSON file'));
    };
    
    reader.readAsText(file);
  });
};

// Helper function to detect P&L structure
export const detectPLStructure = (data) => {
  if (!data || data.length === 0) return null;
  
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  // Look for common P&L column patterns
  const labelColumns = columns.filter(col => 
    col.toLowerCase().includes('label') ||
    col.toLowerCase().includes('description') ||
    col.toLowerCase().includes('account') ||
    col.toLowerCase().includes('item') ||
    col.toLowerCase().includes('name')
  );
  
  const amountColumns = columns.filter(col => {
    // Skip the label column
    if (labelColumns.includes(col)) return false;
    
    // Check if column name suggests it's an amount column
    const colLower = col.toLowerCase();
    if (colLower.includes('amount') || 
        colLower.includes('value') || 
        colLower.includes('balance') || 
        colLower.includes('total') ||
        colLower.includes('jan') || colLower.includes('feb') || colLower.includes('mar') ||
        colLower.includes('apr') || colLower.includes('may') || colLower.includes('jun') ||
        colLower.includes('jul') || colLower.includes('aug') || colLower.includes('sep') ||
        colLower.includes('oct') || colLower.includes('nov') || colLower.includes('dec') ||
        colLower.includes('q1') || colLower.includes('q2') || colLower.includes('q3') || colLower.includes('q4')) {
      return true;
    }
    
    // Check if the first few rows contain numeric values
    const sampleValues = data.slice(0, Math.min(5, data.length)).map(row => row[col]);
    const numericCount = sampleValues.filter(val => !isNaN(parseFloat(val)) && val !== '').length;
    return numericCount >= sampleValues.length * 0.6; // At least 60% numeric
  });
  
  return {
    labelColumn: labelColumns[0] || columns[0],
    amountColumns: amountColumns.length > 0 ? amountColumns : columns.slice(1),
    allColumns: columns
  };
};
