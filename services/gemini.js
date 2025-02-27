import {
  getProviderConfig,
  getApiEndpoint,
  getApiHeaders,
  formatApiRequest,
  parseApiResponse
} from '../config/llmConfig.js';

import { getSystemPrompt } from '../config/systemPrompts.js';
import { validateApiResponse } from '../utils/apiUtils.js';

const PROVIDER = 'gemini';

/**
 * Test Gemini API connection
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<object>} Test result with success status and response
 */
export async function testConnection(apiKey) {
  try {
    const testModel = 'gemini-2.0-flash';
    const endpoint = getApiEndpoint(PROVIDER, 'generate', apiKey, testModel);
    const headers = getApiHeaders(PROVIDER, apiKey);
    
    const request = formatApiRequest(
      PROVIDER,
      testModel,
      'Hi'
    );

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    const data = await validateApiResponse(response, PROVIDER);
    const result = parseApiResponse(PROVIDER, data, testModel);

    return {
      success: true,
      response: result.text
    };
  } catch (error) {
    console.error('Gemini test failed:', error);
    throw error;
  }
}

/**
 * Enhance a prompt using Gemini
 * @param {string} text - Original prompt text
 * @param {string} framework - Framework identifier
 * @param {string} apiKey - Gemini API key
 * @param {string} model - Model identifier
 * @returns {Promise<object>} Enhanced prompt result
 */
export async function enhancePrompt(text, framework, apiKey, model, settings = {}) {
  try {
    // Validate model is a Gemini model
    if (!model.startsWith('gemini-')) {
      throw new Error(`Invalid Gemini model: ${model}. Model ID must start with 'gemini-'`);
    }

    // Get base configuration
    const config = getProviderConfig(PROVIDER);
    const modelConfig = {
      maxTokens: settings.maxTokens || 1000,
      temperature: settings.temperature ?? 0.7
    };
    
    // Get endpoint with model
    const endpoint = getApiEndpoint(PROVIDER, 'generate', apiKey, model);
    
    const headers = getApiHeaders(PROVIDER, apiKey);
    const systemPrompt = getSystemPrompt(framework);
    
    // Combine system prompt and user input for Gemini
    const combinedPrompt = `${systemPrompt}\n\nUser Input: ${text}`;
    
    const request = formatApiRequest(
      PROVIDER,
      model,
      combinedPrompt,
      modelConfig
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
    console.error('Gemini enhancement failed:', error);
    throw error;
  }
}

/**
 * Get available Gemini models
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
 * Validate Gemini API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the API key format is valid
 */
export function isValidApiKey(apiKey) {
  return /^AI[a-zA-Z0-9_-]{20,}$/.test(apiKey);
}
