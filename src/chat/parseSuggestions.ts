/**
 * Utility to parse suggested prompts from assistant message content.
 * 
 * The assistant can include suggestions in a special code block:
 * ```suggestions
 * ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
 * ```
 * 
 * This function extracts those suggestions and returns the cleaned content.
 */

export interface ParsedSuggestions {
  /** The message content with suggestions block removed */
  cleanedContent: string;
  /** Array of suggested prompts, or empty array if none found */
  suggestions: string[];
}

/**
 * Parse suggestions from markdown content.
 * Looks for ```suggestions code blocks containing JSON arrays.
 */
export function parseSuggestions(content: string): ParsedSuggestions {
  // Match ```suggestions ... ``` blocks (with optional whitespace)
  const suggestionsRegex = /```suggestions\s*([\s\S]*?)```/g;
  
  let suggestions: string[] = [];
  let cleanedContent = content;
  
  // Find all suggestions blocks (though typically there should only be one)
  const matches = content.matchAll(suggestionsRegex);
  
  for (const match of matches) {
    const jsonString = match[1].trim();
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate it's an array of strings
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        suggestions = parsed;
      }
    } catch (e) {
      // Invalid JSON, skip this block
      console.warn('Failed to parse suggestions block:', e);
    }
    
    // Remove the suggestions block from content
    cleanedContent = cleanedContent.replace(match[0], '').trim();
  }
  
  return {
    cleanedContent,
    suggestions,
  };
}

/**
 * Check if content contains a suggestions block
 */
export function hasSuggestions(content: string): boolean {
  return /```suggestions\s*[\s\S]*?```/.test(content);
}
