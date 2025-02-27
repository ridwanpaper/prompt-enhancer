import * as openai from '../services/openai.js';
import * as gemini from '../services/gemini.js';
import * as claude from '../services/claude.js';
import { formatErrorMessage } from '../utils/apiUtils.js';

// Default framework when none selected
const DEFAULT_FRAMEWORK = 'cot'; // Chain-of-Thought as default

// Store for API configurations
let apiKeys = {};
let selectedModels = {};
let selectedFrameworks = [];
let advancedSettings = {
  maxTokens: 1000,
  temperature: 0.7
};

/**
 * Initialize message handler with stored settings
 */
export async function initialize() {
  const result = await chrome.storage.sync.get(['apiKeys', 'selectedModels', 'selectedFrameworks', 'advancedSettings']);
  apiKeys = result.apiKeys || {};
  selectedModels = result.selectedModels || {};
  // Ensure at least default framework is selected
  selectedFrameworks = result.selectedFrameworks?.length ? result.selectedFrameworks : [DEFAULT_FRAMEWORK];
  advancedSettings = result.advancedSettings || { maxTokens: 1000, temperature: 0.7 };
  
  console.log('Initialized with frameworks:', selectedFrameworks);
}

/**
 * Handle incoming messages
 * @param {object} message - Message object
 * @param {object} sender - Sender information
 * @returns {Promise<any>} Response to the message
 */
export async function handleMessage(message, sender) {
  try {
    switch (message.type) {
      case 'SETTINGS_UPDATED':
        return handleSettingsUpdate(message.data);
      
      case 'TEST_CONNECTION':
        return handleConnectionTest(message.service, message.apiKey);
      
      case 'ENHANCE_PROMPT':
        return handlePromptEnhancement(message.text, message.framework);
      
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    console.error('Message handler error:', error);
    return {
      success: false,
      error: formatErrorMessage(error)
    };
  }
}

/**
 * Handle settings update
 * @param {object} data - Updated settings
 * @returns {Promise<object>} Update result
 */
/**
 * Validate settings update data
 * @param {object} data - Settings data to validate
 * @throws {Error} If data is invalid
 */
function validateSettingsData(data) {
  if (!data.selectedModel || !data.selectedModel.provider || !data.selectedModel.modelId) {
    throw new Error('Invalid model selection data');
  }
  if (!Array.isArray(data.selectedFrameworks)) {
    throw new Error('Invalid frameworks data');
  }
  if (!data.apiKeys || typeof data.apiKeys !== 'object') {
    throw new Error('Invalid API keys data');
  }
  if (data.advancedSettings) {
    const { maxTokens, temperature } = data.advancedSettings;
    if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 100000) {
      throw new Error('Invalid max tokens value');
    }
    if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
      throw new Error('Invalid temperature value');
    }
  }
}

/**
 * Handle settings update
 * @param {object} data - Updated settings
 * @returns {Promise<object>} Update result
 */
