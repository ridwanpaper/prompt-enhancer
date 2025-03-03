import { getModelFamilies, getAvailableModels } from './config/llmConfig.js';

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const saveButton = document.getElementById('save-settings');
const loadingOverlay = document.querySelector('.loading-overlay');
const loadingSteps = document.querySelectorAll('.loading-step');

// Loading state management
let currentStep = '';

// Function to update loading state
function updateLoadingState(step, details = '') {
  // Reset all steps
  loadingSteps.forEach(stepEl => {
    stepEl.classList.remove('active', 'completed');
  });

  // Mark completed steps
  const stepOrder = ['initialize', 'process', 'framework', 'refine', 'complete'];
  const currentIndex = stepOrder.indexOf(step);
  
  stepOrder.forEach((stepName, index) => {
    const stepEl = document.querySelector(`[data-step="${stepName}"]`);
    if (index < currentIndex) {
      stepEl.classList.add('completed');
    } else if (index === currentIndex) {
      stepEl.classList.add('active');
      if (details) {
        stepEl.querySelector('span').textContent = `${stepEl.querySelector('span').textContent} - ${details}`;
      }
    }
  });

  currentStep = step;
}

// Show/hide loading overlay
function showLoading() {
  loadingOverlay.classList.add('active');
  updateLoadingState('initialize');
}

function hideLoading() {
  loadingOverlay.classList.remove('active');
  // Reset step text
  loadingSteps.forEach(step => {
    const span = step.querySelector('span');
    span.textContent = span.textContent.split(' - ')[0];
  });
}

// Listen for progress updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ENHANCEMENT_PROGRESS') {
    updateLoadingState(message.data.step, message.data.details);
  } else if (message.type === 'ENHANCEMENT_ERROR') {
    hideLoading();
    showStatus(message.error, 'error');
  }
});

// Status elements
const statusDiv = document.createElement('div');
statusDiv.id = 'status';
statusDiv.className = 'status';
document.querySelector('.save-container').insertBefore(statusDiv, document.querySelector('#save-settings'));

// Framework elements
const frameworkSearch = document.getElementById('framework-search');
const categoryFilter = document.getElementById('category-filter');
const frameworkCheckboxes = [
  'react', 'tot', 'self_consistency', 'pal', 'cot',    // Reasoning
  'few_shot', 'risen', 'trace', 'coast',              // Pattern
  'reflexion', 'ape', 'meta_prompting',               // Refinement
  'socratic', 'step_back', 'pain'                     // Analysis
].map(id => document.getElementById(id));

// Framework limit warning
const frameworkLimitWarning = document.createElement('div');
frameworkLimitWarning.className = 'framework-limit-warning';
frameworkLimitWarning.textContent = 'Maximum 3 frameworks can be selected';
document.querySelector('.framework-search').after(frameworkLimitWarning);

// API key inputs and test buttons
const providers = ['openai', 'gemini', 'claude'];
const apiInputs = {};
const testButtons = {};
const testStatus = {};

// Model selection elements
const modelInfo = document.getElementById('model-info');
const modelRadios = document.querySelectorAll('input[name="model"]');

providers.forEach(provider => {
  apiInputs[provider] = document.getElementById(`${provider}-key`);
  testButtons[provider] = document.getElementById(`test-${provider}`);
  testStatus[provider] = document.getElementById(`${provider}-status`);
});

// Settings state
let selectedProvider = null;
let selectedModel = null;
let selectedFrameworks = [];
let advancedSettings = {
  maxTokens: 1000,
  temperature: 0.7
};

