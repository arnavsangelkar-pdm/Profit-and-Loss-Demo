import OpenAI from 'openai';

class OpenAIService {
  constructor() {
    this.client = null;
    this.apiKey = null;
  }

  // Initialize the OpenAI client with API key
  initialize(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAI API key is required');
    }
    
    this.apiKey = apiKey.trim();
    this.client = new OpenAI({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true // Note: In production, you should use a backend proxy
    });
  }

  // Check if the service is initialized
  isInitialized() {
    return this.client !== null && this.apiKey !== null;
  }

  // Get the API key (for display purposes)
  getApiKey() {
    return this.apiKey;
  }

  // Standardize P&L labels using OpenAI
  async standardizeLabels(labels, standardCategories) {
    if (!this.isInitialized()) {
      throw new Error('OpenAI service not initialized. Please provide an API key.');
    }

    try {
      const categoryList = Object.keys(standardCategories).join(', ');
      
      const prompt = `You are a financial data expert. I need you to map the following P&L statement labels to the most appropriate standard categories.

Standard P&L Categories: ${categoryList}

For each label, provide:
1. The best matching standard category
2. A confidence score (0.0 to 1.0)
3. A brief explanation of why this mapping makes sense

Labels to map: ${labels.join(', ')}

Respond with a JSON array where each object has:
- "originalLabel": the original label
- "standardCategory": the best matching standard category
- "confidence": confidence score (0.0-1.0)
- "explanation": brief explanation
- "alternativeCategories": array of 2-3 alternative categories if confidence < 0.8

Example format:
[
  {
    "originalLabel": "Sales Revenue",
    "standardCategory": "Total Revenue",
    "confidence": 0.95,
    "explanation": "Sales revenue directly maps to total revenue category",
    "alternativeCategories": ["Other Income"]
  }
]`;

      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial data expert specializing in P&L statement standardization. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      
      // Try to parse the JSON response
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.error('Raw response:', content);
        throw new Error('Invalid response format from OpenAI');
      }

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your key.');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }
  }

  // Batch process labels in chunks to avoid token limits
  async standardizeLabelsBatch(labels, standardCategories, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < labels.length; i += batchSize) {
      const batch = labels.slice(i, i + batchSize);
      try {
        const batchResults = await this.standardizeLabels(batch, standardCategories);
        results.push(...batchResults);
        
        // Add a small delay between batches to respect rate limits
        if (i + batchSize < labels.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, error);
        // Add fallback entries for failed batch
        batch.forEach(label => {
          results.push({
            originalLabel: label,
            standardCategory: null,
            confidence: 0,
            explanation: 'Failed to process with OpenAI',
            alternativeCategories: []
          });
        });
      }
    }
    
    return results;
  }

  // Validate API key by making a simple test call
  async validateApiKey(apiKey) {
    try {
      const tempClient = new OpenAI({
        apiKey: apiKey.trim(),
        dangerouslyAllowBrowser: true
      });

      await tempClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Hello"
          }
        ],
        max_tokens: 5
      });

      return { valid: true, error: null };
    } catch (error) {
      if (error.code === 'invalid_api_key') {
        return { valid: false, error: 'Invalid API key' };
      } else if (error.code === 'insufficient_quota') {
        return { valid: false, error: 'API quota exceeded' };
      } else {
        return { valid: false, error: error.message };
      }
    }
  }
}

// Export a singleton instance
export const openaiService = new OpenAIService();
export default openaiService;