async function handleSettingsUpdate(data) {
  try {
    // Validate incoming data
    validateSettingsData(data);

    // Transform single model to models map
    const modelsMap = {
      [data.selectedModel.provider]: data.selectedModel.modelId
    };

    // Update local state
    apiKeys = data.apiKeys;
    selectedModels = modelsMap;
    selectedFrameworks = data.selectedFrameworks;
    if (data.advancedSettings) {
      advancedSettings = data.advancedSettings;
    }
    
    // Save to storage
    await chrome.storage.sync.set({
      apiKeys,
      selectedModels,
      selectedFrameworks,
      advancedSettings
    });

    return { success: true };
  } catch (error) {
    console.error('Settings update failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle connection test
 * @param {string} service - Service identifier
 * @param {string} apiKey - API key to test
 * @returns {Promise<object>} Test result
 */
async function handleConnectionTest(service, apiKey) {
  const services = {
    openai,
    gemini,
    claude
  };

  if (!services[service]) {
    throw new Error(`Unknown service: ${service}`);
  }

  return await services[service].testConnection(apiKey);
}

/**
 * Handle prompt enhancement
 * @param {string} text - Text to enhance
 * @param {string[]} frameworks - Frameworks to use
 * @returns {Promise<object>} Enhancement result
 */
async function handlePromptEnhancement(text, frameworks) {
  // Validate text input
  if (!text?.trim()) {
    throw new Error('No text provided for enhancement');
  }

  // Use provided frameworks, active ones, or default
  let frameworksToUse = frameworks || getActiveFrameworks();
  if (!frameworksToUse?.length) {
    console.log(`No frameworks selected, using default: ${DEFAULT_FRAMEWORK}`);
    frameworksToUse = [DEFAULT_FRAMEWORK];
  }

  // Get selected model and its service
  const model = Object.values(selectedModels)[0];
  if (!model) {
    throw new Error('No model selected. Please select a model in extension settings.');
  }
  const service = getServiceForModel(model);
  const services = { openai, gemini, claude };

  console.log(`Enhancing prompt with frameworks:`, frameworksToUse);
  console.log(`Using service: ${service}, model: ${model}`);

  // Track any enhancement errors
  const errors = [];
  const successfulEnhancements = [];

  // Helper function to emit progress updates
  const updateProgress = (step, details = '') => {
    chrome.runtime.sendMessage({
      type: 'ENHANCEMENT_PROGRESS',
      data: { step, details }
    });
  };

  try {
    // Initialize
    updateProgress('initialize');
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UI feedback

    // Process with LLM
    updateProgress('process', `Using ${service} model`);

    // Enhance prompt with each framework using the selected model
    for (const framework of frameworksToUse) {
      try {
        // Update progress for framework application
        updateProgress('framework', `Applying ${framework} framework`);
        
        const result = await services[service].enhancePrompt(
          text,
          framework,
          apiKeys[service],
          model,
          advancedSettings
        );
        
        successfulEnhancements.push(result);
        
        // Update progress for refinement
        updateProgress('refine', `Refining ${framework} output`);
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UI feedback
      } catch (error) {
        console.error(`Enhancement failed for framework ${framework}:`, error);
        errors.push(`${framework}: ${error.message}`);
      }
    }

    // If no enhancements succeeded, throw error
    if (successfulEnhancements.length === 0) {
      throw new Error(`Enhancement failed for all frameworks: ${errors.join('; ')}`);
    }

    // Complete
    updateProgress('complete');

    // Return successful enhancements
    const enhancedPrompts = successfulEnhancements;

    return {
      success: true,
      data: {
        original: text,
        enhanced: enhancedPrompts
      }
    };
  } catch (error) {
    // Send error state
    chrome.runtime.sendMessage({
      type: 'ENHANCEMENT_ERROR',
      error: error.message
    });
    throw error;
  }
}

/**
 * Check if current configuration is valid
 * @returns {boolean} Whether configuration is valid
 */
function hasValidConfiguration() {
  return (
    Object.values(apiKeys).some(key => key?.trim()) && 
    Object.keys(selectedModels).length > 0 &&
    selectedFrameworks.length > 0
  );
}

/**
 * Get frameworks that can be used with current configuration
 * @returns {Array<string>} Active frameworks
 */
function getActiveFrameworks() {
  // Check if we have a model selected and its service configured
  const model = Object.values(selectedModels)[0];
  if (!model) {
    console.warn('No model selected for framework activation');
    return [];
  }

  try {
    const service = getServiceForModel(model);
    // If we have a valid service and API key, return frameworks or default
    if (apiKeys[service]?.trim()) {
      // Return selected frameworks or default if none selected
      const frameworks = selectedFrameworks.length ? selectedFrameworks : [DEFAULT_FRAMEWORK];
      console.log(`Active frameworks for ${service}:`, frameworks);
      return frameworks;
    }
    console.warn(`No API key configured for ${service}`);
    return [];
  } catch (error) {
    console.error('Error getting active frameworks:', error);
    return [];
  }
}

/**
 * Get service based on selected model
 * @param {string} model - Model identifier
 * @returns {string} Service identifier
 * @throws {Error} If model is unknown or service not configured
 */
function getServiceForModel(model) {
  // Determine service based on model prefix
  let service;
  if (model.startsWith('gpt-')) {
    service = 'openai';
  } else if (model.startsWith('gemini-')) {
    service = 'gemini';
  } else if (model.startsWith('claude-')) {
    service = 'claude';
  } else {
    throw new Error(`Unknown model format: ${model}`);
  }

  // Verify service is configured
  if (!apiKeys[service]?.trim()) {
    throw new Error(`API key not configured for ${service}`);
  }

  return service;
}

/**
 * Map framework to service based on selected model
 * @param {string} framework - Framework identifier
 * @returns {string} Service identifier
 * @throws {Error} If framework is unknown or service not configured
 */
function getServiceForFramework(framework) {
  // Validate framework exists in system prompts
  if (!framework) {
    throw new Error('No framework specified');
  }
  
  // Get service based on currently selected model
  const model = Object.values(selectedModels)[0];
  if (!model) {
    throw new Error('No model selected. Please select a model in extension settings.');
  }

  return getServiceForModel(model);
}