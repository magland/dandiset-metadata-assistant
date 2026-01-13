/**
 * Utility to parse suggested prompts from assistant message content.
 *
 * The assistant can include suggestions on a single line:
 * suggestions: first suggestion, second suggestion, third suggestion
 *
 * If a suggestion contains a comma, it should be wrapped in double quotes:
 * suggestions: first suggestion, "second, suggestion", third suggestion
 *
 * This function extracts those suggestions and returns the cleaned content.
 */

export interface ParsedSuggestions {
  /** The message content with suggestions line removed */
  cleanedContent: string;
  /** Array of suggested prompts, or empty array if none found */
  suggestions: string[];
}

/**
 * Parse comma-separated values, respecting quoted strings.
 * Handles: value1, value2, "value with, comma", value4
 */
function parseCommaSeparatedValues(line: string): string[] {
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      const trimmed = current.trim();
      if (trimmed) {
        results.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // Don't forget the last value
  const trimmed = current.trim();
  if (trimmed) {
    results.push(trimmed);
  }
  
  return results;
}

/**
 * Parse suggestions from markdown content.
 * Looks for a line starting with "suggestions:" containing comma-separated values.
 */
export function parseSuggestions(content: string): ParsedSuggestions {
  let suggestions: string[] = [];
  let cleanedContent = content;
  
  // Find line starting with "suggestions:"
  const lines = content.split('\n');
  const suggestionsLineIndex = lines.findIndex(line =>
    line.trim().toLowerCase().startsWith('suggestions:')
  );
  
  if (suggestionsLineIndex !== -1) {
    const suggestionsLine = lines[suggestionsLineIndex];
    const colonIndex = suggestionsLine.indexOf(':');
    
    if (colonIndex !== -1) {
      const valuesStr = suggestionsLine.substring(colonIndex + 1).trim();
      suggestions = parseCommaSeparatedValues(valuesStr);
      
      // Remove the suggestions line from content
      lines.splice(suggestionsLineIndex, 1);
      cleanedContent = lines.join('\n').trim();
    }
  }
  
  return {
    cleanedContent,
    suggestions,
  };
}

/**
 * Check if content contains a suggestions line
 */
export function hasSuggestions(content: string): boolean {
  const lines = content.split('\n');
  return lines.some(line => line.trim().toLowerCase().startsWith('suggestions:'));
}
