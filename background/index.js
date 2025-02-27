import { initialize as initializeMessageHandler, handleMessage } from './messageHandler.js';
import { initialize as initializeContextMenu, updateMenuState, updateMenuTitle } from './contextMenu.js';

/**
 * Initialize the background script
 */
async function initialize() {
  try {
    // Initialize message handler
    await initializeMessageHandler();
    
    // Initialize context menu
    initializeContextMenu();
    
    // Set up message listeners
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Handle the message and send response
      handleMessage(message, sender)
        .then(sendResponse)
        .catch(error => sendResponse({
          success: false,
          error: error.message
        }));
      
      // Return true to indicate we'll send response asynchronously
      return true;
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        handleStorageChanges(changes);
      }
    });

    console.log('Prompt Enhancer background script initialized');
  } catch (error) {
    console.error('Background script initialization failed:', error);
  }
}

/**
 * Handle changes to extension storage
 * @param {object} changes - Storage changes
 */
function handleStorageChanges(changes) {
  // Update menu state based on settings
  if (changes.apiKeys || changes.selectedFrameworks) {
    const hasApiKeys = changes.apiKeys?.newValue && 
      Object.values(changes.apiKeys.newValue).some(key => key?.trim());
    
    const hasFrameworks = changes.selectedFrameworks?.newValue?.length > 0;
    
    // Enable/disable menu based on valid configuration
    updateMenuState(hasApiKeys && hasFrameworks);
    
    // Update menu title with framework count
    if (changes.selectedFrameworks?.newValue) {
      updateMenuTitle(changes.selectedFrameworks.newValue.length);
    }
  }
}

// Initialize when extension is installed/updated
chrome.runtime.onInstalled.addListener(initialize);

// Also initialize on service worker startup to ensure functionality
initialize();