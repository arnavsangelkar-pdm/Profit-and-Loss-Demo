import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import StandardizationPanel from './components/StandardizationPanel';
import CleanedOutput from './components/CleanedOutput';
import { processFile, detectPLStructure } from './utils/fileProcessor';
import { standardizeData } from './utils/standardizer';

function App() {
  const [rawData, setRawData] = useState(null);
  const [mappingRules, setMappingRules] = useState({});
  const [dataStructure, setDataStructure] = useState(null);
  const [currentStep, setCurrentStep] = useState('upload');
  const [error, setError] = useState(null);
  const [standardizedData, setStandardizedData] = useState(null);

  const handleFileUpload = async (file) => {
    try {
      setError(null);
      const data = await processFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('The uploaded file appears to be empty or contains no valid data.');
      }
      
      const structure = detectPLStructure(data);
      
      if (!structure || !structure.labelColumn || !structure.amountColumns.length) {
        throw new Error('Could not detect P&L structure. Please ensure your file has clear row labels and amount columns.');
      }
      
      setRawData(data);
      setDataStructure(structure);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error.message);
    }
  };

  const handlePreviewComplete = () => {
    setCurrentStep('standardize');
  };

  const handleStandardize = (rules) => {
    try {
      setError(null);
      if (!rawData) {
        throw new Error('No data available for standardization.');
      }
      
      if (!rules || Object.keys(rules).length === 0) {
        throw new Error('No mapping rules provided. Please configure the label mappings.');
      }
      
      const cleaned = standardizeData(rawData, rules, dataStructure);
      
      if (!cleaned || cleaned.length === 0) {
        throw new Error('Standardization failed to produce any results. Please check your mapping rules.');
      }
      
      setMappingRules(rules);
      setStandardizedData(cleaned);
      setCurrentStep('output');
    } catch (error) {
      console.error('Error during standardization:', error);
      setError(error.message);
    }
  };

  const handleReset = () => {
    setRawData(null);
    setMappingRules({});
    setDataStructure(null);
    setStandardizedData(null);
    setCurrentStep('upload');
    setError(null);
  };

  const handleEditMappings = () => {
    setCurrentStep('standardize');
  };

  const handleDirectUpdate = (updatedRules) => {
    try {
      const cleaned = standardizeData(rawData, updatedRules, dataStructure);
      setMappingRules(updatedRules);
      setStandardizedData(cleaned);
      setCurrentStep('output'); // Move to output step to show the updated data
    } catch (error) {
      console.error('Error in direct update:', error);
      setError(error.message);
    }
  };

  const handlePreviewUpdate = (updatedRules) => {
    try {
      const cleaned = standardizeData(rawData, updatedRules, dataStructure);
      setMappingRules(updatedRules);
      setStandardizedData(cleaned);
      // Don't change step - stay in standardization panel
    } catch (error) {
      console.error('Error in preview update:', error);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            P&L Statement Cleaner
          </h1>
          <p className="text-lg text-gray-600">
            Upload messy P&L statements and get standardized, clean output
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 text-red-600">⚠️</div>
                <div>
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {['upload', 'preview', 'standardize', 'output'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step
                        ? 'bg-primary-600 text-white'
                        : index < ['upload', 'preview', 'standardize', 'output'].indexOf(currentStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                    {step}
                  </span>
                  {index < 3 && (
                    <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {currentStep === 'upload' && (
              <FileUpload onFileUpload={handleFileUpload} />
            )}

            {currentStep === 'preview' && rawData && (
              <DataPreview 
                data={rawData} 
                onContinue={handlePreviewComplete}
                onBack={() => setCurrentStep('upload')}
              />
            )}

            {currentStep === 'standardize' && rawData && (
              <StandardizationPanel
                data={rawData}
                dataStructure={dataStructure}
                onStandardize={handleStandardize}
                onBack={() => setCurrentStep('preview')}
                initialMappingRules={mappingRules}
                onDirectUpdate={handleDirectUpdate}
                onPreviewUpdate={handlePreviewUpdate}
              />
            )}

            {currentStep === 'output' && standardizedData && (
              <CleanedOutput
                data={standardizedData}
                mappingRules={mappingRules}
                dataStructure={dataStructure}
                onReset={handleReset}
                onEditMappings={handleEditMappings}
              />
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default App;
