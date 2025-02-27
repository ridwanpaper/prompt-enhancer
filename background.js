// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'enhance-prompt',
    title: 'Enhance Prompt',
    contexts: ['selection']
  });
});

// Store for API configurations
let apiKeys = {};
let selectedFrameworks = [];

// Load settings when background script starts
chrome.storage.sync.get(['apiKeys', 'selectedFrameworks'], (result) => {
  apiKeys = result.apiKeys || {};
  selectedFrameworks = result.selectedFrameworks || [];
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    apiKeys = message.data.apiKeys;
    selectedFrameworks = message.data.selectedFrameworks;
    sendResponse({ success: true });
  } else if (message.type === 'TEST_CONNECTION') {
    testConnection(message.service, message.apiKey)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'enhance-prompt') {
    const selectedText = info.selectionText;
    
    try {
      // Validate we have at least one API key and framework
      if (!hasValidConfiguration()) {
        throw new Error('Please configure API keys and select frameworks in the extension settings');
      }

      // Get active frameworks with API keys
      const activeFrameworks = getActiveFrameworks();
      if (activeFrameworks.length === 0) {
        throw new Error('No frameworks selected or no valid API keys available');
      }

      const enhancedPrompts = await Promise.all(
        activeFrameworks.map(framework => 
          enhancePrompt(selectedText, framework)
        )
      );

      // Send enhanced prompts to content script
      await chrome.tabs.sendMessage(tab.id, {
        type: 'PROMPT_ENHANCED',
        data: {
          original: selectedText,
          enhanced: enhancedPrompts
        }
      });
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'ENHANCEMENT_ERROR',
          error: error.message
        });
      } catch (sendError) {
        console.error('Error sending error message:', sendError);
      }
    }
  }
});

// Test API connections
async function testConnection(service, apiKey) {
  if (!apiKey?.trim()) {
    throw new Error('Please enter an API key');
  }

  try {
    switch (service) {
      case 'openai':
        return await testOpenAI(apiKey);
      case 'gemini':
        return await testGemini(apiKey);
      case 'claude':
        return await testClaude(apiKey);
      default:
        throw new Error('Unknown service');
    }
  } catch (error) {
    console.error(`${service} test failed:`, error);
    throw error;
  }
}

// Test OpenAI API connection
async function testOpenAI(apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hi'
        }
      ],
      max_tokens: 50
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Invalid API key');
  }

  const data = await response.json();
  return { 
    success: true,
    response: data.choices[0].message.content
  };
}

// Test Gemini API connection
async function testGemini(apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hi'
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Invalid API key');
  }

  const data = await response.json();
  return { 
    success: true,
    response: data.candidates[0].content.parts[0].text
  };
}

// Test Claude API connection
async function testClaude(apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Hi'
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Invalid API key');
  }

  const data = await response.json();
  return { 
    success: true,
    response: data.content[0].text
  };
}

// Function to enhance prompt using specified framework
async function enhancePrompt(text, framework) {
  const service = getServiceForFramework(framework);
  const apiKey = apiKeys[service];

  if (!apiKey) {
    throw new Error(`No API key available for ${service}`);
  }

  switch (service) {
    case 'openai':
      return await enhanceWithOpenAI(text, framework);
    case 'gemini':
      return await enhanceWithGemini(text, framework);
    case 'claude':
      return await enhanceWithClaude(text, framework);
    default:
      throw new Error('No working API service available');
  }
}

// OpenAI API integration
async function enhanceWithOpenAI(text, framework) {
  const systemPrompt = getSystemPrompt(framework);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKeys.openai}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    framework,
    enhanced: data.choices[0].message.content,
    service: 'openai'
  };
}

// Google Gemini API integration
async function enhanceWithGemini(text, framework) {
  const systemPrompt = getSystemPrompt(framework);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.gemini}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nUser Input: ${text}`
        }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  return {
    framework,
    enhanced: data.candidates[0].content.parts[0].text,
    service: 'gemini'
  };
}

// Anthropic Claude API integration
async function enhanceWithClaude(text, framework) {
  const systemPrompt = getSystemPrompt(framework);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKeys.claude,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: text
      }],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  if (!data.content?.[0]?.text) {
    throw new Error('Invalid response from Claude API');
  }

  return {
    framework,
    enhanced: data.content[0].text,
    service: 'claude'
  };
}

// Get system prompt for specified framework
function getSystemPrompt(framework) {
  const prompts = {
    cot: `You are an AI prompt enhancement specialist using the Chain-of-Thought framework.
          Analyze the given prompt and enhance it by breaking it down into logical steps.
          Format the output as:
          Step 1: [Initial understanding]
          Step 2: [Intermediate reasoning]
          Step 3: [Final conclusion]
          Enhanced prompt: [The complete enhanced prompt]`,
    
    risen: `You are an AI prompt enhancement specialist using the RISEN framework.
            Analyze the given prompt and enhance it by adding Role, Instructions, Scenario, Examples, and Notes.
            Format the output as:
            Role: [Specific role]
            Instructions: [Clear task instructions]
            Scenario: [Contextual background]
            Examples: [Relevant examples]
            Notes: [Additional guidance]
            Enhanced prompt: [The complete enhanced prompt]`,
    
    ape: `You are an AI prompt enhancement specialist using the APE framework.
          Analyze the given prompt and enhance it through Answer, Prompt, and Evaluation.
          Format the output as:
          Initial Answer: [Based on original prompt]
          Refined Prompt: [Enhanced version]
          Evaluation: [Comparison and improvements]
          Final Enhanced Prompt: [The complete enhanced prompt]`
  };
  
  return prompts[framework] || prompts.cot;
}

// Validate configuration
function hasValidConfiguration() {
  return (
    Object.values(apiKeys).some(key => key?.trim()) && 
    selectedFrameworks.length > 0
  );
}

// Get frameworks that have corresponding API keys
function getActiveFrameworks() {
  return selectedFrameworks.filter(framework => {
    const service = getServiceForFramework(framework);
    return apiKeys[service]?.trim();
  });
}

// Map framework to service
function getServiceForFramework(framework) {
  // Prioritize services in order: OpenAI, Gemini, Claude
  if (apiKeys.openai) return 'openai';
  if (apiKeys.gemini) return 'gemini';
  if (apiKeys.claude) return 'claude';
  return 'openai'; // Default to OpenAI
}