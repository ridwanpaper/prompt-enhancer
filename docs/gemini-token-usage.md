# Gemini Token Usage Implementation

## Overview
This document outlines the plan for modifying the Gemini service implementation to correctly handle token usage information from the API response.

## Current Implementation
Currently, the Gemini parseResponse function in `llmConfig.js` returns `data.usage || {}`, which doesn't properly capture the token usage information provided by the Gemini API.

## Gemini API Response Structure
The Gemini API provides token usage information in the following structure:
```json
{
  "usageMetadata": {
    "promptTokenCount": 8,
    "candidatesTokenCount": 682,
    "totalTokenCount": 690,
    "promptTokensDetails": [
      {
        "modality": "TEXT",
        "tokenCount": 8
      }
    ],
    "candidatesTokensDetails": [
      {
        "modality": "TEXT",
        "tokenCount": 682
      }
    ]
  }
}
```

## Implementation Plan

### 1. Update parseResponse Function
Modify the Gemini configuration in `llmConfig.js` to extract token usage from `candidatesTokensDetails`:

```javascript
parseResponse: (data, model) => ({
  text: data.candidates[0].content.parts[0].text,
  model: model,
  usage: {
    total_tokens: data.usageMetadata?.totalTokenCount || 0,
    prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
    completion_tokens: data.usageMetadata?.candidatesTokenCount || 0
  }
})
```

### 2. Backward Compatibility
- Ensure the implementation handles cases where `usageMetadata` might be undefined
- Maintain consistent usage object structure across all providers
- Default to 0 for token counts if data is unavailable

### 3. Testing Plan
Test the implementation with:
1. Standard API response with complete usage metadata
2. Response without usage metadata (fallback case)
3. Response with partial usage metadata
4. Compare token counts with other providers' response formats

## Expected Outcome
- Accurate token usage reporting for Gemini API responses
- Consistent usage object structure across all providers
- Graceful handling of missing or incomplete usage data

## Next Steps
1. Switch to code mode to implement the changes
2. Test with actual API responses
3. Update documentation if needed