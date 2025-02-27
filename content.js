// Create and inject modal styles
const style = document.createElement('style');
style.textContent = `
  .prompt-enhancer-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    display: none;
  }

  .prompt-enhancer-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }

  .prompt-enhancer-modal-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .prompt-enhancer-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    color: #666;
  }

  .prompt-enhancer-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .prompt-enhancer-tab {
    padding: 8px 16px;
    border: none;
    background: #f5f5f5;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .prompt-enhancer-tab.active {
    background: #2196F3;
    color: white;
  }

  .prompt-enhancer-content {
    margin-bottom: 16px;
  }

  .prompt-enhancer-prompt {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 16px;
    white-space: pre-wrap;
  }

  .prompt-enhancer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .prompt-enhancer-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .prompt-enhancer-apply {
    background: #2196F3;
    color: white;
  }

  .prompt-enhancer-copy {
    background: #f5f5f5;
  }

  .prompt-enhancer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: none;
  }

  .prompt-enhancer-loading {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10001;
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    min-width: 300px;
  }

  .prompt-enhancer-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #2196F3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.6; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.6; }
  }

  .prompt-enhancer-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .prompt-enhancer-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #666;
    font-size: 16px;
    width: 100%;
  }

  .prompt-enhancer-step.active {
    color: #2196F3;
    font-weight: 600;
  }

  .prompt-enhancer-step.completed {
    color: #4caf50;
  }

  .prompt-enhancer-step-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    background: white;
  }

  .prompt-enhancer-step.active .prompt-enhancer-step-indicator {
    border-color: #2196F3;
    background: #2196F3;
    color: white;
  }

  .prompt-enhancer-step.completed .prompt-enhancer-step-indicator {
    border-color: #4caf50;
    background: #4caf50;
    color: white;
  }
`;
document.head.appendChild(style);

// Create loading overlay
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'prompt-enhancer-loading';
loadingOverlay.innerHTML = `
  <div class="prompt-enhancer-spinner"></div>
  <div class="prompt-enhancer-steps">
    <div class="prompt-enhancer-step" data-step="initialize">
      <span>Refining your prompt</span>
      <div style="width: 16px; height: 16px; background: #2196F3; border-radius: 50%; box-shadow: 0 0 15px rgba(33, 150, 243, 0.4); animation: pulse 2s ease-in-out infinite;"></div>
    </div>
  </div>
`;

// Create modal elements
const modal = document.createElement('div');
modal.className = 'prompt-enhancer-modal';
modal.innerHTML = `
  <div class="prompt-enhancer-modal-header">
    <h2 class="prompt-enhancer-modal-title">Enhanced Prompts</h2>
    <button class="prompt-enhancer-close">&times;</button>
  </div>
  <div class="prompt-enhancer-tabs"></div>
  <div class="prompt-enhancer-content"></div>
  <div class="prompt-enhancer-actions">
    <button class="prompt-enhancer-button prompt-enhancer-copy">Copy</button>
    <button class="prompt-enhancer-button prompt-enhancer-apply">Apply</button>
  </div>
`;

const overlay = document.createElement('div');
overlay.className = 'prompt-enhancer-overlay';

document.body.appendChild(overlay);
document.body.appendChild(modal);
document.body.appendChild(loadingOverlay);

// Track the currently selected element and enhanced prompts
let selectedElement = null;
let selectedText = '';
let selectionStart = 0;
let selectionEnd = 0;
let enhancedPrompts = [];
let activeTabIndex = 0;

// Function to show/hide loading overlay
function showLoading() {
  loadingOverlay.style.display = 'flex';
  overlay.style.display = 'block';
  updateLoadingStep('initialize');
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
  overlay.style.display = 'none';
  // Reset step text
  loadingOverlay.querySelectorAll('.prompt-enhancer-step span').forEach(span => {
    span.textContent = span.textContent.split(' - ')[0];
  });
}

// Function to update loading step
function updateLoadingStep(step, details = '') {
  const steps = loadingOverlay.querySelectorAll('.prompt-enhancer-step');
  const stepOrder = ['initialize', 'process', 'framework', 'refine', 'complete'];
  const currentIndex = stepOrder.indexOf(step);

  steps.forEach((stepEl, index) => {
    stepEl.classList.remove('active', 'completed');
    if (index < currentIndex) {
      stepEl.classList.add('completed');
    } else if (index === currentIndex) {
      stepEl.classList.add('active');
      if (details) {
        const span = stepEl.querySelector('span');
        span.textContent = `${span.textContent.split(' - ')[0]} - ${details}`;
      }
    }
  });
}

// Listen for enhanced prompts from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ENHANCEMENT_PROGRESS') {
    updateLoadingStep(message.data.step, message.data.details);
  } else if (message.type === 'PROMPT_ENHANCED') {
    hideLoading();
    enhancedPrompts = message.data.enhanced;
    selectedText = message.data.original;
    showModal(message.data.original);
  } else if (message.type === 'ENHANCEMENT_ERROR') {
    hideLoading();
    alert(`Error enhancing prompt: ${message.error}`);
  }
});

