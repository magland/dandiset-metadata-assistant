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
 * Uses simple string searching instead of regex for more robust parsing.
 */
export function parseSuggestions(content: string): ParsedSuggestions {
  let suggestions: string[] = [];
  let cleanedContent = content;
  
  // Find ```suggestions marker
  const startMarker = '```suggestions';
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex !== -1) {
    // Find the closing ``` after the start marker
    const contentAfterMarker = content.substring(startIndex + startMarker.length);
    const endIndex = contentAfterMarker.indexOf('```');
    
    if (endIndex !== -1) {
      // Extract the JSON content between markers
      const jsonString = contentAfterMarker.substring(0, endIndex).trim();
      
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
      const fullBlockEnd = startIndex + startMarker.length + endIndex + 3; // +3 for closing ```
      cleanedContent = (
        content.substring(0, startIndex) + 
        content.substring(fullBlockEnd)
      ).trim();
    }
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
  const startIndex = content.indexOf('```suggestions');
  if (startIndex === -1) return false;
  
  const contentAfterMarker = content.substring(startIndex + '```suggestions'.length);
  return contentAfterMarker.indexOf('```') !== -1;
}
