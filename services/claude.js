import {
  getProviderConfig,
  getApiEndpoint,
  getApiHeaders,
  formatApiRequest,
  parseApiResponse
} from '../config/llmConfig.js';

import { getSystemPrompt } from '../config/systemPrompts.js';
import { validateApiResponse } from '../utils/apiUtils.js';

const PROVIDER = 'claude';

/**
 * Test Claude API connection
 * @param {string} apiKey - Claude API key
 * @returns {Promise<object>} Test result with success status and response
 */
export async function testConnection(apiKey) {
  try {
    const endpoint = getApiEndpoint(PROVIDER, 'chat', apiKey);
    const headers = getApiHeaders(PROVIDER, apiKey);
    
    const request = formatApiRequest(
      PROVIDER,
      'claude-3-5-haiku-20241022',
      [{ role: 'user', content: 'Hi' }],
      { maxTokens: 50 }
    );

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });

    const data = await validateApiResponse(response, PROVIDER);
    const result = parseApiResponse(PROVIDER, data, 'claude-3-5-haiku-20241022');

    return {
      success: true,
      response: result.text
    };
  } catch (error) {
    console.error('Claude test failed:', error);
    throw error;
  }
}

/**
 * Enhance a prompt using Claude
 * @param {string} text - Original prompt text
 * @param {string} framework - Framework identifier
 * @param {string} apiKey - Claude API key
 * @param {string} model - Model identifier
 * @returns {Promise<object>} Enhanced prompt result
 */
export async function enhancePrompt(text, framework, apiKey, model, settings = {}) {
  try {
    // Validate model is a Claude model
    if (!model.startsWith('claude-')) {
      throw new Error(`Invalid Claude model: ${model}. Model ID must start with 'claude-'`);
    }

    // Use provided settings or defaults
    const modelConfig = {
      maxTokens: settings.maxTokens || 1000,
      temperature: settings.temperature ?? 0.7
    };
    const endpoint = getApiEndpoint(PROVIDER, 'chat', apiKey);
    const headers = getApiHeaders(PROVIDER, apiKey);
    const systemPrompt = getSystemPrompt(framework);
    
    const request = formatApiRequest(
      PROVIDER,
      model,
      [{ role: 'user', content: text }],
      {
        system: systemPrompt,
        maxTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature
      }
    );

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });

    const data = await validateApiResponse(response, PROVIDER);
    const result = parseApiResponse(PROVIDER, data, model);

    return {
      framework,
      enhanced: result.text,
      service: PROVIDER,
      model: model,
      usage: result.usage
    };
  } catch (error) {
    console.error('Claude enhancement failed:', error);
    throw error;
  }
}

/**
 * Get available Claude models
 * @returns {Array} Array of available models
 */
export function getModels() {
  const config = getProviderConfig(PROVIDER);
  return Object.values(config.families).flatMap(family => 
    family.models.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      maxTokens: model.maxTokens,
      temperature: model.temperature
    }))
  );
}

/**
 * Validate Claude API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the API key format is valid
 */
export function isValidApiKey(apiKey) {
  return /^sk-ant-[a-zA-Z0-9+/=-]{40,}$/.test(apiKey);
}

/**
 * Parse Claude API error response
 * @param {object} error - Error response from API
 * @returns {string} Formatted error message
 */
function parseClaudeError(error) {
  if (error.error?.type === 'invalid_request_error') {
    return `Invalid request: ${error.error.message}`;
  } else if (error.error?.type === 'authentication_error') {
    return 'Invalid API key';
  } else {
    return error.error?.message || 'Unknown error occurred';
  }
}