// Show loading when context menu item is clicked
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONTEXT_MENU_CLICKED') {
    showLoading();
  }
});

// Show modal with enhanced prompts
function showModal(originalPrompt) {
  const tabsContainer = modal.querySelector('.prompt-enhancer-tabs');
  const contentContainer = modal.querySelector('.prompt-enhancer-content');
  
  // Create tabs
  tabsContainer.innerHTML = enhancedPrompts
    .map((prompt, index) => `
      <button class="prompt-enhancer-tab ${index === 0 ? 'active' : ''}" 
              data-index="${index}">
        ${prompt.framework.toUpperCase()}
      </button>
    `)
    .join('');
    
  // Show first prompt
  showPrompt(0);
  
  // Show modal and overlay
  modal.style.display = 'block';
  overlay.style.display = 'block';
}

// Show specific prompt
function showPrompt(index) {
  const contentContainer = modal.querySelector('.prompt-enhancer-content');
  const prompt = enhancedPrompts[index];
  
  contentContainer.innerHTML = `
    <div class="prompt-enhancer-prompt">${prompt.enhanced}</div>
    <div style="font-size: 12px; color: #666;">
      Enhanced using ${prompt.framework.toUpperCase()} framework via ${prompt.service} (${prompt.model})${prompt.usage?.total_tokens ? ` - ${prompt.usage.total_tokens} tokens` : ''}
    </div>
  `;
  
  activeTabIndex = index;
  
  // Update active tab
  modal.querySelectorAll('.prompt-enhancer-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });
}

// Handle tab clicks
modal.querySelector('.prompt-enhancer-tabs').addEventListener('click', (e) => {
  if (e.target.classList.contains('prompt-enhancer-tab')) {
    const index = parseInt(e.target.dataset.index);
    showPrompt(index);
  }
});

// Handle close button
modal.querySelector('.prompt-enhancer-close').addEventListener('click', () => {
  modal.style.display = 'none';
  overlay.style.display = 'none';
});

// Handle overlay click
overlay.addEventListener('click', () => {
  modal.style.display = 'none';
  overlay.style.display = 'none';
  hideLoading();
});

// Handle copy button
modal.querySelector('.prompt-enhancer-copy').addEventListener('click', () => {
  const promptText = enhancedPrompts[activeTabIndex].enhanced;
  navigator.clipboard.writeText(promptText).then(() => {
    const copyButton = modal.querySelector('.prompt-enhancer-copy');
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = 'Copy';
    }, 2000);
  });
});

// Handle apply button
modal.querySelector('.prompt-enhancer-apply').addEventListener('click', () => {
  const promptText = enhancedPrompts[activeTabIndex].enhanced;
  replaceSelectedText(promptText);
  modal.style.display = 'none';
  overlay.style.display = 'none';
});

// Track selected element and text
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection.toString().trim()) {
    // Store selection details
    selectedText = selection.toString();
    const range = selection.getRangeAt(0);
    selectedElement = range.startContainer.parentElement;
    
    // Handle different input types
    if (selectedElement.tagName === 'TEXTAREA' || 
        (selectedElement.tagName === 'INPUT' && selectedElement.type === 'text')) {
      selectionStart = selectedElement.selectionStart;
      selectionEnd = selectedElement.selectionEnd;
    } else if (selectedElement.isContentEditable) {
      // For contenteditable elements, we need to preserve the range
      const tempRange = document.createRange();
      tempRange.setStart(range.startContainer, range.startOffset);
      tempRange.setEnd(range.endContainer, range.endOffset);
      selectedElement.dataset.enhancerRange = JSON.stringify({
        start: range.startOffset,
        end: range.endOffset
      });
    }
  }
});

// Function to replace selected text
function replaceSelectedText(newText) {
  if (!selectedElement) return;

  if (selectedElement.tagName === 'TEXTAREA' || 
      (selectedElement.tagName === 'INPUT' && selectedElement.type === 'text')) {
    // Handle standard input elements
    const start = selectionStart;
    const end = selectionEnd;
    const currentValue = selectedElement.value;
    
    selectedElement.value = currentValue.substring(0, start) + 
                          newText +
                          currentValue.substring(end);
    
    // Trigger input event for reactive frameworks
    selectedElement.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Restore cursor position
    selectedElement.selectionStart = start + newText.length;
    selectedElement.selectionEnd = start + newText.length;
    
  } else if (selectedElement.isContentEditable) {
    // Handle contenteditable elements
    const range = selectedElement.dataset.enhancerRange ? 
                 JSON.parse(selectedElement.dataset.enhancerRange) : null;
    
    if (range) {
      const textNode = selectedElement.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const currentText = textNode.nodeValue;
        textNode.nodeValue = currentText.substring(0, range.start) +
                           newText +
                           currentText.substring(range.end);
        
        // Trigger input event for reactive frameworks
        selectedElement.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }
    }
    
    // Clean up stored range
    delete selectedElement.dataset.enhancerRange;
  }
  
  // Focus the element
  selectedElement.focus();
}