// Advanced settings elements
const maxTokensInput = document.getElementById('max-tokens');
const temperatureInput = document.getElementById('temperature');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const result = await chrome.storage.sync.get(['apiKeys', 'selectedModel', 'selectedFrameworks', 'advancedSettings']);
  
  // Set API keys
  const apiKeys = result.apiKeys || {};
  providers.forEach(provider => {
    if (apiKeys[provider]) apiInputs[provider].value = apiKeys[provider];
  });
  
  // Set selected model
  if (result.selectedModel) {
    const modelValue = `${result.selectedModel.provider}:${result.selectedModel.modelId}`;
    const radioButton = document.querySelector(`input[name="model"][value="${modelValue}"]`);
    if (radioButton) {
      radioButton.checked = true;
      handleModelSelection(radioButton.value);
    }
  }
  
  // Set framework checkboxes
  selectedFrameworks = result.selectedFrameworks || [];
  frameworkCheckboxes.forEach(checkbox => {
    checkbox.checked = selectedFrameworks.includes(checkbox.value);
  });

  // Set advanced settings
  if (result.advancedSettings) {
    advancedSettings = result.advancedSettings;
    maxTokensInput.value = advancedSettings.maxTokens;
    temperatureInput.value = advancedSettings.temperature;
  }

  // Add advanced settings event listeners
  maxTokensInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value);
    if (value < 1) {
      e.target.value = 1;
      showStatus('Minimum tokens is 1', 'error');
    } else if (value > 100000) {
      e.target.value = 100000;
      showStatus('Maximum tokens is 100000', 'error');
    }
    advancedSettings.maxTokens = parseInt(e.target.value);
  });

  temperatureInput.addEventListener('change', (e) => {
    const value = parseFloat(e.target.value);
    if (value < 0) {
      e.target.value = 0;
      showStatus('Minimum temperature is 0', 'error');
    } else if (value > 1) {
      e.target.value = 1;
      showStatus('Maximum temperature is 1', 'error');
    }
    advancedSettings.temperature = parseFloat(e.target.value);
  });

  // Setup tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });
});

// Model selection handler
function handleModelSelection(value) {
  if (!value) {
    selectedModel = null;
    selectedProvider = null;
    modelInfo.textContent = '';
    return;
  }

  const [provider, modelId] = value.split(':');
  selectedProvider = provider;
  selectedModel = { provider, modelId };

  // Get model info from config
  const families = getModelFamilies(provider);
  families.forEach(family => {
    const models = getAvailableModels(provider, family.id);
    const model = models.find(m => m.id === modelId);
    if (model) {
      modelInfo.textContent = `Max tokens: ${model.maxTokens}`;
    }
  });
}

// Add radio button event listeners
modelRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    handleModelSelection(e.target.value);
  });
});

// Test connection handlers
function testConnection(provider) {
  const button = testButtons[provider];
  const status = testStatus[provider];
  const input = apiInputs[provider];
  
  const apiKey = input.value.trim();
  if (!apiKey) {
    showTestStatus(status, 'Please enter an API key', 'error');
    return;
  }

  // Disable button and show testing state
  button.disabled = true;
  button.classList.add('testing');
  button.textContent = 'Testing...';
  showTestStatus(status, 'Testing connection...', 'info');

  // Send test request to background script with proper Promise handling
  chrome.runtime.sendMessage({
    type: 'TEST_CONNECTION',
    service: provider,
    apiKey
  }, (response) => {
    if (chrome.runtime.lastError) {
      showTestStatus(status, `Error: ${chrome.runtime.lastError.message}`, 'error');
    } else if (response.success) {
      showTestStatus(
        status,
        `Connection successful!\nLLM Response: "${response.response}"`,
        'success'
      );
    } else {
      showTestStatus(status, `Error: ${response.error}`, 'error');
    }

    // Reset button state
    button.disabled = false;
    button.classList.remove('testing');
    button.textContent = 'Test Connection';
  });
}

// Add test button listeners
providers.forEach(provider => {
  testButtons[provider].addEventListener('click', () => testConnection(provider));
});

