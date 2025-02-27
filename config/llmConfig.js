/**
 * LLM provider and model configurations.
 * Each provider includes:
 * - name: Provider display name
 * - families: Model families and their available models
 * - endpoints: API endpoints
 * - headers: Required headers for API calls
 */

export const llmConfigs = {
  openai: {
    name: 'OpenAI',
    families: {
      Text: {
        name: 'Text Generation',
        models: [
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 1000 },
          { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 1000 },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 1000 }
        ]
      }
    },
    endpoints: {
      chat: 'https://api.openai.com/v1/chat/completions'
    },
    getHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (model, messages, options = {}) => ({
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1500
    }),
    parseResponse: (data) => ({
      text: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
    })
  },

  gemini: {
    name: 'Google Gemini',
    families: {
      Text: {
        name: 'Text Generation',
        models: [
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', maxTokens: 1000 },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', maxTokens: 1000 },
          { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Exp 02-05', maxTokens: 1000 }
        ]
      }
    },
    endpoints: {
      generate: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    getHeaders: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (model, text, options = {}) => ({
      contents: [{
        parts: [{
          text: text
        }]
      }]
    }),
    formatUrl: (endpoint, apiKey, model) => `${endpoint}/${model}:generateContent?key=${apiKey}`,
    parseResponse: (data, model) => ({
      text: data.candidates[0].content.parts[0].text,
      model: model,
      usage: data.usage || {}
    })
  },

  claude: {
    name: 'Anthropic Claude',
    families: {
      Text: {
        name: 'Text Generation',
        models: [
          { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', description: 'Most intelligent model', maxTokens: 100 },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest model for daily tasks', maxTokens: 100 },
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Excels at writing and complex tasks', maxTokens: 100 }
        ]
      }
    },
    endpoints: {
      chat: 'https://api.anthropic.com/v1/messages'
    },
    getHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    }),
    formatRequest: (model, messages, options = {}) => ({
      model,
      messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
      max_tokens: options.maxTokens || 100,
      temperature: options.temperature || 0.7,
      ...(options.system && { system: options.system })
    }),
    parseResponse: (data) => ({
      text: data.content[0].text,
      model: data.model,
      usage: data.usage || {}
    })
  }
};

/**
 * Get configuration for a specific LLM provider
 * @param {string} provider - Provider identifier
 * @returns {object} Provider configuration
 */
export function getProviderConfig(provider) {
  return llmConfigs[provider];
}

/**
 * Get available model families for a provider
 * @param {string} provider - Provider identifier
 * @returns {Array} Array of family objects
 */
export function getModelFamilies(provider) {
  const config = llmConfigs[provider];
  if (!config) return [];
  
  return Object.entries(config.families).map(([id, family]) => ({
    id,
    name: family.name
  }));
}

/**
 * Get available models for a provider and family
 * @param {string} provider - Provider identifier
 * @param {string} family - Family identifier
 * @returns {Array} Array of model objects
 */
export function getAvailableModels(provider, family) {
  const config = llmConfigs[provider];
  if (!config || !config.families[family]) return [];
  
  return config.families[family].models;
}

/**
 * Format API request for a provider
 * @param {string} provider - Provider identifier
 * @param {string} model - Model identifier
 * @param {string|object} input - Input text or messages
 * @param {object} options - Additional options
 * @returns {object} Formatted request object
 */
export function formatApiRequest(provider, model, input, options = {}) {
  const config = llmConfigs[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  
  return config.formatRequest(model, input, options);
}

/**
 * Get API headers for a provider
 * @param {string} provider - Provider identifier
 * @param {string} apiKey - API key
 * @returns {object} Headers object
 */
export function getApiHeaders(provider, apiKey) {
  const config = llmConfigs[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  
  return config.getHeaders(apiKey);
}

/**
 * Get API endpoint URL
 * @param {string} provider - Provider identifier
 * @param {string} endpoint - Endpoint identifier
 * @param {string} apiKey - API key (needed for some providers)
 * @param {string} model - Model identifier (needed for some providers)
 * @returns {string} Complete endpoint URL
 */
export function getApiEndpoint(provider, endpoint, apiKey, model) {
  const config = llmConfigs[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  
  const url = config.endpoints[endpoint];
  if (!url) throw new Error(`Unknown endpoint: ${endpoint}`);
  
  return config.formatUrl ? config.formatUrl(url, apiKey, model) : url;
}

/**
 * Parse API response
 * @param {string} provider - Provider identifier
 * @param {object} response - Raw API response
 * @param {string} model - Model identifier
 * @returns {object} Parsed response
 */
export function parseApiResponse(provider, response, model) {
  const config = llmConfigs[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  
  return config.parseResponse(response, model);
}