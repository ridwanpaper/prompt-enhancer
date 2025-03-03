import {
  getProviderConfig,
  getApiEndpoint,
  getApiHeaders,
  formatApiRequest,
  parseApiResponse
} from '../config/llmConfig.js';

import { getSystemPrompt } from '../config/systemPrompts.js';
import { validateApiResponse } from '../utils/apiUtils.js';

const PROVIDER = 'deepseek';

/**
 * Test DeepSeek API connection
 * @param {string} apiKey - DeepSeek API key
 * @returns {Promise<object>} Test result with success status and response
 */
export async function testConnection(apiKey) {
  try {
    const testModel = 'deepseek-chat';
    const endpoint = getApiEndpoint(PROVIDER, 'chat', apiKey);
    const headers = getApiHeaders(PROVIDER, apiKey);
    
    const request = formatApiRequest(
      PROVIDER,
      testModel,
      [{ role: 'user', content: 'Hi' }],
      { maxTokens: 50 }
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
    console.error('DeepSeek test failed:', error);
    throw error;
  }
}

/**
 * Enhance a prompt using DeepSeek
 * @param {string} text - Original prompt text
 * @param {string} framework - Framework identifier
 * @param {string} apiKey - DeepSeek API key
 * @param {string} model - Model identifier
 * @returns {Promise<object>} Enhanced prompt result
 */
export async function enhancePrompt(text, framework, apiKey, model, settings = {}) {
  try {
    // Validate model is a DeepSeek model
    if (!model.startsWith('deepseek-')) {
      throw new Error(`Invalid DeepSeek model: ${model}. Model ID must start with 'deepseek-'`);
    }

    const endpoint = getApiEndpoint(PROVIDER, 'chat', apiKey);
    const headers = getApiHeaders(PROVIDER, apiKey);
    const systemPrompt = getSystemPrompt(framework);
    
    const modelConfig = {
      maxTokens: settings.maxTokens || 1000,
      temperature: settings.temperature ?? 0.7
    };
    
    const request = formatApiRequest(
      PROVIDER,
      model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
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
      model: result.model,
      usage: result.usage
    };
  } catch (error) {
    console.error('DeepSeek enhancement failed:', error);
    throw error;
  }
}

/**
 * Get available DeepSeek models
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
 * Validate DeepSeek API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the API key format is valid
 */
export function isValidApiKey(apiKey) {
  return /^sk-[a-zA-Z0-9]{32,}$/.test(apiKey);
}