import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Edit3, Save, RotateCcw, Sparkles, Eye } from 'lucide-react';
import { generateMappingSuggestionsHybrid, STANDARD_PL_CATEGORIES } from '../utils/standardizer';
import { openaiService } from '../utils/openaiService';
import OpenAIConfig from './OpenAIConfig';

const StandardizationPanel = ({ data, onStandardize, onBack, dataStructure, initialMappingRules, onDirectUpdate, onPreviewUpdate }) => {
  const [mappingRules, setMappingRules] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [editingLabel, setEditingLabel] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOpenAIConfig, setShowOpenAIConfig] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(true);
  const [generationError, setGenerationError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (data && data.length > 0 && openaiService.isInitialized()) {
      generateSuggestions();
    }
  }, [data, useOpenAI]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize with existing mapping rules if provided (when editing from output)
  useEffect(() => {
    if (initialMappingRules && Object.keys(initialMappingRules).length > 0) {
      setMappingRules(initialMappingRules);
      setSuggestions(initialMappingRules);
    }
  }, [initialMappingRules]);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      
      if (!openaiService.isInitialized()) {
        throw new Error('OpenAI service is required but not configured. Please configure your API key.');
      }
      
      const generatedSuggestions = await generateMappingSuggestionsHybrid(data, openaiService, dataStructure);
      
      // If no suggestions were generated, create basic fallback mappings
      if (Object.keys(generatedSuggestions).length === 0) {
        const fallbackSuggestions = {};
        const uniqueLabels = [...new Set(data.map(row => row[dataStructure.labelColumn]).filter(Boolean))];
        
        uniqueLabels.forEach(label => {
          const row = data.find(r => r[dataStructure.labelColumn] === label);
          if (row) {
            const totalAmount = dataStructure.amountColumns.reduce((sum, col) => {
              return sum + (parseFloat(row[col]) || 0);
            }, 0);
            
            const monthlyAmounts = dataStructure.amountColumns.map(col => parseFloat(row[col]) || 0);
            
            fallbackSuggestions[label] = {
              standardLabel: 'Other', // Default category
              amount: totalAmount,
              monthlyAmounts: monthlyAmounts,
              confidence: 0.1,
              matchType: 'fallback',
              source: 'fallback'
            };
          }
        });
        
        const ensuredSuggestions = ensureAllMappingRulesHaveMonthlyAmounts(fallbackSuggestions, dataStructure);
        setSuggestions(ensuredSuggestions);
        setMappingRules(ensuredSuggestions);
      } else {
        const ensuredSuggestions = ensureAllMappingRulesHaveMonthlyAmounts(generatedSuggestions, dataStructure);
        setSuggestions(ensuredSuggestions);
        setMappingRules(ensuredSuggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setGenerationError(error.message);
      
      // Create fallback mappings even when AI fails
      const fallbackSuggestions = {};
      const uniqueLabels = [...new Set(data.map(row => row[dataStructure.labelColumn]).filter(Boolean))];
      
      uniqueLabels.forEach(label => {
        const row = data.find(r => r[dataStructure.labelColumn] === label);
        if (row) {
          const totalAmount = dataStructure.amountColumns.reduce((sum, col) => {
            return sum + (parseFloat(row[col]) || 0);
          }, 0);
          
          const monthlyAmounts = dataStructure.amountColumns.map(col => parseFloat(row[col]) || 0);
          
          fallbackSuggestions[label] = {
            standardLabel: 'Other', // Default category
            amount: totalAmount,
            monthlyAmounts: monthlyAmounts,
            confidence: 0.1,
            matchType: 'fallback',
            source: 'fallback'
          };
        }
      });
      
      const ensuredSuggestions = ensureAllMappingRulesHaveMonthlyAmounts(fallbackSuggestions, dataStructure);
      setSuggestions(ensuredSuggestions);
      setMappingRules(ensuredSuggestions);
    } finally {
      setIsGenerating(false);
    }
  };

  const ensureMonthlyAmounts = (mapping, dataStructure) => {
    // Only initialize monthly amounts if they don't exist or are the wrong length
    if (!mapping.monthlyAmounts || mapping.monthlyAmounts.length !== dataStructure.amountColumns.length) {
      // Initialize monthly amounts from the original data
      const row = data.find(r => r[dataStructure.labelColumn] === Object.keys(mappingRules).find(key => mappingRules[key] === mapping));
      if (row) {
        const monthlyAmounts = dataStructure.amountColumns.map(col => parseFloat(row[col]) || 0);
        return { ...mapping, monthlyAmounts };
      }
    }
    return mapping;
  };

  const ensureAllMappingRulesHaveMonthlyAmounts = (rules, dataStructure) => {
    const updatedRules = {};
    Object.entries(rules).forEach(([label, mapping]) => {
      if (!mapping.monthlyAmounts || mapping.monthlyAmounts.length !== dataStructure.amountColumns.length) {
        const row = data.find(r => r[dataStructure.labelColumn] === label);
        if (row) {
          const monthlyAmounts = dataStructure.amountColumns.map(col => parseFloat(row[col]) || 0);
          updatedRules[label] = { ...mapping, monthlyAmounts };
        } else {
          updatedRules[label] = mapping;
        }
      } else {
        updatedRules[label] = mapping;
      }
    });
    return updatedRules;
  };

  const handleMappingChange = (originalLabel, field, value) => {
    setMappingRules(prev => {
      const currentMapping = prev[originalLabel] || {};
      const updatedMapping = { ...currentMapping, [field]: value };
      
      // Only ensure monthly amounts are initialized if we're not setting monthly amounts
      let finalMapping = updatedMapping;
      if (field !== 'monthlyAmounts') {
        finalMapping = ensureMonthlyAmounts(updatedMapping, dataStructure);
      }
      
      const newRules = {
        ...prev,
        [originalLabel]: finalMapping
      };
      setHasUnsavedChanges(true);
      
      // Trigger automatic preview update when mapping rules change
      if (onPreviewUpdate && Object.keys(newRules).length > 0) {
        // Only trigger update if we have at least one valid mapping
        const validMappings = Object.fromEntries(
          Object.entries(newRules).filter(([_, mapping]) => 
            mapping.standardLabel && mapping.standardLabel.trim() !== ''
          )
        );
        
        if (Object.keys(validMappings).length > 0) {
          // Use setTimeout to ensure state update happens first
          setTimeout(() => {
            try {
              onPreviewUpdate(validMappings);
            } catch (error) {
              console.error('Error in auto-preview update:', error);
            }
          }, 0);
        }
      }
      
      return newRules;
    });
  };

  const handleStandardize = () => {
    // Filter out mappings with no standard label
    const validMappings = Object.fromEntries(
      Object.entries(mappingRules).filter(([_, mapping]) => 
        mapping.standardLabel && mapping.standardLabel.trim() !== ''
      )
    );
    
    if (Object.keys(validMappings).length === 0) {
      setGenerationError('Please map at least one label to a standard category before proceeding.');
      return;
    }
    
    console.log('Proceeding with standardization with mappings:', Object.keys(validMappings).length);
    console.log('Sample mapping rule:', Object.keys(validMappings)[0], validMappings[Object.keys(validMappings)[0]]);
    
    // Ensure all mapping rules have proper monthly amounts before proceeding
    const ensuredMappings = ensureAllMappingRulesHaveMonthlyAmounts(validMappings, dataStructure);
    
    // Use direct update if available, otherwise fall back to old method
    if (onDirectUpdate) {
      console.log('Using direct update for standardization with', Object.keys(ensuredMappings).length, 'mapping rules');
      onDirectUpdate(ensuredMappings);
      setHasUnsavedChanges(false);
    } else {
      onStandardize(ensuredMappings);
      setHasUnsavedChanges(false);
    }
  };

  const resetToSuggestions = () => {
    const ensuredSuggestions = ensureAllMappingRulesHaveMonthlyAmounts(suggestions, dataStructure);
    setMappingRules(ensuredSuggestions);
  };

  const handleOpenAIConfigChange = (enabled) => {
    setUseOpenAI(enabled);
    setShowOpenAIConfig(false);
    if (enabled && data && data.length > 0) {
      // Retry generating suggestions after OpenAI is configured
      generateSuggestions();
    }
  };


  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  const getSourceIcon = (source) => {
    if (source === 'openai') return <Sparkles className="w-3 h-3" />;
    return null;
  };

  const getSourceColor = (source) => {
    if (source === 'openai') return 'text-purple-600 bg-purple-100';
    if (source === 'keyword_fallback') return 'text-orange-600 bg-orange-100';
    return 'text-blue-600 bg-blue-100';
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for standardization
      </div>
    );
  }

  if (!openaiService.isInitialized()) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">OpenAI Configuration Required</h2>
          <p className="text-gray-600 mb-6">
            This application uses AI to intelligently map your P&L labels to standard categories. 
            Please configure your OpenAI API key to continue.
          </p>
          <button
            onClick={() => setShowOpenAIConfig(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
          >
            <Sparkles className="w-5 h-5" />
            <span>Configure OpenAI API Key</span>
          </button>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>

        <OpenAIConfig
          isOpen={showOpenAIConfig}
          onConfigChange={handleOpenAIConfigChange}
          onClose={() => setShowOpenAIConfig(false)}
        />
      </div>
    );
  }

  const uniqueLabels = [...new Set(data.map(row => row[dataStructure.labelColumn]).filter(Boolean))];
  const validMappingsCount = Object.values(mappingRules).filter(m => m.standardLabel).length;

  const handleKeyDown = (e) => {
    // Prevent Enter key from triggering form submission or navigation
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      e.stopPropagation();
    }
    // Prevent other keys that might trigger navigation
    if (e.key === 'Escape' || e.key === 'Tab') {
      // Allow normal behavior for these keys
      return;
    }
  };

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Standardize Labels</h2>
          <div className="flex items-center space-x-2 mt-1">
            <span className="flex items-center space-x-1 text-sm text-purple-600">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Matching</span>
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {openaiService.isInitialized() ? (
            <button
              onClick={resetToSuggestions}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to AI Suggestions</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOpenAIConfig(true)}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Configure OpenAI</span>
            </button>
          )}
          {onPreviewUpdate && (
            <button
              onClick={() => {
                // Preview without navigating to output step
                const validMappings = Object.fromEntries(
                  Object.entries(mappingRules).filter(([_, mapping]) => 
                    mapping.standardLabel && mapping.standardLabel.trim() !== ''
                  )
                );
                if (Object.keys(validMappings).length > 0) {
                  onPreviewUpdate(validMappings);
                } else {
                  alert('Please map at least one label to a standard category before previewing.');
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Changes</span>
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* Error Display */}
      {generationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">AI Matching Error</h3>
              <p className="text-sm text-red-800">{generationError}</p>
              <p className="text-xs text-red-700 mt-1">Please configure your OpenAI API key to continue.</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900">Mapping Progress</h3>
            <p className="text-sm text-blue-800">
              {validMappingsCount} of {uniqueLabels.length} labels mapped
              {hasUnsavedChanges && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Auto-updating data
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((validMappingsCount / uniqueLabels.length) * 100)}%
            </div>
            <div className="text-sm text-blue-600">Complete</div>
          </div>
        </div>
        <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(validMappingsCount / uniqueLabels.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Mapping Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Label Mappings</h3>
        
        {isGenerating ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating mapping suggestions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uniqueLabels.map(originalLabel => {
              const mapping = mappingRules[originalLabel] || {};
              const suggestion = suggestions[originalLabel];
              
              return (
                <div key={originalLabel} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{originalLabel}</span>
                      {suggestion && (
                        <>
                          <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(suggestion.confidence)}`}>
                            {getConfidenceText(suggestion.confidence)} Confidence
                          </span>
                          {suggestion.source && (
                            <span className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${getSourceColor(suggestion.source)}`}>
                              {getSourceIcon(suggestion.source)}
                              <span>{suggestion.source === 'openai' ? 'AI' : 'Keyword'}</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingLabel(editingLabel === originalLabel ? null : originalLabel)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Standard Label */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Standard Label
                    </label>
                    <select
                      value={mapping.standardLabel || ''}
                      onKeyDown={(e) => {
                        // Prevent Enter key from triggering navigation
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      onChange={(e) => handleMappingChange(originalLabel, 'standardLabel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select a standard category...</option>
                      {Object.keys(STANDARD_PL_CATEGORIES).map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="Other">Other (Custom)</option>
                    </select>
                  </div>

                  {/* Monthly Amounts */}
                  {dataStructure?.amountColumns && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Amounts
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {dataStructure.amountColumns.map((column, index) => (
                          <div key={column}>
                            <label className="block text-xs text-gray-600 mb-1">
                              {column}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={mapping.monthlyAmounts?.[index] ?? ''}
                              onKeyDown={(e) => {
                                // Prevent Enter key from triggering navigation
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                              onChange={(e) => {
                                // Ensure we have a proper array for monthly amounts
                                const currentMonthlyAmounts = mapping.monthlyAmounts || new Array(dataStructure.amountColumns.length).fill(0);
                                const newMonthlyAmounts = [...currentMonthlyAmounts];
                                newMonthlyAmounts[index] = parseFloat(e.target.value) || 0;
                                const newTotal = newMonthlyAmounts.reduce((sum, val) => sum + val, 0);
                                
                                
                                // Update both monthly amounts and total in a single operation
                                const updatedMapping = {
                                  ...mapping,
                                  monthlyAmounts: newMonthlyAmounts,
                                  amount: newTotal
                                };
                                
                                setMappingRules(prev => {
                                  const newRules = {
                                    ...prev,
                                    [originalLabel]: updatedMapping
                                  };
                                  
                                  setHasUnsavedChanges(true);
                                  
                                  // Trigger automatic preview update when monthly amounts change
                                  if (onPreviewUpdate) {
                                    const validMappings = Object.fromEntries(
                                      Object.entries(newRules).filter(([_, mapping]) => 
                                        mapping.standardLabel && mapping.standardLabel.trim() !== ''
                                      )
                                    );
                                    
                                    if (Object.keys(validMappings).length > 0) {
                                      // Use setTimeout to ensure state update happens first
                                      setTimeout(() => {
                                        try {
                                          onPreviewUpdate(validMappings);
                                        } catch (error) {
                                          console.error('Error in auto-preview update:', error);
                                        }
                                      }, 0);
                                    }
                                  }
                                  
                                  return newRules;
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Total: ${(mapping.amount || 0).toLocaleString()}</span>
                          {hasUnsavedChanges && (
                            <span className="text-orange-600 text-xs font-medium animate-pulse">
                              • Updated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggestion Info */}
                  {suggestion && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          Suggested: <strong>{suggestion.standardLabel}</strong>
                          {suggestion.matchType && (
                            <span className="ml-1">({suggestion.matchType})</span>
                          )}
                        </span>
                      </div>
                      {suggestion.explanation && (
                        <div className="text-xs text-gray-500 italic">
                          {suggestion.explanation}
                        </div>
                      )}
                      {suggestion.alternativeCategories && suggestion.alternativeCategories.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Alternatives:</span> {suggestion.alternativeCategories.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {validMappingsCount > 0 ? (
            <span className="text-green-600">
              ✓ {validMappingsCount} labels ready for standardization
            </span>
          ) : (
            <span className="text-red-600">
              ⚠️ No labels mapped yet. Please configure at least one mapping.
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStandardize}
            disabled={validMappingsCount === 0}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
              hasUnsavedChanges 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Save className="w-4 h-4" />
            <span>{hasUnsavedChanges ? 'Save & Standardize' : 'Standardize Data'}</span>
          </button>
        </div>
      </div>

      {/* OpenAI Configuration Modal */}
      <OpenAIConfig
        isOpen={showOpenAIConfig}
        onConfigChange={handleOpenAIConfigChange}
        onClose={() => setShowOpenAIConfig(false)}
      />
    </div>
  );
};

export default StandardizationPanel;