// Framework search and filter functionality
function setupFrameworkSearch() {
  function filterFrameworks() {
    const searchTerm = frameworkSearch.value.toLowerCase();
    const category = categoryFilter.value;
    let visibleCount = 0;

    document.querySelectorAll('.framework-category').forEach(categorySection => {
      const categoryName = categorySection.dataset.category;
      let hasVisibleFrameworks = false;

      categorySection.querySelectorAll('.framework-option').forEach(option => {
        const name = option.querySelector('.framework-name').textContent.toLowerCase();
        const description = option.querySelector('.framework-description').textContent.toLowerCase();
        
        const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
        const matchesCategory = !category || categoryName === category;
        
        if (matchesSearch && matchesCategory) {
          option.style.display = 'flex';
          hasVisibleFrameworks = true;
          visibleCount++;
        } else {
          option.style.display = 'none';
        }
      });

      // Show/hide category section based on visible frameworks
      categorySection.style.display = hasVisibleFrameworks ? 'block' : 'none';
    });

    // Show message if no results
    const noResults = document.getElementById('no-results') || (() => {
      const div = document.createElement('div');
      div.id = 'no-results';
      div.style.textAlign = 'center';
      div.style.padding = '16px';
      div.style.color = 'var(--text-secondary)';
      document.querySelector('.frameworks').appendChild(div);
      return div;
    })();

    if (visibleCount === 0) {
      noResults.textContent = 'No frameworks match your search';
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
    }
  }

  frameworkSearch.addEventListener('input', filterFrameworks);
  categoryFilter.addEventListener('change', filterFrameworks);
}

// Handle framework selection
let selectedFrameworkCount = 0;
frameworkCheckboxes.forEach(checkbox => {
  if (checkbox.checked) selectedFrameworkCount++;
  
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedFrameworkCount++;
      if (selectedFrameworkCount > 3) {
        e.target.checked = false;
        selectedFrameworkCount--;
        showStatus('Maximum 3 frameworks allowed', 'error');
        frameworkLimitWarning.classList.add('visible');
      } else {
        selectedFrameworks.push(e.target.value);
        if (selectedFrameworkCount === 3) {
          frameworkLimitWarning.classList.add('visible');
        }
      }
    } else {
      selectedFrameworkCount--;
      selectedFrameworks = selectedFrameworks.filter(fw => fw !== e.target.value);
      if (selectedFrameworkCount < 3) {
        frameworkLimitWarning.classList.remove('visible');
      }
    }
  });
});

// Initialize framework search on page load
document.addEventListener('DOMContentLoaded', () => {
  setupFrameworkSearch();
});

// Save settings
saveButton.addEventListener('click', async () => {
  const apiKeys = {};
  providers.forEach(provider => {
    const key = apiInputs[provider].value.trim();
    if (key) apiKeys[provider] = key;
  });

  // Validate provider selection
  if (!selectedProvider) {
    showStatus('Please select a provider', 'error');
    return;
  }

  // Validate API key for selected provider
  if (!apiKeys[selectedProvider]) {
    showStatus(`Please enter API key for ${selectedProvider}`, 'error');
    return;
  }

  // Validate model selection
  if (!selectedModel) {
    showStatus('Please select a model', 'error');
    return;
  }

  // Validate frameworks
  if (selectedFrameworks.length === 0) {
    showStatus('Please select at least one framework', 'error');
    return;
  }

  // Save to Chrome storage
  chrome.storage.sync.set({
    apiKeys,
    selectedModel,
    selectedFrameworks,
    advancedSettings
  }, () => {
    if (chrome.runtime.lastError) {
      showStatus(`Error saving settings: ${chrome.runtime.lastError.message}`, 'error');
      return;
    }

    // Notify background script
    chrome.runtime.sendMessage({
      type: 'SETTINGS_UPDATED',
      data: { apiKeys, selectedModel, selectedFrameworks, advancedSettings }
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus(`Error updating settings: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      
      if (!response) {
        showStatus('No response received from background script', 'error');
        return;
      }
      
      if (!response.success) {
        showStatus(`Error saving settings: ${response.error || 'Unknown error'}`, 'error');
        return;
      }
      
      showStatus('Settings saved successfully', 'success');
    });
  });
});

// Helper function to show status messages
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  // Clear status after 3 seconds
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }
}

// Helper function to show test status messages
function showTestStatus(element, message, type = 'info') {
  element.textContent = message;
  element.className = `status ${type}`;
  
  // Clear success/info status after 5 seconds
  if (type !== 'error') {
    setTimeout(() => {
      element.textContent = '';
      element.className = 'status';
    }, 5000);
  }
}

// Mask API keys in the UI
providers.forEach(provider => {
  const input = apiInputs[provider];
  input.addEventListener('focus', (e) => {
    e.target.type = 'text';
  });
  
  input.addEventListener('blur', (e) => {
    e.target.type = 'password';
  });
});