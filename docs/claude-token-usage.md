# Claude Token Usage Implementation

## Overview
This document outlines the plan for modifying the Claude service implementation to correctly handle token usage information from the API response.

## Current Implementation
Currently, the Claude parseResponse function in `llmConfig.js` returns `data.usage || {}`, which needs to be updated to properly extract the output tokens count.

## Claude API Response Structure
The Claude API provides token usage information in the following structure:
```json
{
  "usage": {
    "input_tokens": 10,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "output_tokens": 39
  }
}
```

## Implementation Plan

### 1. Update parseResponse Function
Modify the Claude configuration in `llmConfig.js` to extract token usage:

```javascript
parseResponse: (data) => ({
  text: data.content[0].text,
  model: data.model,
  usage: {
    total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    prompt_tokens: data.usage?.input_tokens || 0,
    completion_tokens: data.usage?.output_tokens || 0
  }
})
```

### 2. Backward Compatibility
- Ensure the implementation handles cases where usage might be undefined
- Maintain consistent usage object structure across all providers
- Default to 0 for token counts if data is unavailable

### 3. Testing Plan
Test the implementation with:
1. Standard API response with complete usage data
2. Response without usage data (fallback case)
3. Response with partial usage data
4. Compare token counts with other providers' response formats

## Expected Outcome
- Accurate token usage reporting for Claude API responses
- Consistent usage object structure across all providers
- Graceful handling of missing or incomplete usage data

## Next Steps
1. Switch to code mode to implement the changes
2. Test with actual API responses
3. Update documentation if needed