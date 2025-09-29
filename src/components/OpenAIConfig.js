import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Loader, Sparkles } from 'lucide-react';
import { openaiService } from '../utils/openaiService';

const OpenAIConfig = ({ onConfigChange, isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if OpenAI is already configured
    if (openaiService.isInitialized()) {
      setIsConfigured(true);
      setApiKey(openaiService.getApiKey().substring(0, 8) + '...');
    }
  }, []);

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    setValidationStatus(null);
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationStatus({ valid: false, error: 'Please enter an API key' });
      return;
    }

    setIsValidating(true);
    setValidationStatus(null);

    try {
      const result = await openaiService.validateApiKey(apiKey);
      
      if (result.valid) {
        openaiService.initialize(apiKey);
        setValidationStatus({ valid: true, error: null });
        setIsConfigured(true);
        onConfigChange(true);
      } else {
        setValidationStatus({ valid: false, error: result.error });
      }
    } catch (error) {
      setValidationStatus({ valid: false, error: error.message });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (validationStatus?.valid) {
      onConfigChange(true);
      onClose();
    }
  };

  const handleSkip = () => {
    onConfigChange(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">OpenAI Integration</h2>
              <p className="text-sm text-gray-600">Enable AI-powered label matching</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Enhanced Standardization:</strong> Use OpenAI's GPT model to intelligently map your P&L labels to standard categories with higher accuracy than keyword matching.
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isConfigured}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Validation Status */}
            {validationStatus && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                validationStatus.valid 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {validationStatus.valid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {validationStatus.valid 
                    ? 'API key is valid and ready to use!' 
                    : validationStatus.error
                  }
                </span>
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Privacy:</strong> Your API key is stored locally in your browser and only used to make requests to OpenAI's API. 
                We don't store or transmit your key to our servers.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip (Use Keyword Matching)
            </button>
            
            <div className="flex items-center space-x-3">
              {!isConfigured && (
                <button
                  onClick={validateApiKey}
                  disabled={isValidating || !apiKey.trim()}
                  className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Validate</span>
                </button>
              )}
              
              <button
                onClick={handleSave}
                disabled={!validationStatus?.valid}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enable AI Matching</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenAIConfig;
