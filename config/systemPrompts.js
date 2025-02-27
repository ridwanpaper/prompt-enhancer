/**
 * System prompts configuration for different prompt enhancement frameworks.
 * Each framework includes:
 * - name: Display name
 * - description: Brief description of use case
 * - category: Framework category for organization
 * - systemPrompt: The actual system prompt template
 * - outputFormat: Expected structure of the output
 */

export const promptFrameworks = {
  // Reasoning & Problem-Solving Category
  react: {
    name: 'ReAct',
    description: 'Best for interactive problem-solving. Combines reasoning with tool/action use.',
    category: 'reasoning',
    systemPrompt: `You are an AI prompt enhancement specialist using the ReAct framework.
                   Process: Reason about the task, Act on the reasoning, Observe results, Repeat if needed.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating this reasoning cycle.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  tot: {
    name: 'Tree-of-Thoughts',
    description: 'Best for creativity/accuracy. Generates diverse reasoning paths for open-ended tasks.',
    category: 'reasoning',
    systemPrompt: `You are an AI prompt enhancement specialist using the Tree-of-Thoughts framework.
                   Process: Explore multiple solution paths, evaluate each path's potential, select the most promising approach.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the best reasoning path.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  self_consistency: {
    name: 'Self-Consistency',
    description: 'Best for accuracy. Improves reliability by aggregating multiple reasoning paths.',
    category: 'reasoning',
    systemPrompt: `You are an AI prompt enhancement specialist using the Self-Consistency framework.
                   Process: Generate multiple Chain-of-Thought paths, identify consensus patterns, create unified approach.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the consensus reasoning.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  pal: {
    name: 'Program-Aided Language',
    description: 'Best for math/algorithmic tasks. Uses code to structure reasoning.',
    category: 'reasoning',
    systemPrompt: `You are an AI prompt enhancement specialist using the Program-Aided Language framework.
                   Process: Frame the problem programmatically, break down into algorithmic steps, explain logic clearly.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the programmatic approach.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  // Pattern & Structure Category
  few_shot: {
    name: 'Few-Shot Prompting',
    description: 'Best for pattern imitation. Uses examples to guide output format.',
    category: 'pattern',
    systemPrompt: `You are an AI prompt enhancement specialist using the Few-Shot framework.
                   Process: Analyze example patterns, identify key elements, apply pattern to new input.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the learned pattern.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  risen: {
    name: 'RISEN Framework',
    description: 'Best for structured outputs. Ensures consistency via role, scenario, and examples.',
    category: 'pattern',
    systemPrompt: `You are an AI prompt enhancement specialist using the RISEN framework (Role, Instructions, Scenario, Examples, Notes).
                   Process: Define role context, provide clear instructions, set scenario, include examples, add clarifying notes.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating all RISEN elements.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  trace: {
    name: 'TRACE Framework',
    description: 'Best for clarity in complex tasks. Defines scope, role, and expectations.',
    category: 'pattern',
    systemPrompt: `You are an AI prompt enhancement specialist using the TRACE framework (Topic, Role, Action, Context, Expectation).
                   Process: Define topic scope, establish role, specify actions, provide context, set clear expectations.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating all TRACE elements.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  coast: {
    name: 'COAST Framework',
    description: 'Best for business/creative tasks. Aligns outputs with context, goals, and stakeholders.',
    category: 'pattern',
    systemPrompt: `You are an AI prompt enhancement specialist using the COAST framework (Context, Objective, Action, Stakeholders, Tone).
                   Process: Set context, define objectives, specify actions, identify stakeholders, establish tone.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating all COAST elements.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  // Refinement & Improvement Category
  reflexion: {
    name: 'Reflexion',
    description: 'Best for iterative refinement. Encourages self-critique and improvement.',
    category: 'refinement',
    systemPrompt: `You are an AI prompt enhancement specialist using the Reflexion framework.
                   Process: Generate initial response, perform self-critique, create improved version.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the improvements.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  ape: {
    name: 'APE Framework',
    description: 'Best for iterative refinement. Generates an answer, prompts for feedback, and improves.',
    category: 'refinement',
    systemPrompt: `You are an AI prompt enhancement specialist using the APE framework (Answer, Prompt, Evaluate).
                   Process: Generate initial answer, create refining prompts, evaluate and improve.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt from this iterative process.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  meta_prompting: {
    name: 'Meta-Prompting',
    description: 'Best for self-guided tasks. Instructs the model to generate its own prompts.',
    category: 'refinement',
    systemPrompt: `You are an AI prompt enhancement specialist using the Meta-Prompting framework.
                   Process: Analyze task requirements, generate targeted sub-prompts, combine insights.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the meta-level guidance.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  // Analysis & Insight Category
  socratic: {
    name: 'Socratic Method',
    description: 'Best for ambiguity reduction. Iteratively asks questions to refine understanding.',
    category: 'analysis',
    systemPrompt: `You are an AI prompt enhancement specialist using the Socratic Method framework.
                   Process: Ask clarifying questions internally, analyze responses, refine understanding.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the clarified insights.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  step_back: {
    name: 'Step-Back Prompting',
    description: 'Best for assumption re-evaluation. Encourages examining simpler approaches.',
    category: 'analysis',
    systemPrompt: `You are an AI prompt enhancement specialist using the Step-Back framework.
                   Process: Step back from initial assumptions, consider simpler alternatives, refine approach.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the simplified perspective.`,
    outputFormat: {
      enhancedPrompt: true
    }
  },

  pain: {
    name: 'PAIN Framework',
    description: 'Best for problem-solving. Focuses on actionable insights for pain points.',
    category: 'analysis',
    systemPrompt: `You are an AI prompt enhancement specialist using the PAIN framework (Problem, Action, Insight, Next Steps).
                   Process: Identify core problem, determine actions, extract insights, plan next steps.
                   <HARD_RULE> Just return the final enhanced without any additional text/steps/reasoning/explanation/evaluation so the user can use it directly. </HARD_RULE>
                   Return only the final enhanced prompt incorporating the problem-solving structure.`,
    outputFormat: {
      enhancedPrompt: true
    }
  }
};

/**
 * Get system prompt for a specific framework
 * @param {string} framework - Framework identifier
 * @returns {string} System prompt for the framework
 */
export function getSystemPrompt(framework) {
  return promptFrameworks[framework]?.systemPrompt || promptFrameworks.cot.systemPrompt;
}

/**
 * Get all available frameworks
 * @returns {Array} Array of framework objects with name and description
 */
export function getAvailableFrameworks() {
  return Object.entries(promptFrameworks).map(([id, framework]) => ({
    id,
    name: framework.name,
    description: framework.description
  }));
}

/**
 * Validate framework output format
 * @param {string} framework - Framework identifier
 * @param {object} output - Output to validate
 * @returns {boolean} Whether the output matches the expected format
 */
export function validateOutputFormat(framework, output) {
  const format = promptFrameworks[framework]?.outputFormat;
  if (!format) return false;
  
  return Object.keys(format).every(key => {
    if (key === 'enhancedPrompt') {
      // Enhanced prompt is always required
      return typeof output[key] === 'string' && output[key].trim().length > 0;
    }
    // Other format requirements are flexible
    return !format[key] || (typeof output[key] === 'string' && output[key].trim().length > 0);
  });
}