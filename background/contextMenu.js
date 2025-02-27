import { handleMessage } from './messageHandler.js';

const MENU_ID = 'enhance-prompt';

/**
 * Initialize context menu
 */
export function initialize() {
  // Remove existing menu item if it exists
  try {
    chrome.contextMenus.remove(MENU_ID);
  } catch (error) {
    // Ignore error if menu doesn't exist
  }

  // Create context menu item
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Enhance Prompt',
    contexts: ['selection']
  });

  // Add click handler
  chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
}

/**
 * Handle context menu clicks
 * @param {object} info - Click information
 * @param {object} tab - Current tab
 */
async function handleContextMenuClick(info, tab) {
  if (info.menuItemId !== MENU_ID) return;

  const selectedText = info.selectionText;
  
  try {
    // Notify content script to show loading animation
    await chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_CLICKED'
    });

    // Get selected frameworks from storage
    const result = await chrome.storage.sync.get(['selectedFrameworks']);
    const frameworks = result.selectedFrameworks || [];

    if (frameworks.length === 0) {
      throw new Error('No frameworks selected. Please configure frameworks in extension settings.');
    }

    // Add small delay to ensure loading animation is visible
    await new Promise(resolve => setTimeout(resolve, 300));

    // Request prompt enhancement with frameworks
    const enhancementResult = await handleMessage({
      type: 'ENHANCE_PROMPT',
      text: selectedText,
      frameworks
    });

    // Send result to content script
    if (enhancementResult.success) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'PROMPT_ENHANCED',
        data: enhancementResult.data
      });
    } else {
      throw new Error(enhancementResult.error);
    }
  } catch (error) {
    console.error('Context menu handler error:', error);
    
    // Send error to content script
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

/**
 * Update context menu state
 * @param {boolean} enabled - Whether the menu should be enabled
 */
export function updateMenuState(enabled) {
  chrome.contextMenus.update(MENU_ID, {
    enabled
  });
}

/**
 * Update menu title with framework count
 * @param {number} count - Number of selected frameworks
 */
export function updateMenuTitle(count) {
  const suffix = count > 1 ? ` (${count} frameworks)` : '';
  chrome.contextMenus.update(MENU_ID, {
    title: `Enhance Prompt${suffix}`
  });
}